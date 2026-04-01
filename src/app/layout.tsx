import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '現場回収管理システム | 共栄紙業 × アークホーム',
  description: 'アークホーム各店舗から共栄紙業への廃棄物回収依頼・マニフェスト管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
