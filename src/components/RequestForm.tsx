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
}

export default function RequestForm({ onSubmitSuccess, showMemo = false }: FormProps) {
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
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

  // 郵便番号から住所自動入力
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

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    setLoading(true);

    try {
      const store = stores.find((s) => s.id === storeId);
      if (!store) throw new Error('店舗が見つかりません');

      // ルーティング情報を取得
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

      // 通知送信
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

      // フォームリセット
      resetForm();

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
              placeholder="野口 昌司"
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
              placeholder="070-6420-2434"
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
              placeholder="noguchi@arkhome.co.jp"
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
              placeholder="佐伯 幹夫様"
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
              placeholder="金沢市諸江町上丁136-20"
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
              placeholder="成田住工"
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
              placeholder="成田 将一"
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
              placeholder="090-2487-1180"
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
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '送信中...' : '依頼を送信'}
        </button>
      </div>
    </div>
  );
}
