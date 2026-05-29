import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

// サーバーサイド専用のSupabaseクライアント（service_role keyで書き込み可能）
// お客様フォームはブラウザから直接Supabaseへ書き込まず、この同一オリジンAPI経由で保存する。
// （店舗側ネットワークが外部ドメインへの書き込みを遮断していても、自サイト宛なら通るため）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateRequestCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(8);
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return 'REQ-' + code;
}

// 保存成功後にサーバー側からSlackへ通知する。
// お客様フォームはログアウト状態でブラウザから通知できないため、ここで確実に飛ばす。
// 通知失敗は保存の成否に影響させない（必ず握りつぶす）。
async function notifySlack(req: any): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    const rt =
      typeof req.routing_none === 'string'
        ? JSON.parse(req.routing_none)
        : req.routing_none || {};
    const carrierName = rt?.carrier?.name || '未設定';
    const uketsuke = new Date(req.created_at || Date.now()).toLocaleDateString('ja-JP', {
      timeZone: 'Asia/Tokyo',
    });

    const message = {
      text: '🚛 【現場回収依頼】新規依頼が届きました',
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: '🚛 新規回収依頼', emoji: true } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*依頼番号:*\n${req.request_code}` },
            { type: 'mrkdwn', text: `*受付日:*\n${uketsuke}` },
          ],
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*依頼店舗:*\n${req.store_name}` },
            { type: 'mrkdwn', text: `*担当者:*\n${req.staff}（${req.staff_tel}）` },
          ],
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*お客様名:*\n${req.customer_name}` },
            { type: 'mrkdwn', text: `*住所:*\n${req.zip ? '〒' + req.zip + ' ' : ''}${req.address}` },
          ],
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*回収希望日:*\n${req.collection_date}（${req.time_from}〜${req.time_to}）` },
            { type: 'mrkdwn', text: `*アスベスト:*\n${req.has_asbestos ? '⚠️ 有（' + req.vol_asbestos + '㎡）' : '無'}` },
          ],
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*収集運搬業者:*\n${carrierName}` },
            { type: 'mrkdwn', text: `*車両:*\n${req.car_size || '未指定'}` },
          ],
        },
        { type: 'divider' },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `現場責任者: ${req.chief}（${req.chief_tel}）${req.builder ? ' / 施工業者: ' + req.builder : ''}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '📋 依頼の詳細を開く', emoji: true },
              url: `https://arkhome-collection.vercel.app/?open=${req.id}`,
              style: 'primary',
            },
          ],
        },
      ],
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
  } catch (e) {
    console.error('Slack notify (server) failed:', e);
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body || !body.store_id) {
      return NextResponse.json({ error: 'store_id is required' }, { status: 400 });
    }

    const request_code = generateRequestCode();

    const { data, error } = await supabaseAdmin
      .from('requests')
      .insert({ ...body, request_code })
      .select()
      .single();

    if (error) {
      // 失敗理由をクライアントに返す（フォームの「エラー詳細」表示に活用）
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details, hint: error.hint },
        { status: 400 }
      );
    }

    // 保存成功後、サーバー側からSlack通知（失敗しても保存は成功扱い）
    await notifySlack(data);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create request API error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
