'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { translate, type Locale } from '@/lib/i18n';

const LanguageContext = createContext<{locale: Locale; ready: boolean; setLocale: (locale: Locale) => void; t: (message: string) => string}>({locale:'en',ready:false,setLocale:()=>{},t:message=>translate(message,'en')});
const STORAGE_KEY = 'precidoc-language';

export function LanguageProvider({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  const [locale,setLanguage] = useState<Locale>('en');
  const [ready,setReady] = useState(false);
  useEffect(() => {
    try { const saved=localStorage.getItem(STORAGE_KEY); if(saved==='en'||saved==='id')setLanguage(saved); } catch { /* Device storage can be disabled. */ }
    setReady(true);
  },[]);
  useEffect(() => {
    if(!ready)return;
    document.documentElement.lang=locale;
    const title = pathname === '/auth/sign-in' ? (locale === 'en' ? 'Sign In' : 'Masuk') : pathname === '/register' ? (locale === 'en' ? 'Create an Account' : 'Buat Akun') : pathname === '/sample' ? (locale === 'en' ? 'Sample Workspace' : 'Workspace Contoh') : pathname === '/app' ? (locale === 'en' ? 'Document Workspace' : 'Workspace Dokumen') : (locale === 'en' ? 'Prepare Documents for AI' : 'Siapkan Dokumen untuk AI');
    document.title = `${title} | Precidoc`;
    const description=document.querySelector('meta[name="description"]');
    description?.setAttribute('content',locale==='en'?'Extract, review, and prepare documents for your knowledge base, with source references attached.':'Ekstrak, periksa, dan siapkan dokumen untuk knowledge base dengan referensi sumber.');
    try { localStorage.setItem(STORAGE_KEY,locale); } catch { /* The language still works without persistence. */ }
  },[locale,ready,pathname]);
  const setLocale=useCallback((next:Locale)=>setLanguage(next),[]);
  const t=useCallback((message:string)=>translate(message,locale),[locale]);
  return <LanguageContext.Provider value={{locale,ready,setLocale,t}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){return useContext(LanguageContext);}
export function LanguageSwitch(){
  const {locale,setLocale}=useLanguage();
  return <Select value={locale} onValueChange={value=>{if(value==='en'||value==='id')setLocale(value);}}><SelectTrigger className="language-switch" aria-label={locale==='en'?'Language':'Bahasa'}><Languages size={16}/><SelectValue>{locale==='en'?'English':'Indonesia'}</SelectValue></SelectTrigger><SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="id">Bahasa Indonesia</SelectItem></SelectContent></Select>;
}
