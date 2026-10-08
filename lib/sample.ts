import { makeSample, type PreparedDocument } from './documents';
import type { Locale } from './i18n';

export function makeLocalizedSample(locale: Locale): PreparedDocument {
  const sample=makeSample();
  if(locale==='id')return sample;
  const sections=[
    {title:'Runbook — Database Recovery',text:'# Runbook — Database Recovery\n\nThis runbook guides the operations team through database recovery. Record every action in the incident record.'},
    {title:'Prerequisites',text:'## Prerequisites\n\n- Confirm the maintenance window with the service owner.\n- Verify the latest backup.\n- Check the operator’s access before recovery.'},
    {title:'Recovery procedure',text:'## Recovery procedure\n\n1. Check replication status before recovery.\n2. Verify replication lag and available disk space.\n3. Restore using the approved playbook.\n\n| Parameter | Limit |\n| --- | --- |\n| Replication lag | 30 seconds |\n| Free disk | 20% |\n\nRecord verification results and execution time in the incident record.'},
  ];
  const units=sample.units.map((unit,i)=>({...unit,title:sections[i].title,original:sections[i].text,text:sections[i].text}));
  return {...sample,id:'sample_runbook_en',hash:'sample-document-en',units,bytes:new TextEncoder().encode(units.map(u=>u.text).join('\n\n')).length};
}
