'use client';

import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import RequestForm from '@/components/RequestForm';
import { Request } from '@/types';

export default function FormPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<Request | null>(null);

  if (submitted && submittedRequest) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{
          background: 'var(--tx)',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
        }}>
          <div className="brand">
            共栄紙業 / <b>Arc Home</b>
          </div>
        </nav>

        <div style={{
          maxWidth: '600px',
          margin: '60px auto',
          padding: '48px 32px',
          background: 'var(--sur)',
          borderRadius: '16px',
          boxShadow: 'var(--sh)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--tx)',
            marginBottom: '12px',
          }}>
            回収依頼を受け付けました
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--tx2)',
            lineHeight: 1.8,
            marginBottom: '24px',
          }}>
            ご依頼ありがとうございます。<br />
            内容を確認のうえ、担当者よりご連絡いたします。
          </p>

          <div style={{
            background: 'var(--sur2)',
            borderRadius: '10px',
            padding: '16px 20px',
            marginBottom: '28px',
            textAlign: 'left',
            fontSize: '13px',
            lineHeight: 1.8,
            color: 'var(--tx2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bdr)', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>依頼番号</span>
              <span style={{ fontWeight: 700, color: 'var(--tx)', fontFamily: 'monospace' }}>{submittedRequest.request_code}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bdr)', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>店舗</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{submittedRequest.store_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--bdr)', paddingBottom: '8px', marginBottom: '8px' }}>
              <span>お客様名</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{submittedRequest.customer_name}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>回収希望日</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>{submittedRequest.collection_date}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setSubmitted(false);
              setSubmittedRequest(null);
            }}
            style={{
              background: 'var(--g)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            新しい依頼を作成
          </button>
        </div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <nav style={{
          background: 'var(--tx)',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 18px',
        }}>
          <div className="brand">
            共栄紙業 / <b>Arc Home</b>
          </div>
        </nav>
        
        <div style={{
          padding: '24px 18px',
          maxWidth: '880px',
          margin: '0 auto',
        }}>
          <RequestForm 
            onSubmitSuccess={(request: Request) => {
              setSubmittedRequest(request);
              setSubmitted(true);
            }} 
          />
        </div>
      </div>
    </ToastProvider>
  );
}
