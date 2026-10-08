import type { Metadata } from 'next';
import './globals.css';
import './landing.css';
import './theme.css';
import './demo.css';
import './account.css';
import './improvements.css';
import './marketing-review.css';
import { LanguageProvider } from '@/components/language';
import { pageMetadata } from '@/lib/page-titles';
export const metadata:Metadata={...pageMetadata('home'),icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>}
