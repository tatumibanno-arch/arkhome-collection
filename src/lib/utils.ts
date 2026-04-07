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

// 電話番号フォーマット（数字のみ抽出→ハイフン自動挿入）
export function formatPhone(input: string): string {
  const digits = toHan(input).replace(/[^\d]/g, '');
  if (digits.length <= 3) return digits;
  if (digits.startsWith('0120') || digits.startsWith('0800')) {
    // フリーダイヤル: 0120-xxx-xxx
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7, 10)}`;
  }
  if (digits.startsWith('090') || digits.startsWith('080') || digits.startsWith('070') || digits.startsWith('050')) {
    // 携帯: 090-xxxx-xxxx
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  // 固定電話: 0xx-xxxx-xxxx
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
}

// 郵便番号フォーマット（数字のみ→ハイフン自動挿入）
export function formatZip(input: string): string {
  const digits = toHan(input).replace(/[^\d]/g, '');
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}`;
}

// 郵便番号から住所を取得
export async function fetchAddressFromZip(zip: string): Promise<string | null> {
  const digits = zip.replace(/[^\d]/g, '');
  if (digits.length !== 7) return null;
  try {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const r = data.results[0];
      return `${r.address1}${r.address2}${r.address3}`;
    }
    return null;
  } catch {
    return null;
  }
}

// メールアドレスの簡易バリデーション
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// 日付が今日より前かチェック
export function isPastDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return target < today;
}
