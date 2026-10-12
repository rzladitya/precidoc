'use client';
import Link from 'next/link';
import {useLanguage,usePageTitle} from '@/components/language';
import {Brand} from '@/components/brand';
export default function ErrorPage({retry}:{retry:()=>void}){
  usePageTitle('error');
  const {locale}=useLanguage(),en=locale==='en';
  return <main className="container public-main"><Brand/><h1>{en?'This page could not load.':'Halaman belum bisa dimuat.'}</h1><p>{en?'Try loading it again. If you were preparing a document, a page retry may clear its local state; your original file is still on your device.':'Coba muat kembali. Jika sedang menyiapkan dokumen, mencoba ulang halaman dapat menghapus data lokalnya; file asli tetap ada pada perangkat.'}</p><div className="v2-page-actions"><button className="button primary" onClick={retry}>{en?'Retry page':'Coba muat lagi'}</button><Link className="button outline" href="/support">{en?'Get help':'Buka bantuan'}</Link><Link className="button outline" href="/sample">{en?'Try the Sample':'Coba Contoh'}</Link></div></main>;
}
