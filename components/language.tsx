'use client';
import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { translate, type Locale } from '@/lib/i18n';
import { pageTitles, getPageDescription, getPageTitleForPath, type PageTitle } from '@/lib/page-titles';

const STORAGE_KEY = 'precidoc-language';
let fallbackLocale: Locale = 'en';
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => { listeners.delete(listener); window.removeEventListener('storage', listener); };
}
function readLocale(): Locale {
  try { const saved = localStorage.getItem(STORAGE_KEY); if (saved === 'en' || saved === 'id') return saved; } catch { /* Language works without device storage. */ }
  return fallbackLocale;
}
const LanguageContext = createContext<{locale: Locale; ready: boolean; setLocale: (locale: Locale) => void; t: (message: string) => string; setPageTitle: (title: PageTitle | null) => void}>({locale:'en',ready:false,setLocale:()=>{},t:message=>translate(message,'en'),setPageTitle:()=>{}});
export function LanguageProvider({children}:{children:React.ReactNode}) {
  const pathname = usePathname();
  const locale = useSyncExternalStore(subscribe, readLocale, () => 'en' as Locale);
  const ready = useSyncExternalStore(subscribe, () => true, () => false);
  const [override, setOverride] = useState<{path:string|null; title:PageTitle} | null>(null);
  const setPageTitle = useCallback((title: PageTitle | null) => setOverride(title ? {path:pathname,title} : null), [pathname]);
  const base = getPageTitleForPath(pathname);
  const page = override?.path === pathname ? override.title : base;
  const title = `${pageTitles[page][locale === 'en' ? 0 : 1]} | Precidoc`;
  const pageDescription = getPageDescription(page, locale);
  useEffect(() => {
    document.documentElement.lang = locale;
    const updateHead = () => {
      if (document.title !== title) document.title = title;
      const description = document.querySelector('meta[name="description"]');
      if (description?.getAttribute('content') !== pageDescription) description?.setAttribute('content', pageDescription);
    };
    updateHead();
    // Next can stream route metadata after hydration. Keep the user's locale
    // and in-page auth state when that metadata arrives or navigation completes.
    const observer = new MutationObserver(updateHead);
    observer.observe(document.head, {childList:true, subtree:true, characterData:true});
    return () => observer.disconnect();
  }, [locale,title,pageDescription]);
  const setLocale = useCallback((next: Locale) => {
    fallbackLocale = next;
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the choice in memory. */ }
    listeners.forEach(listener => listener());
  }, []);
  const t = useCallback((message:string) => translate(message,locale),[locale]);
  return <LanguageContext.Provider value={{locale,ready,setLocale,t,setPageTitle}}>{children}</LanguageContext.Provider>;
}
export function useLanguage(){return useContext(LanguageContext);}
export function usePageTitle(title: PageTitle) {
  const {setPageTitle} = useLanguage();
  useEffect(() => { setPageTitle(title); return () => setPageTitle(null); }, [title,setPageTitle]);
}
export function LanguageSwitch(){
  const {locale,setLocale}=useLanguage();
  return <div className="language-switch" role="group" aria-label={locale === 'en' ? 'Language' : 'Bahasa'}><span className={`language-switch-active ${locale === 'id' ? 'is-id' : ''}`} aria-hidden="true"/>{(['en', 'id'] as const).map(language => <button key={language} type="button" aria-label={language === 'en' ? 'English' : 'Bahasa Indonesia'} aria-pressed={locale === language} onClick={() => setLocale(language)}>{language.toUpperCase()}</button>)}</div>;
}
