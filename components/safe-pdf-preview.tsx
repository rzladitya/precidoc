'use client';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from './language';

// Render pixels only. Do not embed the source PDF, its scripts, forms, or links.
export function SafePdfPreview({ url, page }: { url: string; page: number }) {
  const {locale} = useLanguage();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    let destroy: (()=>Promise<void>) | undefined;
    const timeout = setTimeout(()=>{controller.abort();void destroy?.();if(active)setStatus('error');},30000);
    void (async()=>{
      setStatus('loading');
      const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc='/pdf.worker.min.mjs';
      const response=await fetch(url,{signal:controller.signal});
      const task=pdfjs.getDocument({data:new Uint8Array(await response.arrayBuffer()),enableXfa:false,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/'});
      destroy=()=>task.destroy();
      if(!active||controller.signal.aborted){await destroy();return;}
      const pdf=await task.promise;
      const source=await pdf.getPage(page);
      if(!active||controller.signal.aborted)return;
      const target=canvas.current;
      if(!target)return;
      const initial=source.getViewport({scale:1});
      const scale=Math.min(1000/initial.width,Math.sqrt(1600000/(initial.width*initial.height)));
      const viewport=source.getViewport({scale});
      target.width=Math.ceil(viewport.width);target.height=Math.ceil(viewport.height);
      await source.render({canvas:target,viewport}).promise;
      if(active&&!controller.signal.aborted)setStatus('ready');
    })().catch(()=>{if(active)setStatus('error');}).finally(()=>{clearTimeout(timeout);void destroy?.().catch(()=>{});});
    return()=>{active=false;clearTimeout(timeout);controller.abort();void destroy?.().catch(()=>{});};
  },[url,page,attempt]);
  return <div className="safe-pdf-preview"><canvas role="img" ref={canvas} aria-label={locale==='en'?`Rendered source page ${page}`:`Gambar halaman sumber ${page}`} hidden={status!=='ready'}/>{status==='loading'&&<p role="status">{locale==='en'?'Rendering source page…':'Menampilkan halaman sumber…'}</p>}{status==='error'&&<div role="alert"><p>{locale==='en'?'This page could not be rendered. Compare the extracted text with the original file on your device.':'Halaman belum bisa ditampilkan. Bandingkan teks ekstraksi dengan file asli di perangkatmu.'}</p><button className="button outline" onClick={()=>setAttempt(value=>value+1)}>{locale==='en'?'Retry preview':'Coba tampilkan lagi'}</button></div>}<small>{locale==='en'?'Image preview only. PDF scripts, forms, and links are not executed.':'Pratinjau gambar. Skrip, formulir, dan tautan PDF tidak dijalankan.'}</small></div>;
}
