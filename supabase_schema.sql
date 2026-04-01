-- =====================================================
-- 現場回収管理システム Supabase スキーマ
-- =====================================================

-- 1. 店舗テーブル
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 業者テーブル
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('carrier', 'processor', 'dest', 'transfer')),
  name TEXT NOT NULL,
  tel TEXT,
  fax TEXT,
  zip TEXT,
  address TEXT,
  jwnet_no TEXT,
  jwnet_pw TEXT,
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 店舗-業者紐付けテーブル
CREATE TABLE store_vendor_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  asbestos_type TEXT NOT NULL CHECK (asbestos_type IN ('none', 'asb')),
  carrier_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  processor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  dest_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  transfer_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  fax TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, asbestos_type)
);

-- 4. 回収依頼テーブル
CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code TEXT UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE RESTRICT,
  store_name TEXT NOT NULL,
  staff TEXT NOT NULL,
  staff_tel TEXT NOT NULL,
  email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  zip TEXT,
  address TEXT NOT NULL,
  builder TEXT,
  chief TEXT NOT NULL,
  chief_tel TEXT NOT NULL,
  collection_date DATE NOT NULL,
  time_from TEXT NOT NULL,
  time_to TEXT NOT NULL,
  car_size TEXT,
  helper TEXT NOT NULL CHECK (helper IN ('none', 'yes')),
  vol_kitchen DECIMAL(10,2) DEFAULT 0,
  vol_bath DECIMAL(10,2) DEFAULT 0,
  vol_toilet DECIMAL(10,2) DEFAULT 0,
  vol_other DECIMAL(10,2) DEFAULT 0,
  has_asbestos BOOLEAN DEFAULT FALSE,
  vol_asbestos DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  status TEXT NOT NULL DEFAULT '0' CHECK (status IN ('0', '1', '2', '3', '4', '5')),
  routing_none JSONB,
  routing_asb JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. メール設定テーブル（シングルトン）
CREATE TABLE email_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  shared_email TEXT,
  emailjs_service_id TEXT,
  emailjs_template_id TEXT,
  emailjs_public_key TEXT,
  slack_webhook_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RLS (Row Level Security) 設定
-- =====================================================
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_vendor_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;

-- 全員フルアクセス（ログイン機能なしのため）
CREATE POLICY "Allow all for stores" ON stores FOR ALL USING (true);
CREATE POLICY "Allow all for vendors" ON vendors FOR ALL USING (true);
CREATE POLICY "Allow all for store_vendor_mappings" ON store_vendor_mappings FOR ALL USING (true);
CREATE POLICY "Allow all for requests" ON requests FOR ALL USING (true);
CREATE POLICY "Allow all for email_config" ON email_config FOR ALL USING (true);

-- =====================================================
-- updated_at 自動更新トリガー
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_store_vendor_mappings_updated_at
  BEFORE UPDATE ON store_vendor_mappings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_email_config_updated_at
  BEFORE UPDATE ON email_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- 初期データ
-- =====================================================

-- 店舗
INSERT INTO stores (store_code, name) VALUES
  ('store_kanazawa', 'アークホーム金沢店'),
  ('store_fukui', 'アークホーム福井店');

-- 業者
INSERT INTO vendors (vendor_code, category, name, tel, fax, zip, address, jwnet_no, jwnet_pw, contact) VALUES
  -- 収集運搬業者
  ('v_ruseal', 'carrier', '㈱ルシール', '042-978-5591', '042-978-5592', '357-0046', '埼玉県飯能市阿須812-3', '0281349', 'RUS0281', ''),
  ('v_mitsue', 'carrier', '三衛通商㈱', '076-238-3301', '076-238-8885', '920-0211', '石川県金沢市湊4丁目52', '0195127', 'MIT1234', ''),
  
  -- 処分業者
  ('v_daiei', 'processor', '大栄環境㈱', '076-275-6336', '076-275-6300', '924-0071', '石川県白山市徳光町2727-1', '0195115', 'DAI5678', ''),
  ('v_hokuriku', 'processor', '北陸環境サービス㈱', '076-267-1188', '076-267-1199', '920-0376', '石川県金沢市福増町北1200', '0195120', 'HOK9012', ''),
  
  -- 運搬先事業所
  ('v_daiei_dest', 'dest', '大栄環境㈱金沢事業所', '076-275-6336', '076-275-6300', '924-0071', '石川県白山市徳光町2727-1', '0195115', 'DAI5678', ''),
  ('v_ruseal_dest', 'dest', '㈱ルシール飯能事業所', '042-978-5591', '042-978-5592', '357-0046', '埼玉県飯能市阿須812-3', '0281349', 'RUS0281', ''),
  
  -- 積替え保管
  ('v_daiei_transfer', 'transfer', '大栄環境㈱積替保管', '076-275-6336', '076-275-6300', '924-0071', '石川県白山市徳光町2727-1', '0195115', 'DAI5678', '');

-- 紐付け設定（金沢店の例）
INSERT INTO store_vendor_mappings (store_id, asbestos_type, carrier_id, processor_id, dest_id, transfer_id, fax)
SELECT 
  s.id,
  'none',
  (SELECT id FROM vendors WHERE vendor_code = 'v_mitsue'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei_dest'),
  NULL,
  '06-6432-6744'
FROM stores s WHERE s.store_code = 'store_kanazawa';

INSERT INTO store_vendor_mappings (store_id, asbestos_type, carrier_id, processor_id, dest_id, transfer_id, fax)
SELECT 
  s.id,
  'asb',
  (SELECT id FROM vendors WHERE vendor_code = 'v_ruseal'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_ruseal_dest'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei_transfer'),
  '06-6432-6744'
FROM stores s WHERE s.store_code = 'store_kanazawa';

-- 福井店の紐付け
INSERT INTO store_vendor_mappings (store_id, asbestos_type, carrier_id, processor_id, dest_id, transfer_id, fax)
SELECT 
  s.id,
  'none',
  (SELECT id FROM vendors WHERE vendor_code = 'v_mitsue'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_hokuriku'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei_dest'),
  NULL,
  '06-6432-6744'
FROM stores s WHERE s.store_code = 'store_fukui';

INSERT INTO store_vendor_mappings (store_id, asbestos_type, carrier_id, processor_id, dest_id, transfer_id, fax)
SELECT 
  s.id,
  'asb',
  (SELECT id FROM vendors WHERE vendor_code = 'v_ruseal'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_hokuriku'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_ruseal_dest'),
  (SELECT id FROM vendors WHERE vendor_code = 'v_daiei_transfer'),
  '06-6432-6744'
FROM stores s WHERE s.store_code = 'store_fukui';

-- メール設定の初期レコード
INSERT INTO email_config (id, shared_email) VALUES (1, NULL);
