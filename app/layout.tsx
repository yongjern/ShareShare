import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShareShare | 無痛揪團與拆帳',
  description: '快速建立團購、收集訂單與公平拆帳。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
