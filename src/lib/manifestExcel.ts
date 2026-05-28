import XlsxPopulate from 'xlsx-populate';
import { Request } from '@/types';
import { manifestNoneB64 } from '@/templates/manifestNone';
import { manifestAsbB64 } from '@/templates/manifestAsb';

// 公式マニフェスト雛形（Excel）に依頼データを流し込んで .xlsx バッファを返す。
// 雛形のレイアウト・図形・計算式・書式はそのまま保持され、空セルにだけ値を書き込む。
// セル割り当ては実機の雛形で確認済み（通常版＝石綿なし／石綿あり版）。

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

function setCell(s: any, addr: string, v: unknown) {
  if (v !== undefined && v !== null && v !== '') s.cell(addr).value(v as any);
}
function checkCell(s: any, addr: string) {
  const c = s.cell(addr);
  c.value(String(c.value() ?? '').replace('□', '☑'));
}

// 通常版（石綿なし）
function fillNone(s: any, req: Request) {
  const rt = pickRouting(req, 'none');
  const carrier: SnapLike = rt.carrier || {};
  const dest: SnapLike = rt.dest || {};
  const proc: SnapLike = rt.processor || {};
  const [y, m, d] = (req.collection_date || '').split('-');

  setCell(s, 'W1', intPart(y));
  setCell(s, 'Z1', intPart(m));
  setCell(s, 'AC1', intPart(d));
  setCell(s, 'H3', intPart(y));
  setCell(s, 'K3', intPart(m));
  setCell(s, 'N3', intPart(d));
  setCell(s, 'G4', req.time_from);
  setCell(s, 'M4', req.time_to);
  setCell(s, 'G5', req.customer_name);
  setCell(s, 'G6', (req.zip ? `〒${req.zip} ` : '') + (req.address || ''));
  setCell(s, 'V4', carrier?.name);
  setCell(s, 'V5', carrier?.contact);
  setCell(s, 'Q7', req.store_name);
  setCell(s, 'V7', req.staff);
  setCell(s, 'AA7', req.staff_tel);
  setCell(s, 'Q9', req.builder);
  setCell(s, 'V9', req.chief);
  setCell(s, 'AA9', req.chief_tel);
  setCell(s, 'S11', req.note);

  // 排出予定量（数量㎥欄は現場手書きのため空欄）
  if (req.vol_kitchen > 0) { setCell(s, 'G8', req.vol_kitchen); checkCell(s, 'G7'); }
  if (req.vol_bath > 0) { setCell(s, 'L8', req.vol_bath); checkCell(s, 'L7'); }
  if (req.vol_toilet > 0) { setCell(s, 'G10', req.vol_toilet); checkCell(s, 'G9'); }
  if (req.vol_other > 0) { setCell(s, 'L10', req.vol_other); checkCell(s, 'L9'); }

  // 車両サイズ（行11）／補助人工（行10）
  if (req.car_size === '軽トラ') checkCell(s, 'G11');
  else if (req.car_size === '2t車') checkCell(s, 'J11');
  else if (req.car_size === '4t車') checkCell(s, 'M11');
  if (req.helper === 'yes') checkCell(s, 'W10');
  else checkCell(s, 'V10');

  // マニフェスト本体
  setCell(s, 'D15', req.store_name);
  setCell(s, 'V13', req.customer_name);
  setCell(s, 'V15', req.zip);
  setCell(s, 'Z15', req.chief_tel);
  setCell(s, 'S16', req.address);

  setCell(s, 'D29', carrier?.name);
  setCell(s, 'K29', carrier?.no);
  setCell(s, 'N29', carrier?.pw);
  setCell(s, 'G30', carrier?.zip);
  setCell(s, 'K30', carrier?.tel);
  setCell(s, 'D31', carrier?.addr);

  setCell(s, 'S29', dest?.name);
  setCell(s, 'Z29', dest?.no);
  setCell(s, 'AC29', dest?.pw);
  setCell(s, 'V30', dest?.zip);
  setCell(s, 'Z30', dest?.tel);
  setCell(s, 'S31', dest?.addr);

  setCell(s, 'G32', proc?.name);
  setCell(s, 'G34', proc?.zip);
  setCell(s, 'K34', proc?.tel);
  setCell(s, 'D35', proc?.addr);
  // 積替え又は保管は通常版では＊のまま（触らない）
}

