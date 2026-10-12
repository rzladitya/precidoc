export const usageEvents=['sample_started','registration_completed','first_document_processed','processing_succeeded','processing_failed'] as const;
export const durationBuckets=['none','under_1s','1_to_5s','5_to_15s','15_to_30s','over_30s'] as const;
export type UsageEvent=typeof usageEvents[number];
const preferenceKey='precidoc-usage-consent';
const listeners=new Set<()=>void>();
export function privacySignal(){return typeof navigator!=='undefined'&&((navigator as Navigator&{globalPrivacyControl?:boolean}).globalPrivacyControl===true||navigator.doNotTrack==='1');}
export function usageEnabled(){try{return !privacySignal()&&localStorage.getItem(preferenceKey)==='yes';}catch{return false;}}
export function setUsageEnabled(enabled:boolean){try{localStorage.setItem(preferenceKey,enabled&&!privacySignal()?'yes':'no');}catch{/* Consent defaults to off if storage is unavailable. */}listeners.forEach(listener=>listener());}
export function subscribeUsage(listener:()=>void){listeners.add(listener);window.addEventListener('storage',listener);return()=>{listeners.delete(listener);window.removeEventListener('storage',listener);};}
export function trackUsage(event:UsageEvent,elapsed?:number){
  if(!usageEnabled())return;
  const duration=elapsed===undefined?'none':elapsed<1000?'under_1s':elapsed<5000?'1_to_5s':elapsed<15000?'5_to_15s':elapsed<=30000?'15_to_30s':'over_30s';
  // Best effort only; failure never blocks parsing, signup, or exports.
  void fetch('/api/usage',{method:'POST',credentials:'omit',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({event,duration,consent:true}),signal:AbortSignal.timeout(5000)}).catch(()=>{});
}
