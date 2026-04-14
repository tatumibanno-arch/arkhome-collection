import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// サーバーサイド専用のSupabaseクライアント（service_role keyで全テーブルアクセス可能）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface VendorSnapshot {
  name: string;
  tel: string;
  no: string;
  pw: string;
  zip: string;
  addr: string;
  fax: string;
  contact: string;
  email: string;
}

interface RoutingInfo {
  carrier: VendorSnapshot | null;
  processor: VendorSnapshot | null;
  dest: VendorSnapshot | null;
  transfer: VendorSnapshot | null;
  carrier2: VendorSnapshot | null;
  final_dest: VendorSnapshot | null;
  fax: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'storeId is required' }, { status: 400 });
    }

    // 業者データをサーバーサイドで取得
    const { data: vendors } = await supabaseAdmin
      .from('vendors')
      .select('*');

    const findVendor = (id: string | null): VendorSnapshot | null => {
      if (!id || !vendors) return null;
      const v = vendors.find((v: any) => v.id === id);
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

    const getRouting = async (asbestosType: string): Promise<RoutingInfo | null> => {
      const { data: mapping } = await supabaseAdmin
        .from('store_vendor_mappings')
        .select('*')
        .eq('store_id', storeId)
        .eq('asbestos_type', asbestosType)
        .single();

      if (!mapping) return null;

      return {
        carrier: findVendor(mapping.carrier_id),
        processor: findVendor(mapping.processor_id),
        dest: findVendor(mapping.dest_id),
        transfer: findVendor(mapping.transfer_id),
        carrier2: findVendor(mapping.carrier2_id || null),
        final_dest: findVendor(mapping.final_dest_id || null),
        fax: mapping.fax,
      };
    };

    const routingNone = await getRouting('none');
    const routingAsb = await getRouting('asb');

    return NextResponse.json({ routingNone, routingAsb });
  } catch (error) {
    console.error('Routing API error:', error);
    return NextResponse.json({ error: 'Failed to get routing' }, { status: 500 });
  }
}
