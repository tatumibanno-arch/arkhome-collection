'use client';

import { useState, useEffect } from 'react';
import {
  Store,
  Vendor,
  VendorCategory,
  StoreVendorMapping,
  EmailConfig,
  CATEGORY_NAMES,
} from '@/types';
import {
  getStores,
  getVendors,
  getMappings,
  getEmailConfig,
  createStore,
  deleteStore,
  createVendor,
  updateVendor,
  deleteVendor,
  upsertMapping,
  updateEmailConfig,
} from '@/lib/api';
import { useToast } from './Toast';

const CAT_KEYS: VendorCategory[] = ['carrier', 'processor', 'dest', 'transfer', 'carrier2', 'final_dest'];

export default function Settings() {
  const { showToast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [mappings, setMappings] = useState<StoreVendorMapping[]>([]);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  // モーダル状態
  const [storeModalOpen, setStoreModalOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState('');

  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorCategory, setVendorCategory] = useState<VendorCategory>('carrier');
  const [vendorForm, setVendorForm] = useState({
    name: '',
    tel: '',
    fax: '',
    zip: '',
    address: '',
    jwnet_no: '',
    jwnet_pw: '',
    contact: '',
    email: '',
  });

  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingStore, setMappingStore] = useState<Store | null>(null);
  const [mappingData, setMappingData] = useState<{
    none: { carrier: string; processor: string; dest: string; transfer: string; carrier2: string; final_dest: string };
    asb: { carrier: string; processor: string; dest: string; transfer: string; carrier2: string; final_dest: string };
  }>({
    none: { carrier: '', processor: '', dest: '', transfer: '', carrier2: '', final_dest: '' },
    asb: { carrier: '', processor: '', dest: '', transfer: '', carrier2: '', final_dest: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storesData, vendorsData, mappingsData, emailData] = await Promise.all([
        getStores(),
        getVendors(),
        getMappings(),
        getEmailConfig(),
      ]);
      setStores(storesData);
      setVendors(vendorsData);
      setMappings(mappingsData);
      setEmailConfig(emailData);
    } catch (error) {
      console.error('Failed to load settings data:', error);
      showToast('データの読み込みに失敗しました');
    }
  };

  // 店舗
  const handleAddStore = async () => {
    if (!newStoreName.trim()) {
      showToast('店舗名を入力してください');
      return;
    }
    try {
      await createStore(newStoreName.trim());
      showToast('店舗を追加しました');
      setStoreModalOpen(false);
      setNewStoreName('');
      loadData();
    } catch (error) {
      showToast('追加に失敗しました');
    }
  };

  const handleDeleteStore = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    try {
      await deleteStore(id);
      showToast('削除しました');
      loadData();
    } catch (error) {
      showToast('削除に失敗しました');
    }
  };

  // 業者
  const openVendorModal = (category: VendorCategory, vendor?: Vendor) => {
    setVendorCategory(category);
    if (vendor) {
      setEditingVendor(vendor);
      setVendorForm({
        name: vendor.name,
        tel: vendor.tel || '',
        fax: vendor.fax || '',
        zip: vendor.zip || '',
        address: vendor.address || '',
        jwnet_no: vendor.jwnet_no || '',
        jwnet_pw: vendor.jwnet_pw || '',
        contact: vendor.contact || '',
        email: vendor.email || '',
      });
    } else {
      setEditingVendor(null);
      setVendorForm({
        name: '',
        tel: '',
        fax: '',
        zip: '',
        address: '',
        jwnet_no: '',
        jwnet_pw: '',
        contact: '',
    email: '',
      });
    }
    setVendorModalOpen(true);
  };

  const handleSaveVendor = async () => {
    if (!vendorForm.name.trim()) {
      showToast('業者名を入力してください');
      return;
    }
    try {
      if (editingVendor) {
        await updateVendor(editingVendor.id, {
          ...vendorForm,
          category: vendorCategory,
        });
        showToast('業者情報を更新しました');
      } else {
        await createVendor({
          ...vendorForm,
          category: vendorCategory,
        });
        showToast('業者を追加しました');
      }
      setVendorModalOpen(false);
      loadData();
    } catch (error) {
      showToast('保存に失敗しました');
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    try {
      await deleteVendor(id);
      showToast('削除しました');
      loadData();
    } catch (error) {
      showToast('削除に失敗しました');
    }
  };

  // 紐付け
  const openMappingModal = (store: Store) => {
    setMappingStore(store);
    const noneMapping = mappings.find(
      (m) => m.store_id === store.id && m.asbestos_type === 'none'
    );
    const asbMapping = mappings.find(
      (m) => m.store_id === store.id && m.asbestos_type === 'asb'
    );
    setMappingData({
      none: {
        carrier: noneMapping?.carrier_id || '',
        processor: noneMapping?.processor_id || '',
        dest: noneMapping?.dest_id || '',
        transfer: '',
        carrier2: '',
        final_dest: '',
      },
      asb: {
        carrier: asbMapping?.carrier_id || '',
        processor: asbMapping?.processor_id || '',
        dest: asbMapping?.dest_id || '',
        transfer: asbMapping?.transfer_id || '',
        carrier2: asbMapping?.carrier2_id || '',
        final_dest: asbMapping?.final_dest_id || '',
      },
    });
    setMappingModalOpen(true);
  };

  const handleMappingChange = async (
    type: 'none' | 'asb',
    field: 'carrier' | 'processor' | 'dest' | 'transfer' | 'carrier2' | 'final_dest',
    value: string
  ) => {
    if (!mappingStore) return;

    const newData = {
      ...mappingData,
      [type]: { ...mappingData[type], [field]: value },
    };
    setMappingData(newData);

    try {
      await upsertMapping({
        store_id: mappingStore.id,
        asbestos_type: type,
        carrier_id: newData[type].carrier || null,
        processor_id: newData[type].processor || null,
        dest_id: newData[type].dest || null,
        transfer_id: newData[type].transfer || null,
        carrier2_id: newData[type].carrier2 || null,
        final_dest_id: newData[type].final_dest || null,
        fax: '06-6432-6744',
      });
      showToast('紐付けを更新しました');
      loadData();
    } catch (error) {
      showToast('更新に失敗しました');
    }
  };

  // メール設定
  const handleSaveEmailConfig = async () => {
    if (!emailConfig) return;
    try {
      await updateEmailConfig({
        shared_email: emailConfig.shared_email,
        emailjs_service_id: emailConfig.emailjs_service_id,
        emailjs_template_id: emailConfig.emailjs_template_id,
        emailjs_public_key: emailConfig.emailjs_public_key,
        slack_webhook_url: emailConfig.slack_webhook_url,
      });
      showToast('メール設定を保存しました');
    } catch (error) {
      showToast('保存に失敗しました');
    }
  };

  const getVendorsByCategory = (cat: VendorCategory) =>
    vendors.filter((v) => v.category === cat);

  const getMappingSummary = (storeId: string) => {
    const noneMapping = mappings.find(
      (m) => m.store_id === storeId && m.asbestos_type === 'none'
    );
    const asbMapping = mappings.find(
      (m) => m.store_id === storeId && m.asbestos_type === 'asb'
    );
    const noneCarrier = noneMapping?.carrier_id
      ? vendors.find((v) => v.id === noneMapping.carrier_id)?.name
      : '未設定';
    const asbCarrier = asbMapping?.carrier_id
      ? vendors.find((v) => v.id === asbMapping.carrier_id)?.name
      : '未設定';
    return `石綿なし: ${noneCarrier}　／　石綿あり: ${asbCarrier}`;
  };

  return (
    <div className="page on">
      <div className="ph">マスター設定</div>
      <div className="ps">
        店舗・業者・紐付けの管理。ここで設定した情報がマニフェストに自動反映されます。
      </div>

      {/* 店舗一覧 */}
      <div className="sc" style={{ marginBottom: '18px' }}>
        <div className="sch">
          <h3>🏪 店舗一覧</h3>
          <button className="add-btn" onClick={() => setStoreModalOpen(true)}>
            ＋ 追加
          </button>
        </div>
        <div className="sl">
          {stores.map((store) => (
            <div key={store.id} className="si">
              <div className="sin">
                <div className="sin-name">{store.name}</div>
                <div className="sin-sub">ID: {store.store_code}</div>
              </div>
              <button
                className="s-del"
                onClick={() => handleDeleteStore(store.id)}
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 業者4分類 */}
      <div className="st-cats">
        {CAT_KEYS.map((cat) => (
          <div key={cat} className="sc">
            <div className="sch">
              <h3>
                {cat === 'carrier' && '🚛 '}
                {cat === 'processor' && '♻ '}
                {cat === 'dest' && '📍 '}
                {cat === 'transfer' && '🔄 '}
                {CATEGORY_NAMES[cat]}
              </h3>
              <button className="add-btn" onClick={() => openVendorModal(cat)}>
                ＋
              </button>
            </div>
            <div className="sl">
              {getVendorsByCategory(cat).map((vendor) => (
                <div key={vendor.id} className="si">
                  <div className="sin">
                    <div className="sin-name">{vendor.name}</div>
                    <div className="sin-sub">
                      TEL: {vendor.tel || '—'}
                      {vendor.jwnet_no && ` / 加入者: ${vendor.jwnet_no}`}
                    </div>
                  </div>
                  <button
                    className="s-edit"
                    onClick={() => openVendorModal(cat, vendor)}
                  >
                    編集
                  </button>
                  <button
                    className="s-del"
                    onClick={() => handleDeleteVendor(vendor.id)}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 紐付け設定 */}
      <div className="sc" style={{ marginTop: '18px' }}>
        <div className="sch">
          <h3>🔗 店舗 ↔ 業者 紐付け設定</h3>
          <span style={{ fontSize: '11px', color: 'var(--tx3)' }}>
            店舗名をクリックして編集
          </span>
        </div>
        <div style={{ padding: '6px' }}>
          {stores.map((store) => (
            <div
              key={store.id}
              className="si"
              style={{ cursor: 'pointer' }}
              onClick={() => openMappingModal(store)}
            >
              <div className="sin">
                <div className="sin-name">{store.name}</div>
                <div className="sin-sub">{getMappingSummary(store.id)}</div>
              </div>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--tx3)',
                  padding: '4px 10px',
                  border: '1.5px solid var(--bdr)',
                  borderRadius: '6px',
                }}
              >
                編集 →
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* メール通知設定 */}
      <div className="sc" style={{ marginTop: '18px' }}>
        <div className="sch">
          <h3>📧 メール通知設定</h3>
        </div>
        <div
          style={{
            padding: '18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '14px',
          }}
        >
          <div className="fg">
            <label>共有アドレス（必須）</label>
            <input
              type="email"
              value={emailConfig?.shared_email || ''}
              onChange={(e) =>
                setEmailConfig((prev) =>
                  prev ? { ...prev, shared_email: e.target.value } : prev
                )
              }
              placeholder="info@kyoei.co.jp"
            />
          </div>
          <div className="fg">
            <label>Slack Webhook URL</label>
            <input
              type="text"
              value={emailConfig?.slack_webhook_url || ''}
              onChange={(e) =>
                setEmailConfig((prev) =>
                  prev ? { ...prev, slack_webhook_url: e.target.value } : prev
                )
              }
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
          <div className="fg">
            <label>EmailJS サービスID</label>
            <input
              type="text"
              value={emailConfig?.emailjs_service_id || ''}
              onChange={(e) =>
                setEmailConfig((prev) =>
                  prev ? { ...prev, emailjs_service_id: e.target.value } : prev
                )
              }
              placeholder="service_xxxxxxx"
            />
          </div>
          <div className="fg">
            <label>EmailJS テンプレートID</label>
            <input
              type="text"
              value={emailConfig?.emailjs_template_id || ''}
              onChange={(e) =>
                setEmailConfig((prev) =>
                  prev ? { ...prev, emailjs_template_id: e.target.value } : prev
                )
              }
              placeholder="template_xxxxxxx"
            />
          </div>
          <div className="fg">
            <label>EmailJS 公開キー</label>
            <input
              type="text"
              value={emailConfig?.emailjs_public_key || ''}
              onChange={(e) =>
                setEmailConfig((prev) =>
                  prev ? { ...prev, emailjs_public_key: e.target.value } : prev
                )
              }
              placeholder="xxxxxxxxxxxxxxxxxxxx"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="add-btn"
              style={{ padding: '8px 20px', fontSize: '13px' }}
              onClick={handleSaveEmailConfig}
            >
              設定を保存
            </button>
          </div>
          <div
            style={{
              gridColumn: '1 / -1',
              background: 'var(--sur2)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: 'var(--tx2)',
              lineHeight: 1.7,
            }}
          >
            💡 <b>EmailJS の設定方法：</b>
            <br />
            ①{' '}
            <a
              href="https://www.emailjs.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--bl)' }}
            >
              emailjs.com
            </a>{' '}
            で無料アカウント作成（月200通まで無料）
            <br />
            ② Email Service でGmailなどを連携 → サービスIDをコピー
            <br />
            ③ Email Templates でテンプレート作成 → テンプレートIDをコピー
            <br />④ Account → Public Key をコピーして上記に入力
          </div>
        </div>
      </div>

      {/* 店舗追加モーダル */}
      <div className={`vnd-ov ${storeModalOpen ? 'on' : ''}`}>
        <div className="vnd-modal" style={{ maxWidth: '400px' }}>
          <div className="vnd-mh">
            <h3>店舗を追加</h3>
            <button
              style={{
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              onClick={() => setStoreModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '24px' }}>
            <div className="fg">
              <label>店舗名</label>
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="アークホーム○○店"
                onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
              />
            </div>
          </div>
          <div className="vnd-mf">
            <button
              className="vnd-cancel"
              onClick={() => setStoreModalOpen(false)}
            >
              キャンセル
            </button>
            <button className="vnd-save" onClick={handleAddStore}>
              追加
            </button>
          </div>
        </div>
      </div>

      {/* 業者編集モーダル */}
      <div className={`vnd-ov ${vendorModalOpen ? 'on' : ''}`}>
        <div className="vnd-modal">
          <div className="vnd-mh">
            <h3>
              {editingVendor ? '業者を編集' : '業者を追加'}（
              {CATEGORY_NAMES[vendorCategory]}）
            </h3>
            <button
              style={{
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              onClick={() => setVendorModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="vnd-mb">
            <div className="fg full">
              <label>業者名</label>
              <input
                type="text"
                value={vendorForm.name}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, name: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>TEL</label>
              <input
                type="text"
                value={vendorForm.tel}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, tel: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>FAX</label>
              <input
                type="text"
                value={vendorForm.fax}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, fax: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>加入者番号</label>
              <input
                type="text"
                value={vendorForm.jwnet_no}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, jwnet_no: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>公開パスワード</label>
              <input
                type="text"
                value={vendorForm.jwnet_pw}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, jwnet_pw: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>郵便番号</label>
              <input
                type="text"
                value={vendorForm.zip}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, zip: e.target.value })
                }
              />
            </div>
            <div className="fg">
              <label>担当者連絡先</label>
              <input
                type="text"
                value={vendorForm.contact}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, contact: e.target.value })
                }
              />
            </div>
            <div className="fg full">
              <label>メールアドレス</label>
              <input
                type="email"
                value={vendorForm.email}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, email: e.target.value })
                }
                placeholder="example@company.co.jp"
              />
            </div>
            <div className="fg full">
              <label>住所</label>
              <input
                type="text"
                value={vendorForm.address}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, address: e.target.value })
                }
              />
            </div>
          </div>
          <div className="vnd-mf">
            <button
              className="vnd-cancel"
              onClick={() => setVendorModalOpen(false)}
            >
              キャンセル
            </button>
            <button className="vnd-save" onClick={handleSaveVendor}>
              {editingVendor ? '保存' : '追加'}
            </button>
          </div>
        </div>
      </div>

      {/* 紐付け編集モーダル */}
      <div className={`vnd-ov ${mappingModalOpen ? 'on' : ''}`}>
        <div className="vnd-modal" style={{ maxWidth: '560px' }}>
          <div className="vnd-mh">
            <h3>🔗 {mappingStore?.name}　紐付け設定</h3>
            <button
              style={{
                background: 'rgba(255,255,255,.15)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
              onClick={() => setMappingModalOpen(false)}
            >
              ✕
            </button>
          </div>
          <div style={{ padding: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--tx3)',
                marginBottom: '8px',
                borderBottom: '1px solid var(--bdr)',
                paddingBottom: '4px',
              }}
            >
              石綿なし
            </div>
            {(['carrier', 'processor', 'dest'] as const).map((field) => (
              <div
                key={`none-${field}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '110px auto 1fr',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                  {CATEGORY_NAMES[field]}
                </span>
                <span style={{ color: 'var(--tx3)' }}>→</span>
                <select
                  className="map-sel"
                  value={mappingData.none[field]}
                  onChange={(e) =>
                    handleMappingChange('none', field, e.target.value)
                  }
                >
                  <option value="">選択</option>
                  {getVendorsByCategory(field).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--rd)',
                margin: '14px 0 8px',
                borderBottom: '1px solid var(--rdl)',
                paddingBottom: '4px',
              }}
            >
              石綿あり
            </div>
            {(['carrier', 'processor', 'dest', 'transfer', 'carrier2', 'final_dest'] as const).map(
              (field) => (
                <div
                  key={`asb-${field}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px auto 1fr',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '8px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                    {CATEGORY_NAMES[field]}
                  </span>
                  <span style={{ color: 'var(--tx3)' }}>→</span>
                  <select
                    className="map-sel"
                    value={mappingData.asb[field]}
                    onChange={(e) =>
                      handleMappingChange('asb', field, e.target.value)
                    }
                  >
                    <option value="">選択</option>
                    {getVendorsByCategory(field).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )
            )}
          </div>
          <div className="vnd-mf">
            <button
              className="vnd-cancel"
              onClick={() => setMappingModalOpen(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
