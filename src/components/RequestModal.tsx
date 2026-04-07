'use client';

import { useState, useEffect } from 'react';
import { Request, RequestStatus, STATUSES, STATUS_BG, STATUS_FG, HelperType } from '@/types';
import { copyToClipboard, generateTimeOptions, CAR_SIZES } from '@/lib/utils';
import { updateRequest } from '@/lib/api';
import { useToast } from './Toast';

interface RequestModalProps {
  request: Request | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onDelete: (id: string) => void;
  onPrintManifest: (request: Request) => void;
  onUpdated?: () => void;
}

export default function RequestModal({
  request,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
  onPrintManifest,
  onUpdated,
}: RequestModalProps) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVendorEmail, setShowVendorEmail] = useState(false);
  const [showStoreEmail, setShowStoreEmail] = useState(false);
  const timeOptions = generateTimeOptions();

  const [form, setForm] = useState({
    customer_name: '',
    zip: '',
    address: '',
    builder: '',
    chief: '',
    chief_tel: '',
    staff: '',
    staff_tel: '',
    email: '',
    collection_date: '',
    time_from: '',
    time_to: '',
    car_size: '',
    helper: 'none' as HelperType,
    vol_kitchen: 0,
    vol_bath: 0,
    vol_toilet: 0,
    vol_other: 0,
    has_asbestos: false,
    vol_asbestos: 0,
    note: '',
  });

  useEffect(() => {
    if (request) {
      setForm({
        customer_name: request.customer_name,
        zip: request.zip || '',
        address: request.address,
        builder: request.builder || '',
        chief: request.chief,
        chief_tel: request.chief_tel,
        staff: request.staff,
        staff_tel: request.staff_tel,
        email: request.email,
        collection_date: request.collection_date,
        time_from: request.time_from,
        time_to: request.time_to,
        car_size: request.car_size || '',
        helper: request.helper,
        vol_kitchen: request.vol_kitchen,
        vol_bath: request.vol_bath,
        vol_toilet: request.vol_toilet,
        vol_other: request.vol_other,
        has_asbestos: request.has_asbestos,
        vol_asbestos: request.vol_asbestos,
        note: request.note || '',
      });
      setEditing(false);
    }
  }, [request]);

  if (!request) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setEditing(false);
      onClose();
    }
  };

  const handleClose = () => {
    setEditing(false);
    onClose();
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRequest(request.id, {
        customer_name: form.customer_name,
        zip: form.zip || null,
        address: form.address,
        builder: form.builder || null,
        chief: form.chief,
        chief_tel: form.chief_tel,
        staff: form.staff,
        staff_tel: form.staff_tel,
        email: form.email,
        collection_date: form.collection_date,
        time_from: form.time_from,
        time_to: form.time_to,
        car_size: form.car_size || null,
        helper: form.helper,
        vol_kitchen: form.vol_kitchen,
        vol_bath: form.vol_bath,
        vol_toilet: form.vol_toilet,
        vol_other: form.vol_other,
        has_asbestos: form.has_asbestos,
        vol_asbestos: form.vol_asbestos,
        note: form.note || null,
      });
      showToast('依頼内容を更新しました');
      setEditing(false);
      if (onUpdated) onUpdated();
      onClose();
    } catch (error) {
      console.error('Failed to update:', error);
      showToast('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field: string, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const vendorEmailText = () => {
    const rt = request.routing_none;
    if (!rt) return '（業者未設定）';
    const c = rt.carrier;
    if (!c) return '（業者未設定）';
    return `件名: 【廃棄物回収のご依頼】${request.collection_date} ${request.store_name}\n\n${c.name} ご担当者様\n\nお世話になっております。共栄紙業株式会社でございます。\n\n下記のとおり廃棄物回収をご手配いただけますでしょうか。\n\n■ 依頼番号  : ${request.request_code}\n■ 依頼元店舗 : ${request.store_name}\n■ 依頼場所  : ${request.customer_name}（${request.address}）\n■ 回収日時  : ${request.collection_date}（${request.time_from}〜${request.time_to}）\n■ アスベスト : ${request.has_asbestos ? '有（' + request.vol_asbestos + '㎡）' : '無'}\n${request.car_size ? '■ 希望車両  : ' + request.car_size + '\n' : ''}${request.note ? '■ 備考    : ' + request.note + '\n' : ''}\n当日は現場回収依頼書（マニフェスト）をお持ちください。\nご確認のうえ、折り返しご連絡いただけますと幸いです。\n\n共栄紙業株式会社　TEL: 06-6437-0180`;
  };

  const storeEmailText = () => {
    return `件名: 【受付完了】現場回収依頼 ${request.request_code}\n\n${request.store_name} ${request.staff} 様\n\nお世話になっております。共栄紙業株式会社でございます。\n下記のとおり現場回収依頼を受け付けました。\n配車が決まりましたら改めてご連絡いたします。\n\n■ 依頼番号  : ${request.request_code}\n■ 依頼場所  : ${request.customer_name}（${request.address}）\n■ 回収希望日 : ${request.collection_date}（${request.time_from}〜${request.time_to}）\n■ アスベスト : ${request.has_asbestos ? '有' : '無'}\n\nご不明点はお気軽にご連絡ください。\n\n共栄紙業株式会社　TEL: 06-6437-0180`;
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    border: '1.5px solid var(--bdr)',
    borderRadius: '6px',
    fontSize: '13px',
    fontFamily: 'inherit',
    background: 'var(--sur)',
    color: 'var(--tx)',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--tx3)',
    marginBottom: '3px',
    display: 'block',
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '10px',
  };

  const fullRowStyle: React.CSSProperties = {
    marginBottom: '10px',
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--tx3)',
    marginBottom: '8px',
    borderBottom: '1px solid var(--bdr)',
    paddingBottom: '4px',
  };

  return (
    <div className={`ov ${isOpen ? 'on' : ''}`} onClick={handleOverlayClick}>
      <div className="modal" style={editing ? { maxWidth: '680px' } : undefined}>
        <div className="mh">
          <h3>{request.store_name} — {request.request_code}</h3>
          <button className="mcl" onClick={handleClose}>✕</button>
        </div>
        <div className="mb">
          {editing ? (
            <>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bl)', marginBottom: '14px', padding: '8px 12px', background: 'var(--bll)', borderRadius: '8px' }}>
                ✏️ 編集モード
              </div>

              <div style={sectionLabel}>現場情報</div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>お客様名 *</label>
                  <input style={inputStyle} value={form.customer_name} onChange={(e) => updateForm('customer_name', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>郵便番号</label>
                  <input style={inputStyle} value={form.zip} onChange={(e) => updateForm('zip', e.target.value)} />
                </div>
              </div>
              <div style={fullRowStyle}>
                <label style={labelStyle}>住所 *</label>
                <input style={inputStyle} value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>施工業者名</label>
                  <input style={inputStyle} value={form.builder} onChange={(e) => updateForm('builder', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>現場責任者名 *</label>
                  <input style={inputStyle} value={form.chief} onChange={(e) => updateForm('chief', e.target.value)} />
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>現場責任者 連絡先 *</label>
                  <input style={inputStyle} value={form.chief_tel} onChange={(e) => updateForm('chief_tel', e.target.value)} />
                </div>
                <div />
              </div>

              <div style={{ ...sectionLabel, marginTop: '12px' }}>店舗担当者</div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>担当者名 *</label>
                  <input style={inputStyle} value={form.staff} onChange={(e) => updateForm('staff', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>連絡先 *</label>
                  <input style={inputStyle} value={form.staff_tel} onChange={(e) => updateForm('staff_tel', e.target.value)} />
                </div>
              </div>
              <div style={fullRowStyle}>
                <label style={labelStyle}>メールアドレス *</label>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => updateForm('email', e.target.value)} />
              </div>

              <div style={{ ...sectionLabel, marginTop: '12px' }}>回収情報</div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>回収希望日 *</label>
                  <input style={inputStyle} type="date" value={form.collection_date} onChange={(e) => updateForm('collection_date', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>回収時間帯</label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <select style={{ ...inputStyle, flex: 1 }} value={form.time_from} onChange={(e) => updateForm('time_from', e.target.value)}>
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span style={{ color: 'var(--tx3)' }}>〜</span>
                    <select style={{ ...inputStyle, flex: 1 }} value={form.time_to} onChange={(e) => updateForm('time_to', e.target.value)}>
                      {timeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>車両サイズ</label>
                  <select style={inputStyle} value={form.car_size} onChange={(e) => updateForm('car_size', e.target.value)}>
                    <option value="">未指定</option>
                    {CAR_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>補助人工</label>
                  <select style={inputStyle} value={form.helper} onChange={(e) => updateForm('helper', e.target.value)}>
                    <option value="none">無</option>
                    <option value="yes">要</option>
                  </select>
                </div>
              </div>

              <div style={{ ...sectionLabel, marginTop: '12px' }}>排出量・アスベスト</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
                {[
                  ['キッチン', 'vol_kitchen'],
                  ['バス', 'vol_bath'],
                  ['トイレ', 'vol_toilet'],
                  ['その他', 'vol_other'],
                ].map(([label, field]) => (
                  <div key={field}>
                    <label style={labelStyle}>{label}㎡</label>
                    <input style={inputStyle} type="number" step="0.5" min="0" value={(form as any)[field]} onChange={(e) => updateForm(field, parseFloat(e.target.value) || 0)} />
                  </div>
                ))}
              </div>
              <div style={rowStyle}>
                <div>
                  <label style={labelStyle}>アスベスト含有</label>
                  <select style={inputStyle} value={form.has_asbestos ? 'yes' : 'none'} onChange={(e) => updateForm('has_asbestos', e.target.value === 'yes')}>
                    <option value="none">無</option>
                    <option value="yes">有</option>
                  </select>
                </div>
                {form.has_asbestos && (
                  <div>
                    <label style={labelStyle}>石綿含有量㎡</label>
                    <input style={inputStyle} type="number" step="0.5" min="0" value={form.vol_asbestos} onChange={(e) => updateForm('vol_asbestos', parseFloat(e.target.value) || 0)} />
                  </div>
                )}
              </div>

              <div style={fullRowStyle}>
                <label style={labelStyle}>備考</label>
                <textarea style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} value={form.note} onChange={(e) => updateForm('note', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {saving ? '保存中...' : '✓ 保存'}
                </button>
                <button onClick={() => setEditing(false)} style={{ padding: '10px 20px', background: 'var(--sur2)', color: 'var(--tx2)', border: '1.5px solid var(--bdr)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  キャンセル
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="dg">
                <div className="di"><label>店舗</label><div className="v">{request.store_name}</div></div>
                <div className="di"><label>アスベスト</label><div className="v" style={{ color: request.has_asbestos ? 'var(--rd)' : 'inherit', fontWeight: request.has_asbestos ? 700 : 400 }}>{request.has_asbestos ? '⚠ 有' : '無'}</div></div>
                <div className="di"><label>依頼場所</label><div className="v">{request.customer_name}</div></div>
                <div className="di"><label>住所</label><div className="v">{request.address}</div></div>
                <div className="di"><label>店舗担当者</label><div className="v">{request.staff}<br /><span style={{ fontSize: '11px', color: 'var(--tx3)' }}>{request.staff_tel} / {request.email}</span></div></div>
                <div className="di"><label>現場責任者</label><div className="v">{request.chief}（{request.chief_tel}）</div></div>
                <div className="di"><label>回収日時</label><div className="v">{request.collection_date} {request.time_from}〜{request.time_to}</div></div>
                <div className="di"><label>施工業者</label><div className="v">{request.builder || '—'}</div></div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span className="sb" style={{ background: STATUS_BG[request.status], color: STATUS_FG[request.status] }}>{STATUSES[request.status]}</span>
                <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>{request.routing_none ? '運搬: ' + request.routing_none.carrier?.name : '—'}</span>
              </div>

              <button onClick={() => setEditing(true)} style={{ width: '100%', padding: '9px', background: 'var(--sur2)', color: 'var(--tx)', border: '1.5px solid var(--bdr)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginBottom: '8px' }}>
                ✏️ 依頼内容を編集
              </button>

              <div className="eblk">
                <div className="eblk-lbl" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setShowVendorEmail(!showVendorEmail)}>
                  <span>{showVendorEmail ? '▼' : '▶'} 📧 業者への配車依頼メール</span>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(vendorEmailText()); }}>コピー</button>
                </div>
                {showVendorEmail && <pre className="et">{vendorEmailText()}</pre>}
              </div>
              <div className="eblk" style={{ marginTop: '8px' }}>
                <div className="eblk-lbl" style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setShowStoreEmail(!showStoreEmail)}>
                  <span>{showStoreEmail ? '▼' : '▶'} 📧 店舗への受付確認メール（{request.email}）</span>
                  <button onClick={(e) => { e.stopPropagation(); handleCopy(storeEmailText()); }}>コピー</button>
                </div>
                {showStoreEmail && <pre className="et">{storeEmailText()}</pre>}
              </div>

              <button className="prt-btn-blue" onClick={() => { onPrintManifest(request); onClose(); }}>📄 マニフェスト確認票を印刷</button>
              {parseInt(request.status) > 0 && (<button className="bk-btn" onClick={handleBackward}>◀ {STATUSES[String(parseInt(request.status) - 1) as RequestStatus]} に戻す</button>)}
              {parseInt(request.status) < 5 && (<button className="fwd-btn" onClick={handleForward}>▶ {STATUSES[String(parseInt(request.status) + 1) as RequestStatus]} へ進める</button>)}
              <button className="del-btn" onClick={handleDelete}>この依頼を削除</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
