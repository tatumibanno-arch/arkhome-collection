'use client';

import { Request, RequestStatus, STATUSES, STATUS_BG, STATUS_FG } from '@/types';

interface ListViewProps {
  requests: Request[];
  onCardClick: (request: Request) => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onPrintManifest: (request: Request) => void;
}

export default function ListView({
  requests,
  onCardClick,
  onStatusChange,
  onPrintManifest,
}: ListViewProps) {
  const handleForward = (e: React.MouseEvent, request: Request) => {
    e.stopPropagation();
    const currentStatus = parseInt(request.status);
    if (currentStatus < 5) {
      onStatusChange(request.id, String(currentStatus + 1) as RequestStatus);
    }
  };

  const handleBackward = (e: React.MouseEvent, request: Request) => {
    e.stopPropagation();
    const currentStatus = parseInt(request.status);
    if (currentStatus > 0) {
      onStatusChange(request.id, String(currentStatus - 1) as RequestStatus);
    }
  };

  const handlePrint = (e: React.MouseEvent, request: Request) => {
    e.stopPropagation();
    onPrintManifest(request);
  };

  if (requests.length === 0) {
    return (
      <table className="lst">
        <thead>
          <tr>
            <th>ID</th>
            <th>店舗</th>
            <th>お客様名</th>
            <th>住所</th>
            <th>依頼日</th>
            <th>回収日</th>
            <th>担当業者</th>
            <th>石綿</th>
            <th>ステータス</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={10}
              style={{ textAlign: 'center', padding: '24px', color: 'var(--tx3)' }}
            >
              該当する依頼がありません
            </td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table className="lst">
      <thead>
        <tr>
          <th>ID</th>
          <th>店舗</th>
          <th>お客様名</th>
          <th>住所</th>
          <th>依頼日</th>
          <th>回収日</th>
          <th>担当業者</th>
          <th>石綿</th>
          <th>ステータス</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id} onClick={() => onCardClick(request)}>
            <td
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                color: 'var(--tx3)',
              }}
            >
              {request.request_code}
            </td>
            <td style={{ fontWeight: 600 }}>{request.store_name}</td>
            <td>
              {request.customer_name}
              {request.has_asbestos && <span className="asb-tag">石綿</span>}
            </td>
            <td style={{ color: 'var(--tx2)', fontSize: '12px' }}>
              {request.address}
            </td>
            <td style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'var(--tx2)' }}>
              {new Date(request.created_at).toLocaleDateString('ja-JP')}
            </td>
            <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
              {request.collection_date}
            </td>
            <td style={{ fontSize: '12px' }}>
              {request.routing_none?.carrier?.name || '—'}
            </td>
            <td>
              {request.has_asbestos ? (
                <span style={{ color: 'var(--rd)', fontWeight: 700 }}>有</span>
              ) : (
                '無'
              )}
            </td>
            <td>
              <span
                className="st-badge"
                style={{
                  background: STATUS_BG[request.status],
                  color: STATUS_FG[request.status],
                }}
              >
                {STATUSES[request.status]}
              </span>
            </td>
            <td
              onClick={(e) => e.stopPropagation()}
              style={{
                whiteSpace: 'nowrap',
                display: 'flex',
                gap: '4px',
                padding: '9px 8px',
              }}
            >
              <button
                className="kb-btn"
                style={{ flex: 'none', padding: '4px 7px' }}
                onClick={(e) => handlePrint(e, request)}
              >
                📄
              </button>
              {parseInt(request.status) > 0 && (
                <button
                  className="kb-btn bk"
                  style={{ flex: 'none', padding: '4px 7px' }}
                  onClick={(e) => handleBackward(e, request)}
                >
                  ◀
                </button>
              )}
              {parseInt(request.status) < 5 && (
                <button
                  className="kb-btn fw"
                  style={{ flex: 'none', padding: '4px 7px' }}
                  onClick={(e) => handleForward(e, request)}
                >
                  ▶
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
