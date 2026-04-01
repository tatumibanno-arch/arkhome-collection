// 依頼番号生成
export function generateRequestCode(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return 'REQ-' + timestamp.slice(-6);
}

// 全角→半角変換
export function toHan(s: string): string {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, ' ');
}

// 数字のみ抽出
export function toHanNum(s: string): string {
  return toHan(s).replace(/[^\d.\-]/g, '');
}

// 日付フォーマット（YYYY-MM-DD → {y, m, d}）
export function formatDate(ds: string | null): { y: string; m: number | string; d: number | string } {
  if (!ds) return { y: '', m: '', d: '' };
  const [y, m, d] = ds.split('-');
  return { y, m: parseInt(m), d: parseInt(d) };
}

// 日付を日本語形式で表示
export function formatDateJP(ds: string | null): string {
  if (!ds) return '';
  const date = new Date(ds);
  return date.toLocaleDateString('ja-JP');
}

// CSV出力
export function exportCSV(data: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(data[0] || {});
  const rows = data.map((row) =>
    headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`)
  );

  const bom = '\uFEFF';
  const csv = bom + [headers.map((h) => `"${h}"`), ...rows].map((r) => r.join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// クリップボードにコピー
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// 時間選択肢生成
export function generateTimeOptions(): string[] {
  return Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
}

// 車両サイズ選択肢
export const CAR_SIZES = ['軽トラ', '2t車', '4t車', 'ユニック'];
