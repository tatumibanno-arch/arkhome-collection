import emailjs from '@emailjs/browser';
import { Request, RoutingInfo } from '@/types';

// EmailJS初期化
let emailjsInitialized = false;

export function initEmailJS(publicKey: string) {
  if (!emailjsInitialized && publicKey) {
    emailjs.init({ publicKey });
    emailjsInitialized = true;
  }
}

// Slack Webhook通知（API Route経由でCORS回避）
export async function sendSlackNotification(req: Request, webhookUrl: string): Promise<boolean> {
  if (!webhookUrl) return false;

  const rt = req.routing_none;
  const carrierName = rt?.carrier?.name || '未設定';

  const message = {
    text: `🚛 【現場回収依頼】新規依頼が届きました`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚛 新規回収依頼',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*依頼番号:*\n${req.request_code}` },
          { type: 'mrkdwn', text: `*受付日:*\n${new Date(req.created_at).toLocaleDateString('ja-JP')}` },
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
      {
        type: 'divider',
      },
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
            text: {
              type: 'plain_text',
              text: '📋 依頼の詳細を開く',
              emoji: true,
            },
            url: `https://arkhome-collection.vercel.app/?open=${req.id}`,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch('/api/slack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl, message }),
    });
    return response.ok;
  } catch (error) {
    console.error('Slack notification failed:', error);
    return false;
  }
}

// EmailJS通知
export async function sendEmailNotification(
  req: Request,
  config: {
    sharedEmail: string;
    serviceId: string;
    templateId: string;
    publicKey: string;
  }
): Promise<boolean> {
  if (!config.sharedEmail || !config.serviceId || !config.templateId || !config.publicKey) {
    // 設定不足の場合はmailtoを開く
    openMailto(req, config.sharedEmail);
    return false;
  }

  initEmailJS(config.publicKey);

  const rt = req.routing_none;
  const carrierName = rt?.carrier?.name || '未設定';
  const targets = [config.sharedEmail, req.email].filter(Boolean).join(',');

  const body = createEmailBody(req, carrierName);

  try {
    await emailjs.send(config.serviceId, config.templateId, {
      to_email: targets,
      subject: `【現場回収依頼】${req.store_name} ${req.customer_name}`,
      message: body,
      req_id: req.request_code,
      store_name: req.store_name,
      cname: req.customer_name,
      addr: (req.zip ? '〒' + req.zip + ' ' : '') + req.address,
      date: req.collection_date,
      time: req.time_from + '〜' + req.time_to,
      asb: req.has_asbestos ? '有' : '無',
      carrier: carrierName,
    });
    return true;
  } catch (error) {
    console.error('EmailJS failed:', error);
    openMailto(req, config.sharedEmail);
    return false;
  }
}

// メール本文生成
function createEmailBody(req: Request, carrierName: string): string {
  return `【現場回収依頼】新規依頼が届きました

依頼番号: ${req.request_code}
受付日: ${new Date(req.created_at).toLocaleDateString('ja-JP')}

■ 依頼店舗
${req.store_name}
担当者: ${req.staff}（${req.staff_tel}）
メール: ${req.email}

■ 現場情報
お客様名: ${req.customer_name}
住所: ${req.zip ? '〒' + req.zip + ' ' : ''}${req.address}
施工業者: ${req.builder || 'なし'}
現場責任者: ${req.chief}（${req.chief_tel}）

■ 回収情報
回収希望日: ${req.collection_date}（${req.time_from}〜${req.time_to}）
車両: ${req.car_size || '未指定'}
補助人工: ${req.helper === 'yes' ? '要' : '無'}

■ 排出量
キッチン: ${req.vol_kitchen || 0}㎡　バス: ${req.vol_bath || 0}㎡
トイレ: ${req.vol_toilet || 0}㎡　その他: ${req.vol_other || 0}㎡
アスベスト: ${req.has_asbestos ? '有（' + req.vol_asbestos + '㎡）' : '無'}

■ 担当業者（石綿なし）
収集運搬: ${carrierName}

備考: ${req.note || 'なし'}`;
}

// mailto リンクを開く
function openMailto(req: Request, sharedEmail: string | null) {
  const rt = req.routing_none;
  const carrierName = rt?.carrier?.name || '未設定';
  const body = createEmailBody(req, carrierName);
  const targets = [sharedEmail, req.email].filter(Boolean).join(',');
  const subject = `【現場回収依頼】${req.store_name} ${req.customer_name}`;
  const mailto = `mailto:${targets}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto);
}

// 統合通知送信
export async function sendNotifications(
  req: Request,
  emailConfig: {
    sharedEmail: string | null;
    serviceId: string | null;
    templateId: string | null;
    publicKey: string | null;
    slackWebhookUrl: string | null;
  }
): Promise<{ slack: boolean; email: boolean }> {
  const results = { slack: false, email: false };

  // Slack通知
  if (emailConfig.slackWebhookUrl) {
    results.slack = await sendSlackNotification(req, emailConfig.slackWebhookUrl);
  }

  // Email通知
  if (emailConfig.sharedEmail) {
    results.email = await sendEmailNotification(req, {
      sharedEmail: emailConfig.sharedEmail,
      serviceId: emailConfig.serviceId || '',
      templateId: emailConfig.templateId || '',
      publicKey: emailConfig.publicKey || '',
    });
  }

  return results;
}
