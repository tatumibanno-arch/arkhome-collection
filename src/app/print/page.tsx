'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Request } from '@/types';
import { getRequestById } from '@/lib/api';
import Manifest from '@/components/Manifest';

function PrintContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const type = (searchParams.get('type') || 'none') as 'none' | 'asb';

  const [request, setRequest] = useState<Request | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('依頼IDが指定されていません');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const data = await getRequestById(id);
        if (!data) {
          setError('依頼が見つかりません');
        } else {
          setRequest(data);
        }
      } catch (e) {
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  // データ読み込み完了後に自動印刷
  useEffect(() => {
    if (request && !loading) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [request, loading]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'red' }}>
        {error}
      </div>
    );
  }

  if (!request) return null;

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* 画面表示用ヘッダー（印刷時は非表示） */}
      <div className="print-header" style={{
        padding: '12px 20px',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 20px',
            background: '#1a5c3a',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🖨 印刷 / PDF保存
        </button>
        <button
          onClick={() => window.close()}
          style={{
            padding: '8px 16px',
            background: '#fff',
            color: '#333',
            border: '1.5px solid #ccc',
            borderRadius: '8px',
            fontSize: '13px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ✕ 閉じる
        </button>
        <span style={{ fontSize: '12px', color: '#888' }}>
          {request.store_name} — {request.request_code}
          {type === 'asb' ? '（石綿含有）' : ''}
        </span>
      </div>

      {/* マニフェスト本体 */}
      <div style={{ padding: '16px' }}>
        <Manifest request={request} type={type} />
      </div>
    </div>
  );
}

export default function PrintPage() {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: '#999' }}>読み込み中...</div>}>
      <PrintContent />
    </Suspense>
  );
}
