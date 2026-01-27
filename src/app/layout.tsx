import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AmplifyInit from "./AmplifyInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "sg-system",
  description: "sg-system",
};

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT; // 例: ca-pub-xxxxxxxxxxxxxxxx

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* AdSense: 全ページ共通の読み込み（環境変数がある時だけ） */}
        {ADSENSE_CLIENT ? (
          <Script
            id="adsense-script"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Amplify は最初に1回だけ初期化 */}
        <AmplifyInit />
        {children}
      </body>
    </html>
  );
}
