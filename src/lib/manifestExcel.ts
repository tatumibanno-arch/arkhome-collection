import XlsxPopulate from 'xlsx-populate';
import { Request } from '@/types';
import { manifestNoneB64 } from '@/templates/manifestNone';

// 公式マニフェスト雛形（Excel）に依頼データを流し込んで .xlsx バッファを返す。
// 雛形のレイアウト・図形・計算式・書式はそのまま保持され、空セルにだけ値を書き込む。
// セル割り当ては実機の雛形で確認済み（通常版・石綿なし）。

type SnapLike = {
  name?: string | null;
  tel?: string | null;
  no?: string | null;
  pw?: string | null;
  zip?: string | null;
  addr?: string | null;
  contact?: string | null;
} | null;

function pickRouting(req: Request, type: 'none' | 'asb'): any {
  const raw = type === 'asb' ? req.routing_asb : req.routing_none;
  if (!raw) return {};
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function intPart(s: string | undefined): number | undefined {
  if (!s) return undefined;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : undefined;
}

export async function buildManifestExcel(
  req: Request,
  type: 'none' | 'asb' = 'none'
): Promise<Buffer> {
  // 現状は通常版（石綿なし）のみ。石綿あり/茨木目垣は今後追加。
  const buf = Buffer.from(manifestNoneB64, 'base64');
  const wb = await XlsxPopulate.fromDataAsync(buf);
  const s = wb.sheet(0);

  const set = (addr: string, v: unknown) => {
    if (v !== undefined && v !== null && v !== '') s.cell(addr).value(v as any);
  };
  const check = (addr: string) => {
    const c = s.cell(addr);
    c.value(String(c.value() ?? '').replace('□', '☑'));
  };

  const rt = pickRouting(req, type);
  const carrier: SnapLike = rt.carrier || {};
  const dest: SnapLike = rt.dest || {};
  const proc: SnapLike = rt.processor || {};

  const [y, m, d] = (req.collection_date || '').split('-');

  // 交付日（=回収日）右上
  set('W1', intPart(y));
  set('Z1', intPart(m));
  set('AC1', intPart(d));

  // 回収希望日・時間帯
  set('H3', intPart(y));
  set('K3', intPart(m));
  set('N3', intPart(d));
  set('G4', req.time_from);
  set('M4', req.time_to);

  // 依頼場所
  set('G5', req.customer_name);
  set('G6', (req.zip ? `〒${req.zip} ` : '') + (req.address || ''));

  // 回収業者
  set('V4', carrier?.name);
  set('V5', carrier?.contact);

  // 店舗・現場の担当者
  set('Q7', req.store_name);
  set('V7', req.staff);
  set('AA7', req.staff_tel);
  set('Q9', req.builder);
  set('V9', req.chief);
  set('AA9', req.chief_tel);

  // 備考
  set('S11', req.note);

  // 排出予定量（数量㎥欄は現場手書きのため空欄のまま）
  if (req.vol_kitchen > 0) { set('G8', req.vol_kitchen); check('G7'); }
  if (req.vol_bath > 0) { set('L8', req.vol_bath); check('L7'); }
  if (req.vol_toilet > 0) { set('G10', req.vol_toilet); check('G9'); }
  if (req.vol_other > 0) { set('L10', req.vol_other); check('L9'); }

  // 車両サイズ（行11）
  if (req.car_size === '軽トラ') check('G11');
  else if (req.car_size === '2t車') check('J11');
  else if (req.car_size === '4t車') check('M11');

  // 補助人工の依頼（行10：V10=無 / W10内の□=要）
  if (req.helper === 'yes') check('W10');
  else check('V10');

  // マニフェスト本体：排出事業場・店舗
  set('D15', req.store_name);
  set('V13', req.customer_name);
  set('V15', req.zip);
  set('Z15', req.chief_tel);
  set('S16', req.address);

  // 運搬受託者
  set('D29', carrier?.name);
  set('K29', carrier?.no);
  set('N29', carrier?.pw);
  set('G30', carrier?.zip);
  set('K30', carrier?.tel);
  set('D31', carrier?.addr);

  // 運搬先の事業場
  set('S29', dest?.name);
  set('Z29', dest?.no);
  set('AC29', dest?.pw);
  set('V30', dest?.zip);
  set('Z30', dest?.tel);
  set('S31', dest?.addr);

  // 処分受託者
  set('G32', proc?.name);
  set('G34', proc?.zip);
  set('K34', proc?.tel);
  set('D35', proc?.addr);

  // 積替え又は保管は通常版では＊＊＊のまま（触らない）

  const out = await wb.outputAsync();
  return out as Buffer;
}
