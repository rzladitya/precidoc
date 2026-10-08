/* eslint-disable @next/next/no-img-element -- Static decorative artwork served directly by Workers assets, without an image optimizer. */
import { Check, FileSearch, Upload } from 'lucide-react';
export function DocumentMascot({state='idle',className=''}:{state?:'idle'|'reading'|'review'|'ready';className?:string}) {
  const Icon=state==='ready'?Check:state==='idle'?Upload:FileSearch;
  return <span className={`document-mascot mascot-${state} ${className}`} aria-hidden="true"><img src="/precidoc-mascot.png" alt="" width={120} height={120} loading="lazy" decoding="async"/><span className="mascot-state"><Icon size={16}/></span></span>;
}
