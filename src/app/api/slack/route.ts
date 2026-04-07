import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookUrl, message } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL is required' }, { status: 400 });
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
