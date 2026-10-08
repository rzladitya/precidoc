import type { Metadata } from 'next';
import './globals.css';
import './landing.css';
import './theme.css';
import './demo.css';
import './account.css';
import { LanguageProvider } from '@/components/language';
export const metadata:Metadata={title:'Precidoc — Document preparation',description:'Extract, review, and prepare documents for your knowledge base, with source references attached.',icons:{icon:'/favicon.svg',shortcut:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LanguageProvider>{children}</LanguageProvider></body></html>}
