import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'أكاديمية النخبة بالإسكندرية | Alexandria Elite Academy',
    template: '%s | Alexandria Elite Academy',
  },
  description: 'أكاديمية النخبة بالإسكندرية — مدرسة أمريكية معتمدة. استعلم عن نتيجتك، سجّل طفلك، وتابع مسيرته الأكاديمية. Alexandria Elite Academy — Accredited American School in Alexandria, Egypt.',
  keywords: ['Alexandria Elite Academy', 'أكاديمية النخبة', 'مدرسة أمريكية', 'الإسكندرية', 'نتائج طلاب', 'تسجيل مدرسة', 'American school Alexandria'],
  authors: [{ name: 'Alexandria Elite Academy' }],
  openGraph: {
    title: 'أكاديمية النخبة بالإسكندرية | Alexandria Elite Academy',
    description: 'مدرسة أمريكية معتمدة في الإسكندرية — تعليم متميز باللغتين العربية والإنجليزية',
    type: 'website',
    locale: 'ar_EG',
    siteName: 'Alexandria Elite Academy',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alexandria Elite Academy',
    description: 'Accredited American School in Alexandria, Egypt',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#0a5c36" />
      </head>
      <body>{children}</body>
    </html>
  )
}
