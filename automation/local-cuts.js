// Existing shared local heuristics: no network or semantic-quality guarantee.
(function(root){
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const uid=()=>globalThis.crypto?.randomUUID?.()||('clip-'+Date.now()+'-'+Math.random().toString(16).slice(2));
const finite=n=>typeof n==='number'&&Number.isFinite(n);
function timeValue(value){
  const s=String(value).trim().replace(',','.');
  if(!/^\d+(?::\d{1,2}){0,2}(?:\.\d{1,3})?$/.test(s))return NaN;
  const parts=s.split(':').map(Number);
  if(parts.length>1&&parts.slice(1).some(n=>n>=60))return NaN;
  return parts.reduce((total,n)=>total*60+n,0);
}
function fmt(t,precise=false){
  if(!Number.isFinite(t))return '00:00';
  const ms=Math.max(0,Math.round(t*1000)),s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor(s/60)%60;
  return (h?String(h).padStart(2,'0')+':':'')+String(h?m:Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')+(precise?'.'+String(ms%1000).padStart(3,'0'):'');
}
const srtTime=t=>{const s=fmt(t,true);return (s.split(':').length===2?'00:':'')+s.replace('.',',')};
function cleanText(text){return String(text??'').replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,s=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '})[s]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').trim()}
function parseSubtitles(text,duration=Infinity){
  const normalized=String(text).replace(/^\uFEFF/,'').replace(/\r/g,'');
  const regex=/((?:\d{1,3}:)?\d{1,2}:\d{2}[.,]\d{1,3})\s*-->\s*((?:\d{1,3}:)?\d{1,2}:\d{2}[.,]\d{1,3})[^\n]*\n([^]*?)(?=\n\s*\n|$)/g;
  const cues=[];let match;
  while((match=regex.exec(normalized))){
    const start=timeValue(match[1]),end=timeValue(match[2]),body=cleanText(match[3]);
    if(finite(start)&&finite(end)&&end>start&&start<duration&&body)cues.push({start,end:Math.min(end,duration),text:body});
  }
  return cues.sort((a,b)=>a.start-b.start).slice(0,100000);
}
function cuesToSrt(cues,start,end){return cues.filter(c=>c.end>start&&c.start<end).map((c,i)=>`${i+1}\n${srtTime(Math.max(0,c.start-start))} --> ${srtTime(Math.min(end,c.end)-start)}\n${c.text}\n`).join('\n')}
const endsSentence=text=>/[.!?…]["'»”’\])}]*\s*$/.test(text);
function buildBoundaries(duration,cues,pauses,scenes){
  const b=[{t:0,kind:'edge',strength:4},{t:duration,kind:'edge',strength:4}];
  for(const p of pauses)b.push({t:p.t,kind:'pause',strength:p.strength||2});
  for(const s of scenes){const inSentence=cues.some(c=>c.start<s.t&&c.end>s.t&&!endsSentence(c.text));b.push({t:s.t,kind:'scene',strength:inSentence?.4:1.1})}
  cues.forEach((c,i)=>{
    const previous=cues[i-1],next=cues[i+1],gap=next?next.start-c.end:0;
    if(!previous||endsSentence(previous.text)||c.start-previous.end>.45)b.push({t:Math.max(0,c.start-.05),kind:'subtitle',strength:2.6});
    if(endsSentence(c.text)||gap>.45||!next)b.push({t:Math.min(duration,c.end+Math.max(0,Math.min(.07,gap/2))),kind:'subtitle',strength:3.2});
  });
  const merged=[];
  for(const point of b.filter(p=>finite(p.t)&&p.t>=0&&p.t<=duration).sort((a,b)=>a.t-b.t)){
    const prev=merged.at(-1);
    if(prev&&Math.abs(prev.t-point.t)<.1){if(point.strength>prev.strength)Object.assign(prev,point)}else merged.push({...point});
  }
  return merged;
}
function nearestBoundary(desired,min,max,boundaries,tolerance){
  let best=null,cost=Infinity;
  const lower=Math.max(min,desired-tolerance),upper=Math.min(max,desired+tolerance);let lo=0,hi=boundaries.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(boundaries[mid].t<lower-1e-6)lo=mid+1;else hi=mid}
  for(let i=lo;i<boundaries.length&&boundaries[i].t<=upper+1e-6;i++){
    const p=boundaries[i];
    if(p.t<min-1e-6||p.t>max+1e-6||Math.abs(p.t-desired)>tolerance)continue;
    const c=Math.abs(p.t-desired)/Math.max(1,tolerance)-Math.min(4,p.strength)*.13;
    if(c<cost){best=p;cost=c}
  }
  return best?{...best,natural:true}:{t:clamp(desired,min,max),kind:'approx',strength:0,natural:false};
}
function describeCut(start,end){
  if(!start.natural||!end.natural)return 'No hay un límite natural cercano en uno de los extremos. Escucha y ajusta ese corte.';
  const kinds=new Set([start.kind,end.kind]);
  if(kinds.has('subtitle'))return 'Límites próximos a finales de frase del archivo de subtítulos. Revisa el contexto al escucharlo.';
  if(kinds.has('pause'))return 'Inicio y final próximos a pausas detectadas o a los extremos del vídeo.';
  if(kinds.has('scene'))return 'Corte cercano a cambios de imagen. Comprueba que la narración también termine.';
  return 'Utiliza los extremos del vídeo original.';
}
function clipTitle(cues,start,end,index){
  const text=cues.filter(c=>c.start>=start-.1&&c.start<Math.min(end,start+12)).map(c=>c.text.replace(/\n/g,' ')).join(' ');
  return text?text.split(/\s+/).slice(0,11).join(' ').slice(0,100):`Fragmento ${String(index+1).padStart(2,'0')}`;
}
function partitionVideo(duration,count,maxDuration,flex,boundaries,cues=[]){
  const n=Math.max(1,Math.min(Math.floor(duration/.8)||1,Math.max(Math.round(count),Math.ceil(duration/maxDuration))));
  const result=[];let start=0,startPoint={t:0,kind:'edge',natural:true};
  for(let i=0;i<n;i++){
    const remaining=n-i-1,minLen=Math.min(.8,duration/n),desired=start+(duration-start)/(remaining+1);
    const lower=Math.max(start+minLen,duration-remaining*maxDuration),upper=Math.min(duration-remaining*minLen,start+maxDuration);
    const endPoint=remaining?nearestBoundary(desired,lower,upper,boundaries,Math.max(.3,flex)):{t:duration,kind:'edge',natural:true};
    result.push({id:uid(),start,end:endPoint.t,title:clipTitle(cues,start,endPoint.t,i),reason:describeCut(startPoint,endPoint),warning:!startPoint.natural||!endPoint.natural,source:'split',selected:false,overlay:'',score:null});
    start=endPoint.t;startPoint=endPoint;
  }
  return result;
}
function proposeLocal(duration,count,target,flex,hard,boundaries,cues=[],envelope=[]){
  const minLen=Math.min(duration,Math.max(4,target-flex)),maxLen=Math.min(duration,hard,target+flex);
  const startPoints=boundaries.filter(p=>p.t<duration-minLen+.01);
  for(let t=0;t<duration-minLen;t+=Math.max(3,target/3))if(!startPoints.some(p=>Math.abs(p.t-t)<1))startPoints.push({t,kind:'approx',strength:0});
  const candidates=[],sums=new Float64Array(envelope.length+1),squares=new Float64Array(envelope.length+1);
  for(let i=0;i<envelope.length;i++){sums[i+1]=sums[i]+envelope[i];squares[i+1]=squares[i]+envelope[i]**2}
  for(const p of startPoints){
    const start={...p,natural:p.kind!=='approx'},desired=Math.min(duration,start.t+target);
    const end=nearestBoundary(desired,start.t+minLen,Math.min(duration,start.t+maxLen),boundaries,flex+.5);
    if(end.t<=start.t+.25)continue;
    let lo=0,hi=cues.length;while(lo<hi){const mid=(lo+hi)>>1;if(cues[mid].start<start.t)lo=mid+1;else hi=mid}let content='';for(let j=lo;j<cues.length&&cues[j].start<end.t&&content.length<180;j++)content+=cues[j].text+' ';
    const hook=/[¿?]|\b(imagina|sabías|nadie|nunca|descubr|sorprend|pero|por qué|what if|imagine|nobody|never|until|suddenly|secret|because)\b/i.test(content.slice(0,180))?1:0;
    const left=clamp(Math.ceil(start.t/.05),0,envelope.length),right=clamp(Math.ceil(end.t/.05),left,envelope.length),length=right-left,mean=(sums[right]-sums[left])/(length||1);
    const variety=length?Math.min(1,Math.sqrt(Math.max(0,(squares[right]-squares[left])/length-mean**2))*15):0;
    const rating=(start.strength+end.strength)*1.25+hook+variety-Math.abs(end.t-start.t-target)/Math.max(10,target);
    candidates.push({start:start.t,end:end.t,reason:describeCut(start,end),warning:!start.natural||!end.natural,rating});
  }
  const picked=[];
  for(const c of candidates.sort((a,b)=>b.rating-a.rating)){
    if(picked.some(p=>Math.min(p.end,c.end)-Math.max(p.start,c.start)>.05))continue;
    picked.push(c);if(picked.length>=count)break;
  }
  if(!picked.length&&duration>0)picked.push({start:0,end:Math.min(duration,hard),reason:'No se encontraron límites útiles. Ajusta manualmente el fragmento.',warning:true});
  return picked.sort((a,b)=>a.start-b.start).map((c,i)=>({...c,id:uid(),title:clipTitle(cues,c.start,c.end,i),source:'local',selected:false,score:null,overlay:''}));
}

const api={clamp,uid,finite,timeValue,fmt,srtTime,cleanText,parseSubtitles,cuesToSrt,endsSentence,buildBoundaries,nearestBoundary,describeCut,clipTitle,partitionVideo,proposeLocal};
root.ClipLocalCuts=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
