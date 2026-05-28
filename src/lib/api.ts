import { supabase } from './supabase';
import {
  Store,
  Vendor,
  VendorCategory,
  StoreVendorMapping,
  Request,
  RequestStatus,
  EmailConfig,
  RoutingInfo,
  VendorSnapshot,
  AsbestosType,
} from '@/types';
import { generateRequestCode } from './utils';

// =====================================================
// 店舗 (Stores)
// =====================================================

export async function getStores(): Promise<Store[]> {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createStore(name: string): Promise<Store> {
  const store_code = 'store_' + Date.now();
  const { data, error } = await supabase
    .from('stores')
    .insert({ store_code, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStore(id: string): Promise<void> {
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) throw error;
}

// =====================================================
// 業者 (Vendors)
// =====================================================

export async function getVendors(): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getVendorsByCategory(category: VendorCategory): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('category', category)
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function createVendor(vendor: Omit<Vendor, 'id' | 'vendor_code' | 'created_at' | 'updated_at'>): Promise<Vendor> {
  const vendor_code = 'v_' + Date.now();
  const { data, error } = await supabase
    .from('vendors')
    .insert({ ...vendor, vendor_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateVendor(id: string, vendor: Partial<Vendor>): Promise<Vendor> {
  const { data, error } = await supabase
    .from('vendors')
    .update(vendor)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteVendor(id: string): Promise<void> {
  const { error } = await supabase.from('vendors').delete().eq('id', id);
  if (error) throw error;
}

// =====================================================
// 店舗-業者紐付け (Store Vendor Mappings)
// =====================================================

export async function getMappings(): Promise<StoreVendorMapping[]> {
  const { data, error } = await supabase
    .from('store_vendor_mappings')
    .select('*');
  if (error) throw error;
  return data || [];
}

export async function getMappingsByStore(storeId: string): Promise<StoreVendorMapping[]> {
  const { data, error } = await supabase
    .from('store_vendor_mappings')
    .select('*')
    .eq('store_id', storeId);
  if (error) throw error;
  return data || [];
}

export async function upsertMapping(mapping: Omit<StoreVendorMapping, 'id' | 'created_at' | 'updated_at'>): Promise<StoreVendorMapping> {
  // 既存のマッピングを確認
  const { data: existing } = await supabase
    .from('store_vendor_mappings')
    .select('id')
    .eq('store_id', mapping.store_id)
    .eq('asbestos_type', mapping.asbestos_type)
    .single();

  if (existing) {
    // 更新
    const { data, error } = await supabase
      .from('store_vendor_mappings')
      .update(mapping)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // 新規作成
    const { data, error } = await supabase
      .from('store_vendor_mappings')
      .insert(mapping)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// ルーティング情報を取得してスナップショット生成
export async function getRouting(
  storeId: string,
  asbestosType: AsbestosType,
  vendors: Vendor[]
): Promise<RoutingInfo | null> {
  const { data: mapping } = await supabase
    .from('store_vendor_mappings')
    .select('*')
    .eq('store_id', storeId)
    .eq('asbestos_type', asbestosType)
    .single();

  if (!mapping) return null;

  const findVendor = (id: string | null): VendorSnapshot | null => {
    if (!id) return null;
    const v = vendors.find((v) => v.id === id);
    if (!v) return null;
    return {
      name: v.name,
      tel: v.tel || '',
      no: v.jwnet_no || '',
      pw: v.jwnet_pw || '',
      zip: v.zip || '',
      addr: v.address || '',
      fax: v.fax || '',
      contact: v.contact || '',
      email: v.email || '',
    };
  };

  return {
    carrier: findVendor(mapping.carrier_id),
    processor: findVendor(mapping.processor_id),
    dest: findVendor(mapping.dest_id),
    transfer: findVendor(mapping.transfer_id),
    carrier2: findVendor(mapping.carrier2_id || null),
    final_dest: findVendor(mapping.final_dest_id || null),
    fax: mapping.fax,
  };
}

// =====================================================
// 回収依頼 (Requests)
// =====================================================

// routing_none / routing_asb の文字列JSONをパース＆フィールド正規化
// DBからは文字列で来るため、RoutingInfo型に変換する
function parseRouting(raw: string | RoutingInfo | null): RoutingInfo | null {
  if (!raw) return null;
  const r: any = typeof raw === 'string' ? JSON.parse(raw) : raw;
  // すでに正しい型の場合はそのまま返す
  if (r.carrier && typeof r.carrier === 'object' && 'no' in r.carrier) return r as RoutingInfo;
  const snap = (v: any): VendorSnapshot | null => {
    if (!v) return null;
    return {
      name: v.name || '',
      tel: v.tel || '',
      no: v.jwnet_no || v.no || '',       // vendors: jwnet_no → VendorSnapshot: no
      pw: v.jwnet_pw || v.pw || '',        // vendors: jwnet_pw → VendorSnapshot: pw
      zip: v.zip || '',
      addr: v.address || v.addr || '',     // vendors: address → VendorSnapshot: addr
      fax: v.fax || '',
      contact: v.contact || '',
      email: v.email || '',
    };
  };
  return {
    carrier:   snap(r.carrier),
    processor: snap(r.processor),
    dest:      snap(r.dest),
    transfer:  snap(r.transfer),
    carrier2:  snap(r.carrier2),
    final_dest: snap(r.final_dest),
    fax: r.fax || null,
  };
}

export async function getRequests(): Promise<Request[]> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((r: any) => ({
    ...r,
    routing_none: parseRouting(r.routing_none),
    routing_asb:  parseRouting(r.routing_asb),
  }));
}

export async function getRequestById(id: string): Promise<Request | null> {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data ? {
    ...data,
    routing_none: parseRouting(data.routing_none),
    routing_asb:  parseRouting(data.routing_asb),
  } : null;
}

export async function createRequest(
  request: Omit<Request, 'id' | 'request_code' | 'created_at' | 'updated_at'>
): Promise<Request> {
  const request_code = generateRequestCode();
  const { data, error } = await supabase
    .from('requests')
    .insert({ ...request, request_code })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// お客様フォーム用：ブラウザから直接Supabaseへ書き込まず、同一オリジンのAPI経由で保存する。
// 店舗側ネットワークが外部ドメインへの書き込みを遮断していても通るようにするための経路。
export async function createRequestViaApi(
  request: Omit<Request, 'id' | 'request_code' | 'created_at' | 'updated_at'>
): Promise<Request> {
  const res = await fetch('/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`/api/requests が失敗しました (HTTP ${res.status}) ${detail}`.trim());
  }
  return await res.json();
}

export async function updateRequestStatus(id: string, status: RequestStatus): Promise<Request> {
  const { data, error } = await supabase
    .from('requests')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateRequest(
  id: string,
  updates: Partial<Omit<Request, 'id' | 'request_code' | 'created_at' | 'updated_at'>>
): Promise<Request> {
  const { data, error } = await supabase
    .from('requests')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return {
    ...data,
    routing_none: parseRouting(data.routing_none),
    routing_asb: parseRouting(data.routing_asb),
  };
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase.from('requests').delete().eq('id', id);
  if (error) throw error;
}

// =====================================================
// メール設定 (Email Config)
// =====================================================

export async function getEmailConfig(): Promise<EmailConfig | null> {
  const { data, error } = await supabase
    .from('email_config')
    .select('*')
    .eq('id', 1)
    .single();
  if (error) return null;
  return data;
}

export async function updateEmailConfig(
  config: Omit<EmailConfig, 'id' | 'updated_at'>
): Promise<EmailConfig> {
  const { data, error } = await supabase
    .from('email_config')
    .upsert({ id: 1, ...config })
    .select()
    .single();
  if (error) throw error;
  return data;
}
