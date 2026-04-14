import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    // Webhook URLはサーバー側の環境変数から取得（クライアントからは受け取らない）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Slack webhook not configured' }, { status: 500 });
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: response.status });
    }
  } catch (error) {
    console.error('Slack webhook error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