// 石綿あり版（がれき類＝石綿含有。「有」の○は雛形に図形として常設）
function fillAsb(s: any, req: Request) {
  const rt = pickRouting(req, 'asb');
  const carrier: SnapLike = rt.carrier || {};
  const dest: SnapLike = rt.dest || {};
  const proc: SnapLike = rt.processor || {};
  const finalDest: SnapLike = rt.final_dest || null;
  const transfer: SnapLike = rt.transfer || null;
  // 茨木目垣店は積替え保管ありの特例：処分業者欄にマスターの「最終処分場」を入れる
  const isIbaraki = req.store_name === 'アークホーム茨木目垣店';
  const procBox: SnapLike =
    isIbaraki && finalDest && finalDest.name ? finalDest : proc;
  const [y, m, d] = (req.collection_date || '').split('-');

  setCell(s, 'V2', intPart(y));
  setCell(s, 'Z2', intPart(m));
  setCell(s, 'AC2', intPart(d));
  setCell(s, 'H4', intPart(y));
  setCell(s, 'K4', intPart(m));
  setCell(s, 'N4', intPart(d));
  setCell(s, 'G5', req.time_from);
  setCell(s, 'M5', req.time_to);
  // 依頼場所（→現場名・店舗・所在地は雛形の式で自動コピー）
  setCell(s, 'G6', req.customer_name);
  setCell(s, 'G7', (req.zip ? `〒${req.zip} ` : '') + (req.address || ''));
  // 回収依頼(V4)は空欄（通常版と統一）
  setCell(s, 'V5', carrier?.name);
  setCell(s, 'V6', carrier?.contact);
  setCell(s, 'Q8', req.store_name);
  setCell(s, 'V8', req.staff);
  setCell(s, 'AA8', req.staff_tel);
  setCell(s, 'Q10', req.builder);
  setCell(s, 'V10', req.chief);
  setCell(s, 'AA10', req.chief_tel);
  setCell(s, 'S12', req.note);

  // 排出予定量（数量は手書きのため空欄）
  if (req.vol_kitchen > 0) { setCell(s, 'G9', req.vol_kitchen); checkCell(s, 'G8'); }
  if (req.vol_bath > 0) { setCell(s, 'L9', req.vol_bath); checkCell(s, 'L8'); }
  if (req.vol_toilet > 0) { setCell(s, 'G11', req.vol_toilet); checkCell(s, 'G10'); }
  if (req.vol_other > 0) { setCell(s, 'L11', req.vol_other); checkCell(s, 'L10'); }

  // 車両サイズ（行12）／補助人工（行11）
  if (req.car_size === '軽トラ') checkCell(s, 'G12');
  else if (req.car_size === '2t車') checkCell(s, 'J12');
  else if (req.car_size === '4t車') checkCell(s, 'M12');
  if (req.helper === 'yes') checkCell(s, 'W11');
  else checkCell(s, 'V11');

  // アスベスト：有の○は図形で常設済み。数量(㎥)を「無・有 ___」の末尾に追記
  if (req.vol_asbestos > 0) {
    const c = s.cell('B10');
    c.value(String(c.value() ?? '') + req.vol_asbestos);
  }

  // 事業場 所在地
  setCell(s, 'V16', req.zip);
  setCell(s, 'Z16', req.chief_tel);

  // 品目①（通常ごみ）・②（がれき類）の数量は空欄（手書き）

  // 運搬業者
  setCell(s, 'D30', carrier?.name);
  setCell(s, 'G31', carrier?.zip);
  setCell(s, 'K31', carrier?.tel);
  setCell(s, 'D32', carrier?.addr);
  // 運搬先事業場
  setCell(s, 'S30', dest?.name);
  setCell(s, 'V31', dest?.zip);
  setCell(s, 'Z31', dest?.tel);
  setCell(s, 'S32', dest?.addr);
  // 処分業者（茨木目垣店は最終処分場を入れる）
  setCell(s, 'G33', procBox?.name);
  setCell(s, 'G35', procBox?.zip);
  setCell(s, 'K35', procBox?.tel);
  setCell(s, 'D36', procBox?.addr);

  // 積替え又は保管：マスターに登録があれば記入、なければ＊（米）
  if (transfer && transfer.name) {
    setCell(s, 'V33', transfer.name);
    setCell(s, 'V35', transfer.zip);
    setCell(s, 'Z35', transfer.tel);
    setCell(s, 'S36', transfer.addr);
  } else {
    setCell(s, 'V33', '＊＊＊＊＊＊＊＊＊＊＊＊');
    setCell(s, 'S36', '＊＊＊＊＊＊＊＊＊＊');
  }

  // 茨木目垣店は処分業者欄を「最終処分」表記に変更
  if (isIbaraki) {
    setCell(s, 'B33', '（最終処分）　　処分業者');
  }
}

export async function buildManifestExcel(
  req: Request,
  type: 'none' | 'asb' = 'none'
): Promise<Buffer> {
  const b64 = type === 'asb' ? manifestAsbB64 : manifestNoneB64;
  const buf = Buffer.from(b64, 'base64');
  const wb = await XlsxPopulate.fromDataAsync(buf);
  const s = wb.sheet(0);

  if (type === 'asb') fillAsb(s, req);
  else fillNone(s, req);

  const out = await wb.outputAsync();
  return out as Buffer;
}
