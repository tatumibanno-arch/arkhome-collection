'use client';

import { ToastProvider } from '@/components/Toast';
import RequestForm from '@/components/RequestForm';

export default function FormPage() {
  return (
    <ToastProvider>
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        {/* シンプルなヘッダー */}
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
        
        {/* フォームのみ */}
        <div style={{
          padding: '24px 18px',
          maxWidth: '880px',
          margin: '0 auto',
        }}>
          <RequestForm 
            onSubmitSuccess={() => {
              // フォーム送信後の処理（必要に応じて）
            }} 
          />
        </div>
      </div>
    </ToastProvider>
  );
}
