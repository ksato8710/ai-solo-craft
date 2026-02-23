import type { Metadata } from "next";
import { DM_Sans, Nunito } from "next/font/google";
import "./globals.css";
import ShareIcon from "@/components/ShareIcon";
import NewsletterButton from "@/components/NewsletterButton";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Solo Craft — AIソロ開発者のための日本語ニュース",
  description: "グローバルのAI最新情報が、ここに集約されている。個人でAIエージェントとともにプロダクト開発する人のための、毎日見るサイト。",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI Solo Craft",
  },
  openGraph: {
    title: "AI Solo Craft",
    description: "AIソロ開発者が毎日最初に見るサイト。グローバルのAI最新情報を日本語で。",
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Solo Craft",
    description: "AIソロ開発者が毎日最初に見るサイト",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${dmSans.variable} ${nunito.variable}`}>
      <head>
        {/* PWA & App Icons */}
        <meta name="theme-color" content="#6B8F71" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="AI Solo Craft" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.svg" />
        <link rel="icon" type="image/svg+xml" href="/icons/favicon.svg" />
      </head>
      <body className="bg-bg-cream text-text-deep">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border bg-bg-cream/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <a href="/" className="flex items-center gap-2 flex-shrink-0">
                <span className="font-heading text-lg sm:text-xl font-extrabold text-accent-leaf">
                  AI Solo Craft
                </span>
              </a>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-6 text-sm">
                <a href="/#digest-summary" className="text-text-muted hover:text-accent-leaf transition-colors">🗞️ 朝夕のまとめ</a>
                <a href="/news" className="text-text-muted hover:text-accent-leaf transition-colors">📰 ニュース</a>
                <a href="/category/products" className="text-text-muted hover:text-accent-leaf transition-colors">🏷️ プロダクト</a>
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <NewsletterButton />
                <ShareIcon />
              </div>
            </div>

            {/* Mobile Navigation - Bottom Row */}
            <nav className="md:hidden flex items-center justify-center gap-6 pb-2 text-xs">
              <a href="/#digest-summary" className="text-text-muted hover:text-accent-leaf transition-colors">🗞️ まとめ</a>
              <a href="/news" className="text-text-muted hover:text-accent-leaf transition-colors">📰 ニュース</a>
              <a href="/category/products" className="text-text-muted hover:text-accent-leaf transition-colors">🏷️ プロダクト</a>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-bg-warm mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-text-muted">
            <p>AI Solo Craft — AIソロ開発者のための日本語ニュースキュレーション</p>
            <p className="mt-1">毎日配信: 🗞️ 朝刊 8:00 ・ 🗞️ 夕刊 18:00（プロダクトは随時更新）</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
