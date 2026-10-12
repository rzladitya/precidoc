'use client';
import {useLanguage} from '@/components/language';
import {Brand} from '@/components/brand';
export default function Loading(){const{locale}=useLanguage();return <main className="container public-main"><Brand/><p role="status">{locale==='en'?'Loading Precidoc…':'Memuat Precidoc…'}</p></main>;}
