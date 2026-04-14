'use client';

import { useState, useEffect, useRef } from 'react';
import { Store, Vendor, Request, HelperType } from '@/types';
import { getStores, getVendors, createRequest, getRouting, getEmailConfig } from '@/lib/api';
import { generateTimeOptions, CAR_SIZES, toHanNum, formatPhone, formatZip, fetchAddressFromZip, isValidEmail, isPastDate } from '@/lib/utils';
import { sendNotifications } from '@/lib/notifications';
import { useToast } from './Toast';

interface FormProps {
  onSubmitSuccess?: (request: Request) => void;
  showMemo?: boolean;
  showConfirmation?: boolean;
}

export default function RequestForm({ onSubmitSuccess, showMemo = false, showConfirmation = false }: FormProps) {
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const composingRef = useRef(false);

  // Form State
  const [storeId, setStoreId] = useState('');
  const [staff, setStaff] = useState('');
  const [staffTel, setStaffTel] = useState('');
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [zip, setZip] = useState('');
  const [address, setAddress] = useState('');
  const [builder, setBuilder] = useState('');
  const [chief, setChief] = useState('');
  const [chiefTel, setChiefTel] = useState('');
  const [collectionDate, setCollectionDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('15:00');
  const [timeTo, setTimeTo] = useState('16:00');
  const [carSize, setCarSize] = useState('');
  const [helper, setHelper] = useState<HelperType>('none');
  const [volKitchen, setVolKitchen] = useState('');
  const [volBath, setVolBath] = useState('');
  const [volToilet, setVolToilet] = useState('');
  const [volOther, setVolOther] = useState('');
  const [hasAsbestos, setHasAsbestos] = useState<string>('');
  const [volAsbestos, setVolAsbestos] = useState('');
  const [note, setNote] = useState('');
  const [memo, setMemo] = useState('');

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storesData, vendorsData] = await Promise.all([
        getStores(),
        getVendors(),
      ]);
      setStores(storesData);
      setVendors(vendorsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('データの読み込みに失敗しました');
    }
  };

  const handleZipChange = async (value: string) => {
    const formatted = formatZip(value);
    setZip(formatted);
    const digits = formatted.replace(/[^\d]/g, '');
    if (digits.length === 7) {
      const addr = await fetchAddressFromZip(digits);
      if (addr) {
        setAddress(addr);
        showToast(`住所を自動入力しました`);
      }
    }
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!storeId) errs.push('店舗名');
    if (!customerName) errs.push('依頼場所の名称（お客様名）');
    if (!address) errs.push('依頼場所の住所');
    if (!staff) errs.push('店舗担当者名');
    if (!staffTel) errs.push('店舗担当者 連絡先');
    if (!email) errs.push('店舗担当者 メールアドレス');
    if (email && !isValidEmail(email)) errs.push('メールアドレスの形式が正しくありません');
    if (!chief) errs.push('現場責任者名');
    if (!chiefTel) errs.push('現場責任者 連絡先');
    if (!collectionDate) errs.push('回収希望日');
    if (collectionDate && isPastDate(collectionDate)) errs.push('回収希望日が過去の日付です');
    if (!hasAsbestos) errs.push('アスベスト含有');
    return errs;
  };

  const handleConfirm = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    if (showConfirmation) {
      setConfirming(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const store = stores.find((s) => s.id === storeId);
      if (!store) throw new Error('店舗が見つかりません');

      const routingNone = await getRouting(storeId, 'none', vendors);
      const routingAsb = await getRouting(storeId, 'asb', vendors);

      const request = await createRequest({
        store_id: storeId,
        store_name: store.name,
        staff,
        staff_tel: staffTel,
        email,
        customer_name: customerName,
        zip: zip || null,
        address,
        builder: builder || null,
        chief,
        chief_tel: chiefTel,
        collection_date: collectionDate,
        time_from: timeFrom,
        time_to: timeTo,
        car_size: carSize || null,
        helper,
        vol_kitchen: parseFloat(volKitchen) || 0,
        vol_bath: parseFloat(volBath) || 0,
        vol_toilet: parseFloat(volToilet) || 0,
        vol_other: parseFloat(volOther) || 0,
        has_asbestos: hasAsbestos === 'yes',
        vol_asbestos: parseFloat(volAsbestos) || 0,
        note: note || null,
        memo: memo || null,
        status: '0',
        routing_none: routingNone,
        routing_asb: routingAsb,
      });

      const emailConfig = await getEmailConfig();
      if (emailConfig) {
        await sendNotifications(request, {
          sharedEmail: emailConfig.shared_email,
          serviceId: emailConfig.emailjs_service_id,
          templateId: emailConfig.emailjs_template_id,
          publicKey: emailConfig.emailjs_public_key,
          slackWebhookUrl: emailConfig.slack_webhook_url,
        });
      }

      showToast(`依頼を送信しました（${request.request_code}）`);
      resetForm();
      setConfirming(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(request);
      }
    } catch (error) {
      console.error('Failed to submit:', error);
      showToast('送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStoreId('');
    setStaff('');
    setStaffTel('');
    setEmail('');
    setCustomerName('');
    setZip('');
    setAddress('');
    setBuilder('');
    setChief('');
    setChiefTel('');
    setCollectionDate('');
    setTimeFrom('15:00');
    setTimeTo('16:00');
    setCarSize('');
    setHelper('none');
    setVolKitchen('');
    setVolBath('');
    setVolToilet('');
    setVolOther('');
    setHasAsbestos('');
    setVolAsbestos('');
    setNote('');
    setMemo('');
  };

  const getStoreName = () => stores.find((s) => s.id === storeId)?.name || '';

  // 確認画面
  if (confirming) {
    const confirmRowStyle: React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns: '140px 1fr',
      borderBottom: '1px solid var(--bdr)',
      fontSize: '13px',
    };
    const confirmLabelStyle: React.CSSProperties = {
      padding: '10px 12px',
      fontWeight: 700,
      color: 'var(--tx2)',
      fontSize: '12px',
      background: 'var(--sur2)',
    };
    const confirmValueStyle: React.CSSProperties = {
      padding: '10px 12px',
      color: 'var(--tx)',
      fontWeight: 500,
    };

    return (
      <div className="card">
        <div className="fhead" style={{ background: 'var(--bl)' }}>
          <h1>入力内容の確認</h1>
          <p>以下の内容で送信します。よろしいですか？</p>
        </div>
        <div style={{ padding: '0' }}>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>店舗名</div>
            <div style={confirmValueStyle}>{getStoreName()}</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>店舗担当者</div>
            <div style={confirmValueStyle}>{staff}（{staffTel}）</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>メールアドレス</div>
            <div style={confirmValueStyle}>{email}</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>お客様名</div>
            <div style={confirmValueStyle}>{customerName}</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>住所</div>
            <div style={confirmValueStyle}>{zip ? `〒${zip} ` : ''}{address}</div>
          </div>
          {builder && (
            <div style={confirmRowStyle}>
              <div style={confirmLabelStyle}>施工業者</div>
              <div style={confirmValueStyle}>{builder}</div>
            </div>
          )}
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>現場責任者</div>
            <div style={confirmValueStyle}>{chief}（{chiefTel}）</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>回収希望日</div>
            <div style={confirmValueStyle}>{collectionDate}（{timeFrom}〜{timeTo}）</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>車両サイズ</div>
            <div style={confirmValueStyle}>{carSize || '未指定'}</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>補助人工</div>
            <div style={confirmValueStyle}>{helper === 'yes' ? '要' : '無'}</div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>排出量</div>
            <div style={confirmValueStyle}>
              {[
                volKitchen && `キッチン ${volKitchen}㎡`,
                volBath && `バス ${volBath}㎡`,
                volToilet && `トイレ ${volToilet}㎡`,
                volOther && `その他 ${volOther}㎡`,
              ].filter(Boolean).join('、') || '未入力'}
            </div>
          </div>
          <div style={confirmRowStyle}>
            <div style={confirmLabelStyle}>アスベスト含有</div>
            <div style={{ ...confirmValueStyle, color: hasAsbestos === 'yes' ? 'var(--rd)' : 'inherit', fontWeight: hasAsbestos === 'yes' ? 700 : 500 }}>
              {hasAsbestos === 'yes' ? `有（${volAsbestos || 0}㎡）` : '無'}
            </div>
          </div>
          {note && (
            <div style={confirmRowStyle}>
              <div style={confirmLabelStyle}>備考</div>
              <div style={{ ...confirmValueStyle, whiteSpace: 'pre-wrap' }}>{note}</div>
            </div>
          )}
        </div>
        <div style={{ padding: '20px 26px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              background: 'var(--g)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontSize: '15px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '送信中...' : 'この内容で送信する'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={loading}
            style={{
              padding: '14px 24px',
              background: 'var(--sur2)',
              color: 'var(--tx2)',
              border: '1.5px solid var(--bdr)',
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            戻って修正
          </button>
        </div>
      </div>
    );
  }

  // 入力フォーム
  return (
    <div className="card">
      <div className="fhead">
        <h1>現場回収依頼フォーム</h1>
        <p>アークホーム各店舗から共栄紙業への廃棄物回収依頼</p>
      </div>
      <div className="fbody">
        {/* 店舗情報 */}
        <div className="slabel">店舗情報</div>
        <div className="frow full">
          <div className="fg">
            <label>店舗名<span className="r">*</span></label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className={errors.includes('店舗名') ? 'err-field' : ''}
            >
              <option value="">選択してください</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="frow">
          <div className="fg">
            <label>店舗担当者名<span className="r">*</span></label>
            <input
              type="text"
              value={staff}
              onChange={(e) => setStaff(e.target.value)}
              placeholder="山田 太郎"
              className={errors.includes('店舗担当者名') ? 'err-field' : ''}
            />
          </div>
          <div className="fg">
            <label>店舗担当者 連絡先<span className="r">*</span></label>
            <input
              type="text"
              value={staffTel}
              onChange={(e) => {
                if (!composingRef.current) setStaffTel(formatPhone(e.target.value));
                else setStaffTel(e.target.value);
              }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                setStaffTel(formatPhone((e.target as HTMLInputElement).value));
              }}
              placeholder="090-1234-5678"
              className={errors.includes('店舗担当者 連絡先') ? 'err-field' : ''}
            />
          </div>
        </div>
        <div className="frow full">
          <div className="fg">
            <label>店舗担当者 メールアドレス<span className="r">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="taro.yamada@example.co.jp"
              className={errors.includes('店舗担当者 メールアドレス') || errors.includes('メールアドレスの形式が正しくありません') ? 'err-field' : ''}
            />
          </div>
        </div>

        {/* 現場情報 */}
        <div className="slabel" style={{ marginTop: '8px' }}>現場情報</div>
        <div className="frow">
          <div className="fg">
            <label>依頼場所の名称（お客様名）<span className="r">*</span></label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="鈴木 一郎様"
              className={errors.includes('依頼場所の名称（お客様名）') ? 'err-field' : ''}
            />
          </div>
          <div className="fg">
            <label>依頼場所の郵便番号</label>
            <input
              type="text"
              value={zip}
              onChange={(e) => {
                if (!composingRef.current) handleZipChange(e.target.value);
                else setZip(e.target.value);
              }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                handleZipChange((e.target as HTMLInputElement).value);
              }}
              placeholder="920-0000"
              maxLength={8}
            />
          </div>
        </div>
        <div className="frow full">
          <div className="fg">
            <label>依頼場所の住所<span className="r">*</span></label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="金沢市○○町1-2-3"
              className={errors.includes('依頼場所の住所') ? 'err-field' : ''}
            />
          </div>
        </div>
        <div className="frow full">
          <div className="fg">
            <label>施工業者名</label>
            <input
              type="text"
              value={builder}
              onChange={(e) => setBuilder(e.target.value)}
              placeholder="○○建設"
            />
          </div>
        </div>
        <div className="frow">
          <div className="fg">
            <label>現場責任者名（担当者名）<span className="r">*</span></label>
            <input
              type="text"
              value={chief}
              onChange={(e) => setChief(e.target.value)}
              placeholder="田中 次郎"
              className={errors.includes('現場責任者名') ? 'err-field' : ''}
            />
          </div>
          <div className="fg">
            <label>現場責任者 連絡先<span className="r">*</span></label>
            <input
              type="text"
              value={chiefTel}
              onChange={(e) => {
                if (!composingRef.current) setChiefTel(formatPhone(e.target.value));
                else setChiefTel(e.target.value);
              }}
              onCompositionStart={() => { composingRef.current = true; }}
              onCompositionEnd={(e) => {
                composingRef.current = false;
                setChiefTel(formatPhone((e.target as HTMLInputElement).value));
              }}
              placeholder="080-9876-5432"
              className={errors.includes('現場責任者 連絡先') ? 'err-field' : ''}
            />
          </div>
        </div>

        {/* 回収情報 */}
        <div className="slabel" style={{ marginTop: '8px' }}>回収情報</div>
        <div className="frow">
          <div className="fg">
            <label>回収希望日<span className="r">*</span></label>
            <input
              type="date"
              value={collectionDate}
              onChange={(e) => setCollectionDate(e.target.value)}
              className={errors.includes('回収希望日') || errors.includes('回収希望日が過去の日付です') ? 'err-field' : ''}
            />
          </div>
          <div className="fg">
            <label>回収希望時間帯</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} style={{ flex: 1 }}>
                {timeOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
              <span style={{ color: 'var(--tx3)' }}>〜</span>
              <select value={timeTo} onChange={(e) => setTimeTo(e.target.value)} style={{ flex: 1 }}>
                {timeOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>
          </div>
        </div>
        <div className="frow">
          <div className="fg">
            <label>回収希望車両サイズ</label>
            <select value={carSize} onChange={(e) => setCarSize(e.target.value)}>
              <option value="">未指定</option>
              {CAR_SIZES.map((s) => (<option key={s} value={s}>{s}</option>))}
            </select>
          </div>
          <div className="fg">
            <label>補助人工の依頼</label>
            <select value={helper} onChange={(e) => setHelper(e.target.value as HelperType)}>
              <option value="none">無</option>
              <option value="yes">要</option>
            </select>
          </div>
        </div>

        {/* 排出量・アスベスト */}
        <div className="slabel" style={{ marginTop: '8px' }}>排出量・アスベスト</div>
        <div className="frow full">
          <div className="fg">
            <label>排出予定量（㎡）</label>
            <div className="vol-grid">
              <div className="vol-item">
                <label>キッチン</label>
                <input type="number" value={volKitchen} onChange={(e) => setVolKitchen(toHanNum(e.target.value))} placeholder="0" step="0.5" min="0" />
              </div>
              <div className="vol-item">
                <label>バス</label>
                <input type="number" value={volBath} onChange={(e) => setVolBath(toHanNum(e.target.value))} placeholder="0" step="0.5" min="0" />
              </div>
              <div className="vol-item">
                <label>トイレ</label>
                <input type="number" value={volToilet} onChange={(e) => setVolToilet(toHanNum(e.target.value))} placeholder="0" step="0.5" min="0" />
              </div>
              <div className="vol-item">
                <label>その他</label>
                <input type="number" value={volOther} onChange={(e) => setVolOther(toHanNum(e.target.value))} placeholder="0" step="0.5" min="0" />
              </div>
            </div>
          </div>
        </div>
        <div className="frow">
          <div className="fg">
            <label>アスベスト含有<span className="r">*</span></label>
            <select
              value={hasAsbestos}
              onChange={(e) => setHasAsbestos(e.target.value)}
              className={errors.includes('アスベスト含有') ? 'err-field' : ''}
            >
              <option value="">選択してください</option>
              <option value="none">無</option>
              <option value="yes">有</option>
            </select>
          </div>
          {hasAsbestos === 'yes' && (
            <div className="fg">
              <label>アスベスト含有量（㎡）</label>
              <input type="number" value={volAsbestos} onChange={(e) => setVolAsbestos(toHanNum(e.target.value))} placeholder="㎡" step="0.5" min="0" />
            </div>
          )}
        </div>
        <div className={`asb-warn ${hasAsbestos === 'yes' ? 'show' : ''}`}>
          ⚠ アスベスト含有の場合、石綿なし・石綿あり 両マニフェストが生成されます。
        </div>

        {/* エラー表示 */}
        <div className={`form-errors ${errors.length > 0 ? 'show' : ''}`}>
          <h4>⚠ 以下の必須項目を入力してください</h4>
          <ul>
            {errors.map((err, i) => (<li key={i}>{err}</li>))}
          </ul>
        </div>

        {/* 備考 */}
        <div className="frow full">
          <div className="fg">
            <label>備考</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="特記事項・搬出経路・鍵の受け渡し方法など"
            />
          </div>
        </div>

        {/* 社内メモ（社内用のみ表示） */}
        {showMemo && (
          <div className="frow full">
            <div className="fg">
              <label>社内メモ <span style={{ fontWeight: 400, fontSize: '10px', color: 'var(--tx3)' }}>（マニフェストには印刷されません）</span></label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="社内共有用のメモ・連絡事項など"
              />
            </div>
          </div>
        )}

        <button
          className="sub-btn"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? '送信中...' : showConfirmation ? '入力内容を確認する' : '依頼を送信'}
        </button>
      </div>
    </div>
  );
}
