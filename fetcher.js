/* Fetch: citește folderul „Roton UPFR Chart Analysis”, calculează săptămâna și o salvează în Supabase. */
(function(){
const IDB='licensing-scout';
function idb(){return new Promise((res,rej)=>{const r=indexedDB.open(IDB,1);r.onupgradeneeded=()=>{r.result.createObjectStore('files');r.result.createObjectStore('handles');};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function iget(st,k){const d=await idb();return new Promise(res=>{const t=d.transaction(st).objectStore(st).get(k);t.onsuccess=()=>res(t.result);t.onerror=()=>res(undefined);});}
async function iput(st,k,v){const d=await idb();return new Promise(res=>{const t=d.transaction(st,'readwrite');t.objectStore(st).put(v,k);t.oncomplete=()=>res();t.onerror=()=>res();});}
const tick=()=>new Promise(r=>setTimeout(r,0));
const dur=s=>{const p=String(s||'').split(':');return p.length===3?(+p[0])*3600+(+p[1])*60+(+p[2]):0;};
function sheet(wb,name){const ws=wb.Sheets[name];return ws?XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null}):[];}
function parseUpfr(buf,year,week){
  const wb=XLSX.read(buf,{type:'array',cellFormula:false,cellHTML:false,cellText:false,dense:true});
  const T=sheet(wb,'Top 100');let period=null;const rows=[];
  T.slice(0,105).forEach((r,i)=>{(r||[]).forEach(x=>{if(typeof x==='string'&&x.includes('Week')&&x.includes(' from '))period=x;});
    if(i>=5&&r&&Number.isInteger(r[0]))rows.push([r[0],String(r[5]).trim(),String(r[6]).trim(),String(r[7]).trim(),r[8],r[9]||0]);});
  const channels=[];sheet(wb,'Market Share Channels').slice(6).forEach(r=>{if(r&&r[0]&&typeof r[1]==='number')channels.push([String(r[0]).trim(),r[1],r[2]]);});
  return {year,week,period,rows,channels};}
function parseMatch(buf,file){
  const wb=XLSX.read(buf,{type:'array',cellFormula:false,cellHTML:false,cellText:false,dense:true});
  const R=sheet(wb,wb.SheetNames[0]),P=new Map();
  for(let i=4;i<R.length;i++){const r=R[i];if(!r||r[0]==null)continue;if(dur(r[2])<60||r[12]==='production')continue;
    const k=r[6]+'\u0001'+r[7];let p=P.get(k);if(!p){p=[r[6],r[7],r[8]||'',r[9]||'',r[11]||'',0,{}];P.set(k,p);}
    p[5]++;const c=String(r[3]).trim();p[6][c]=(p[6][c]||0)+1;}
  return {file,pairs:[...P.values()]};}
async function files(root){
  const up=[],mr=[];
  for await(const [n,h] of root.entries()){
    const m=/^UPFR CHARTS (\d{4})$/.exec(n);
    if(m&&h.kind==='directory')for await(const [fn,fh] of h.entries()){const w=/^w(\d+) .*\.xlsx$/i.exec(fn);if(w&&fh.kind==='file')up.push({fh,name:n+'/'+fn,year:+m[1],week:+w[1]});}
    if(n==='Data Vericast'&&h.kind==='directory')for await(const [fn,fh] of h.entries())if(/^MatchReport_from_.*\.xlsx$/i.test(fn)&&fh.kind==='file')mr.push({fh,name:fn});}
  up.sort((a,b)=>a.year-b.year||a.week-b.week);mr.sort((a,b)=>a.name<b.name?-1:1);return {up,mr};}
async function cached(entry,parse,status){
  const f=await entry.fh.getFile(),sig=f.size+':'+f.lastModified,c=await iget('files',entry.name);
  if(c&&c.sig===sig)return c.data;status();await tick();const data=parse(await f.arrayBuffer());await iput('files',entry.name,{sig,data});return data;}
function jsonp(url){return new Promise((res,rej)=>{const cb='dz'+Math.random().toString(36).slice(2),s=document.createElement('script');
  const t=setTimeout(()=>{done();rej('timeout');},8000);function done(){clearTimeout(t);delete window[cb];s.remove();}
  window[cb]=d=>{done();res(d);};s.onerror=()=>{done();rej('err');};s.src=url+(url.includes('?')?'&':'?')+'output=jsonp&callback='+cb;document.head.appendChild(s);});}
async function deezer(isrc){
  try{const t=await jsonp('https://api.deezer.com/track/isrc:'+encodeURIComponent(isrc));if(!t||t.error)return null;
    let rel=t.release_date&&t.release_date!=='0000-00-00'?t.release_date:null,label='';
    if(t.album&&t.album.id){try{const a=await jsonp('https://api.deezer.com/album/'+t.album.id);label=a.label||'';if(!rel&&a.release_date&&a.release_date!=='0000-00-00')rel=a.release_date;}catch(e){}}
    return rel?{release:rel,label,src:'Deezer'}:null;}catch(e){return null;}}
async function releases(isrcs,status){
  const out={};if(!isrcs.length)return out;
  const have=await DB.get('release_cache?select=lookup_key,release_date,label,source,checked_at&lookup_key=in.('+isrcs.map(DB.q).join(',')+')');
  const fresh=Date.now()-14*864e5,known=new Set();
  for(const r of have){if(r.release_date){out[r.lookup_key]={release:r.release_date,label:r.label||'',src:r.source||'Deezer'};known.add(r.lookup_key);}else if(Date.parse(r.checked_at)>fresh)known.add(r.lookup_key);}
  const todo=isrcs.filter(i=>!known.has(i)),save=[];
  for(let n=0;n<todo.length;n++){status(`Lansări ${n+1}/${todo.length}`);const r=await deezer(todo[n]);
    save.push({lookup_key:todo[n],release_date:r?r.release:null,label:r?r.label:null,source:r?'Deezer':'negăsit',checked_at:new Date().toISOString()});if(r)out[todo[n]]=r;}
  if(save.length)await DB.upsert('release_cache',save,'lookup_key');
  return out;}
async function getRoot(force){
  let h=force?null:await iget('handles','root');
  if(h){const p=await h.requestPermission({mode:'read'});if(p!=='granted')h=null;}
  if(!h){h=await window.showDirectoryPicker({id:'roton-upfr',mode:'read'});await iput('handles','root',h);}
  return h;}
window.FETCHER={
  supported:()=>'showDirectoryPicker' in window,
  hasFolder:async()=>!!(await iget('handles','root')),
  async run(status,force){
    const root=await getRoot(force),{up,mr}=await files(root);
    if(!up.length||!mr.length)throw new Error('Alege folderul Roton UPFR Chart Analysis');
    const U=[],M=[];
    for(let n=0;n<up.length;n++)U.push(await cached(up[n],b=>parseUpfr(b,up[n].year,up[n].week),()=>status(`UPFR ${n+1}/${up.length}`)));
    for(let n=0;n<mr.length;n++)M.push(await cached(mr[n],b=>parseMatch(b,mr[n].name),()=>status(`Vericast ${n+1}/${mr.length}`)));
    status('Calcul');await tick();
    const S=ENGINE.prepare(U,M);
    const lastUp=U[U.length-1],need=`W${lastUp.week} ${lastUp.year}`;
    if(!S.IS.includes(S.W))throw new Error('Lipsește MatchReport-ul pentru '+need);
    const R=await releases(ENGINE.lookups(S),status);
    const D=ENGINE.compute(S,R);
    status('Salvare');await DB.upsert('snapshots',[{year:D.year,week:D.week,period:D.period,generated_at:new Date().toISOString(),data:D}],'year,week');
    return D;}
};
})();
