'use client';

import { Request, RequestStatus, STATUSES, STATUS_BG, STATUS_FG } from '@/types';

interface KanbanBoardProps {
  requests: Request[];
  onCardClick: (request: Request) => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onPrintManifest: (request: Request) => void;
}

const COLUMN_CLASSES = ['s-new', 's0', 's1', 's2', 's3', 's4'];

export default function KanbanBoard({
  requests,
  onCardClick,
  onStatusChange,
  onPrintManifest,
}: KanbanBoardProps) {
  const getColumnRequests = (status: RequestStatus) => {
    return requests.filter((r) => r.status === status);
  };

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

  return (
    <div className="kb">
      {(['0', '1', '2', '3', '4', '5'] as RequestStatus[]).map((status, index) => {
        const columnRequests = getColumnRequests(status);
        return (
          <div key={status} className={`kbc ${COLUMN_CLASSES[index]}`}>
            <div className="kbch">
              {STATUSES[status]}
              <span className="cn">{columnRequests.length}</span>
            </div>
            <div className="kbcb">
              {columnRequests.length > 0 ? (
                columnRequests.map((request) => (
                  <div
                    key={request.id}
                    className="kcard"
                    onClick={() => onCardClick(request)}
                  >
                    <div className="kc-st">{request.store_name}</div>
                    <div className="kc-nm">
                      {request.customer_name}
                      {request.has_asbestos && <span className="asb-tag">石綿</span>}
                    </div>
                    <div className="kc-mt">
                      <span>🕐 {new Date(request.created_at).toLocaleDateString('ja-JP')}</span>
                      <span>📅 {request.collection_date}</span>
                    </div>
                    <div className="kc-mt">
                      <span>
                        📍 {request.address.slice(0, 15)}
                        {request.address.length > 15 ? '…' : ''}
                      </span>
                    </div>
                    {/* 備考・メモありタグ */}
                    {(request.note || request.memo) && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {request.note && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'var(--sur2)',
                            color: 'var(--tx3)',
                            border: '1px solid var(--bdr)',
                          }}>
                            📌備考あり
                          </span>
                        )}
                        {request.memo && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: 'var(--ambl)',
                            color: 'var(--amb)',
                            border: '1px solid var(--amb)',
                          }}>
                            📝メモあり
                          </span>
                        )}
                      </div>
                    )}
                    <div className="kc-ac">
                      <button
                        className="kb-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCardClick(request);
                        }}
                      >
                        詳細
                      </button>
                      <button
                        className="kb-btn"
                        onClick={(e) => handlePrint(e, request)}
                        title="印刷"
                      >
                        📄
                      </button>
                      {parseInt(status) > 0 && (
                        <button
                          className="kb-btn bk"
                          onClick={(e) => handleBackward(e, request)}
                          title="一つ戻す"
                        >
                          ◀
                        </button>
                      )}
                      {parseInt(status) < 5 && (
                        <button
                          className="kb-btn fw"
                          onClick={(e) => handleForward(e, request)}
                        >
                          ▶
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '10px',
                    fontSize: '11px',
                    color: 'var(--tx3)',
                    textAlign: 'center',
                  }}
                >
                  なし
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
