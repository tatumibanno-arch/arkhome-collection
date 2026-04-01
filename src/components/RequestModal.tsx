'use client';

import { Request, RequestStatus, STATUSES, STATUS_BG, STATUS_FG } from '@/types';
import { copyToClipboard } from '@/lib/utils';
import { useToast } from './Toast';

interface RequestModalProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onDelete: (id: string) => void;
  onPrintManifest: (request: Request) => void;
}

export default function RequestModal({
  request,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
  onPrintManifest,
}: RequestModalProps) {
  const { showToast } = useToast();

  if (!request) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleForward = () => {
    const currentStatus = parseInt(request.status);
    if (currentStatus < 5) {
      onStatusChange(request.id, String(currentStatus + 1) as RequestStatus);
      onClose();
    }
  };

  const handleBackward = () => {
    const currentStatus = parseInt(request.status);
    if (currentStatus > 0) {
      onStatusChange(request.id, String(currentStatus - 1) as RequestStatus);
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('削除しますか？')) {
      onDelete(request.id);
      onClose();
    }
  };

  const handleCopy = async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      showToast('コピーしました');
    }
  };

  // 業者へのメール本文
  const vendorEmailText = () => {
    const rt = request.routing_none;
    if (!rt) return '（業者未設定）';
    const c = rt.carrier;
    if (!c) return '（業者未設定）';

    return `件名: 【廃棄物回収のご依頼】${request.collection_date} ${request.store_name}

${c.name} ご担当者様

お世話になっております。共栄紙業株式会社でございます。

下記のとおり廃棄物回収をご手配いただけますでしょうか。

■ 依頼番号  : ${request.request_code}
■ 依頼元店舗 : ${request.store_name}
■ 依頼場所  : ${request.customer_name}（${request.address}）
■ 回収日時  : ${request.collection_date}（${request.time_from}〜${request.time_to}）
■ アスベスト : ${request.has_asbestos ? '有（' + request.vol_asbestos + '㎡）' : '無'}
${request.car_size ? '■ 希望車両  : ' + request.car_size + '\n' : ''}${request.note ? '■ 備考    : ' + request.note + '\n' : ''}
当日は現場回収依頼書（マニフェスト）をお持ちください。
ご確認のうえ、折り返しご連絡いただけますと幸いです。

共栄紙業株式会社　TEL: 06-6437-0180`;
  };

  // 店舗への確認メール本文
  const storeEmailText = () => {
    return `件名: 【受付完了】現場回収依頼 ${request.request_code}

${request.store_name} ${request.staff} 様

お世話になっております。共栄紙業株式会社でございます。
下記のとおり現場回収依頼を受け付けました。
配車が決まりましたら改めてご連絡いたします。

■ 依頼番号  : ${request.request_code}
■ 依頼場所  : ${request.customer_name}（${request.address}）
■ 回収希望日 : ${request.collection_date}（${request.time_from}〜${request.time_to}）
■ アスベスト : ${request.has_asbestos ? '有' : '無'}

ご不明点はお気軽にご連絡ください。

共栄紙業株式会社　TEL: 06-6437-0180`;
  };

  return (
    <div className={`ov ${isOpen ? 'on' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="mh">
          <h3>
            {request.store_name} — {request.request_code}
          </h3>
          <button className="mcl" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mb">
          <div className="dg">
            <div className="di">
              <label>店舗</label>
              <div className="v">{request.store_name}</div>
            </div>
            <div className="di">
              <label>アスベスト</label>
              <div
                className="v"
                style={{
                  color: request.has_asbestos ? 'var(--rd)' : 'inherit',
                  fontWeight: request.has_asbestos ? 700 : 400,
                }}
              >
                {request.has_asbestos ? '⚠ 有' : '無'}
              </div>
            </div>
            <div className="di">
              <label>依頼場所</label>
              <div className="v">{request.customer_name}</div>
            </div>
            <div className="di">
              <label>住所</label>
              <div className="v">{request.address}</div>
            </div>
            <div className="di">
              <label>店舗担当者</label>
              <div className="v">
                {request.staff}
                <br />
                <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>
                  {request.staff_tel} / {request.email}
                </span>
              </div>
            </div>
            <div className="di">
              <label>現場責任者</label>
              <div className="v">
                {request.chief}（{request.chief_tel}）
              </div>
            </div>
            <div className="di">
              <label>回収日時</label>
              <div className="v">
                {request.collection_date} {request.time_from}〜{request.time_to}
              </div>
            </div>
            <div className="di">
              <label>施工業者</label>
              <div className="v">{request.builder || '—'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span
              className="sb"
              style={{
                background: STATUS_BG[request.status],
                color: STATUS_FG[request.status],
              }}
            >
              {STATUSES[request.status]}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>
              {request.routing_none ? '運搬: ' + request.routing_none.carrier?.name : '—'}
            </span>
          </div>

          {/* 業者へのメール */}
          <div className="eblk">
            <div className="eblk-lbl">
              📧 業者への配車依頼メール
              <button onClick={() => handleCopy(vendorEmailText())}>コピー</button>
            </div>
            <pre className="et">{vendorEmailText()}</pre>
          </div>

          {/* 店舗への確認メール */}
          <div className="eblk" style={{ marginTop: '8px' }}>
            <div className="eblk-lbl">
              📧 店舗への受付確認メール（{request.email}）
              <button onClick={() => handleCopy(storeEmailText())}>コピー</button>
            </div>
            <pre className="et">{storeEmailText()}</pre>
          </div>

          {/* アクションボタン */}
          <button
            className="prt-btn-blue"
            onClick={() => {
              onPrintManifest(request);
              onClose();
            }}
          >
            📄 マニフェスト確認票を印刷
          </button>

          {parseInt(request.status) > 0 && (
            <button className="bk-btn" onClick={handleBackward}>
              ◀ {STATUSES[String(parseInt(request.status) - 1) as RequestStatus]} に戻す
            </button>
          )}

          {parseInt(request.status) < 5 && (
            <button className="fwd-btn" onClick={handleForward}>
              ▶ {STATUSES[String(parseInt(request.status) + 1) as RequestStatus]} へ進める
            </button>
          )}

          <button className="del-btn" onClick={handleDelete}>
            この依頼を削除
          </button>
        </div>
      </div>
    </div>
  );
}
