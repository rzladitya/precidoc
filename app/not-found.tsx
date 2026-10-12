'use client';
import Link from 'next/link';
import {useLanguage,usePageTitle} from '@/components/language';
import {MarketingHeader,MarketingFooter} from '@/components/marketing-shell';
export default function NotFound(){usePageTitle('notfound');const{locale}=useLanguage(),en=locale==='en';return <div className="landing public-page"><MarketingHeader/><main className="container public-main"><h1>{en?'We could not find that page.':'Halaman tidak ditemukan.'}</h1><p>{en?'Continue with the sample workspace or find the current features on Product.':'Lanjutkan dengan workspace contoh atau lihat fitur yang tersedia pada halaman Produk.'}</p><div className="v2-page-actions"><Link className="button primary" href="/sample">{en?'Try the Sample':'Coba Contoh'}</Link><Link className="button outline" href="/product">{en?'Product':'Produk'}</Link></div></main><MarketingFooter/></div>;}
