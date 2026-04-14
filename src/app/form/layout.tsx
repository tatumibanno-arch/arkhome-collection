import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '回収依頼フォーム | アークホーム',
  description: 'アークホーム各店舗からの廃棄物回収依頼フォーム',
};

export default function FormLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
