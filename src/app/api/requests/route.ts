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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Create request API error:', error);
    return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
  }
}
