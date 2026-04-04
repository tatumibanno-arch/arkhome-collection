// 店舗
export interface Store {
  id: string;
  store_code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// 業者カテゴリ
export type VendorCategory = 'carrier' | 'processor' | 'dest' | 'transfer' | 'carrier2' | 'final_dest';

// 業者
export interface Vendor {
  id: string;
  vendor_code: string;
  category: VendorCategory;
  name: string;
  tel: string | null;
  fax: string | null;
  zip: string | null;
  address: string | null;
  jwnet_no: string | null;
  jwnet_pw: string | null;
  contact: string | null;
  created_at: string;
  updated_at: string;
}

// アスベストタイプ
export type AsbestosType = 'none' | 'asb';

// 店舗-業者紐付け
export interface StoreVendorMapping {
  id: string;
  store_id: string;
  asbestos_type: AsbestosType;
  carrier_id: string | null;
  processor_id: string | null;
  dest_id: string | null;
  transfer_id: string | null;
  carrier2_id: string | null;
  final_dest_id: string | null;
  fax: string | null;
  created_at: string;
  updated_at: string;
}

// リクエストステータス
export type RequestStatus = '0' | '1' | '2' | '3' | '4' | '5';

// ヘルパータイプ
export type HelperType = 'none' | 'yes';

// ルーティング情報（JSONB）
export interface RoutingInfo {
  carrier: VendorSnapshot | null;
  processor: VendorSnapshot | null;
  dest: VendorSnapshot | null;
  transfer: VendorSnapshot | null;
  carrier2: VendorSnapshot | null;
  final_dest: VendorSnapshot | null;
  fax: string | null;
}

// 業者スナップショット
export interface VendorSnapshot {
  name: string;
  tel: string;
  no: string;
  pw: string;
  zip: string;
  addr: string;
  fax: string;
  contact: string;
}

// 回収依頼
export interface Request {
  id: string;
  request_code: string;
  store_id: string;
  store_name: string;
  staff: string;
  staff_tel: string;
  email: string;
  customer_name: string;
  zip: string | null;
  address: string;
  builder: string | null;
  chief: string;
  chief_tel: string;
  collection_date: string;
  time_from: string;
  time_to: string;
  car_size: string | null;
  helper: HelperType;
  vol_kitchen: number;
  vol_bath: number;
  vol_toilet: number;
  vol_other: number;
  has_asbestos: boolean;
  vol_asbestos: number;
  note: string | null;
  status: RequestStatus;
  routing_none: RoutingInfo | null;
  routing_asb: RoutingInfo | null;
  created_at: string;
  updated_at: string;
}

// メール設定
export interface EmailConfig {
  id: number;
  shared_email: string | null;
  emailjs_service_id: string | null;
  emailjs_template_id: string | null;
  emailjs_public_key: string | null;
  slack_webhook_url: string | null;
  updated_at: string;
}

// ステータス定義
export const STATUSES: Record<RequestStatus, string> = {
  '0': '依頼受付',
  '1': '配車手配中',
  '2': '配車完了',
  '3': '回収済み',
  '4': '請求書発行',
  '5': '完了',
};

// ステータス背景色
export const STATUS_BG: Record<RequestStatus, string> = {
  '0': 'var(--rdl)',
  '1': 'var(--ambl)',
  '2': 'var(--bll)',
  '3': 'var(--tll)',
  '4': 'var(--pul)',
  '5': 'var(--gl)',
};

// ステータス文字色
export const STATUS_FG: Record<RequestStatus, string> = {
  '0': 'var(--rd)',
  '1': 'var(--amb)',
  '2': 'var(--bl)',
  '3': 'var(--tl)',
  '4': 'var(--pu)',
  '5': 'var(--g)',
};

// カテゴリ名
export const CATEGORY_NAMES: Record<VendorCategory, string> = {
  carrier: '収集運搬業者',
  processor: '処分業者',
  dest: '運搬先の事業所',
  transfer: '積替え保管',
  carrier2: '2次収集運搬業者',
  final_dest: '最終処分場',
};

// 定数
export const DISCHARGER = 'アークホーム㈱（埼玉県さいたま市浦和区上木崎1丁目13番地1号）';
export const RUSEAL_FAX = '042-978-5592';
export const KYOEI_FAX = '06-6432-6744';
export const KYOEI = '共栄紙業㈱';
