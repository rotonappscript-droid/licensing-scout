(function(){
const GROUPS=[
 {id:'sec',name:'SECURED',cls:'',sub:[['secured','']],score:'Scor Secured',cols:['title','artist','label','isrc','release','pos','weeks','trend','share','est','score']},
 {id:'ear',name:'EARLY',cls:'early',sub:[['early_rel','RELEVANTE'],['early_watch','DE URMĂRIT']],score:'Scor Early',cols:['title','artist','label','isrc','release','pos','weeks','trend','share','est','near','pe','score']}];
const COL={title:['Piesă',148],artist:['Artist',130],label:['Label',120],isrc:['ISRC',100],release:['Lansare',82],pos:['Poziție UPFR',56,1],weeks:['Săptămâni în Top 100',64,1],
 trend:['Trend',44],share:['Cotă de piață %',60,1],est:['Cotă estimată / săpt. %',70,1],near:['Apropiere de Top 100 %',72,1],pe:['Șansă de intrare %',64,1],score:['Scor',84,1]};
let D=null,tab='all',done=new Set(),fail=new Map();const NO='nu|',SEP=' ‖ ';const S={sec:['score',-1],ear:['score',-1]};
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clean=t=>String(t).replace(/\s*\((official|ft|feat)[^)]*\)/gi,'').trim();
const yr=i=>i&&i.length>6?'20'+i.slice(5,7):'';
const dim=t=>`<span class="dim">${t}</span>`;
const num=(x,d)=>x==null?dim('–'):Number(x).toLocaleString('ro-RO',{minimumFractionDigits:d,maximumFractionDigits:d});
const TR={'urcă':'↑','coboară':'↓','stabilă':'→'};
const id=s=>s.id||(s.title+'|'+s.artist);
function val(s,k){
 if(k==='near')return s.pos==null?s.impact_ratio:null;
 if(k==='pe')return s.pos==null?(s.p_enter??s.p_used):null;
 if(k==='release')return s.release||(yr(s.isrc)?yr(s.isrc)+'-00-00':null);
 if(k==='trend')return {'urcă':2,'stabilă':1,'coboară':0}[s.trend];
 if(k==='est')return s.value8; if(k==='weeks')return s.weeks||0;
 if(k==='share')return s.pos!=null?s.share:null; return s[k]??null;}
function cell(s,k){const v=val(s,k);
 switch(k){case'title':return `<td class="t" title="${esc(s.title)}">${esc(clean(s.title))}</td>`;
  case'artist':return `<td title="${esc(s.artist)}">${esc(s.artist)}</td>`;
  case'label':return `<td title="${esc(s.label||s.label_other)}">${esc(s.label||s.label_other||'–')}</td>`;
  case'isrc':return `<td class="mono">${esc(s.isrc||'–')}</td>`;
  case'release':return `<td>${s.release?s.release.split('-').reverse().join('.'):dim(yr(s.isrc)||'–')}</td>`;
  case'trend':return `<td>${TR[s.trend]||'–'}</td>`;
  case'share':case'est':return `<td class="n">${num(v,2)}</td>`;
  case'near':case'pe':return `<td class="n">${num(v,0)}</td>`;
  case'score':return `<td class="n"><span class="bar" style="width:${Math.max(2,Math.round(40*v/100))}px"></span>${v}</td>`;
  default:return `<td class="n">${v??dim('–')}</td>`;}}
function table(g){const [sk,sd]=S[g.id];
 const cmp=(a,b)=>{const x=val(a,sk),y=val(b,sk);if(x==null&&y==null)return 0;if(x==null)return 1;if(y==null)return -1;return(typeof x==='string'?x.localeCompare(y):x-y)*sd;};
 const n=g.cols.length+2;let body='',total=0;
 g.sub.forEach(([c,lab])=>{const L=D.songs.filter(s=>s.cat===c&&(tab==='all'||done.has(id(s))||fail.has(id(s)))).sort(cmp);total+=L.length;
  if(tab==='done'&&!L.length)return;
  if(lab)body+=`<tr class="cat"><td colspan="${n}">${lab}<span>${L.length}</span></td></tr>`;
  body+=L.map((s,i)=>{const k=id(s),d=done.has(k),f=fail.get(k),e=esc(k);
   const ctl=f?`<button class="pb nf" data-act="edit" data-id="${e}">Nu a funcționat</button>`
     :`<button class="pb" data-act="take" data-id="${e}">${d?'Preluat':'Preia'}</button><button class="nb" data-act="fail" data-id="${e}">Nu a funcționat</button>`;
   return `<tr class="${f?'fail':d?'done':''}"><td class="n dim">${i+1}</td>${g.cols.map(c=>cell(s,c)).join('')}<td class="act">${ctl}</td></tr>`
     +(f?`<tr class="fail why"><td></td><td colspan="${n-1}"><span>Motiv</span>${esc(f.reason)}</td></tr>`:'');}).join('');});
 if(tab==='done'&&!total)return '';
 const head=`<tr><th class="n">#</th>${g.cols.map(k=>{const c=COL[k],lbl=k==='score'?g.score:c[0];return `<th class="${c[2]?'n':''}${k==='score'?' sc':''}" data-g="${g.id}" data-k="${k}">${lbl}${k===sk?(sd<0?' ↓':' ↑'):''}</th>`;}).join('')}<th></th></tr>`;
 const cg=`<colgroup><col style="width:32px">${g.cols.map(k=>`<col style="width:${COL[k][1]}px">`).join('')}<col style="width:184px"></colgroup>`;
 return `<div class="grp ${g.cls}"><h2>${g.name}<span>${total}</span></h2><div class="tw"><table>${cg}<thead>${head}</thead><tbody>${body}</tbody></table></div></div>`;}
function render(){
 if(!D){$('#groups').innerHTML='<p class="dim" style="padding:24px 0">0</p>';return;}
 let h=GROUPS.map(table).join('');if(tab==='done'&&!h)h='<p class="dim" style="padding:24px 0">0</p>';
 $('#groups').innerHTML=h;$('#nd').textContent=D.songs.filter(s=>done.has(id(s))||fail.has(id(s))).length;
 document.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const k=b.dataset.id,act=b.dataset.act;
  if(act==='take'){const was=done.has(k);was?done.delete(k):done.add(k);render();
    save(()=>was?DB.del('preluate','song_id',k):DB.upsert('preluate',[{song_id:k}],'song_id'),()=>{was?done.add(k):done.delete(k);});}
  else openMod(k);});
 document.querySelectorAll('th[data-k]').forEach(t=>t.onclick=()=>{const g=t.dataset.g,k=t.dataset.k;const s=S[g];if(s[0]===k)s[1]=-s[1];else{s[0]=k;s[1]=['title','artist','label','isrc','pos'].includes(k)?1:-1;}render();});}
const save=async(fn,undo)=>{try{await fn();}catch(e){undo();render();status('Eroare la salvare');setTimeout(label,4000);}};
/* Nu a funcționat: motiv obligatoriu */
let modK=null;
function openMod(k){modK=k;const s=D.songs.find(x=>id(x)===k),f=fail.get(k);
 $('#modSong').textContent=s?`${clean(s.title)} · ${s.artist}`:k;$('#modTxt').value=f?f.reason:'';$('#modErr').textContent='';
 $('#modDel').hidden=!f;$('#mod').hidden=false;setTimeout(()=>$('#modTxt').focus(),0);}
const closeMod=()=>{$('#mod').hidden=true;modK=null;};
$('#modNo').onclick=closeMod;
$('#mod').onclick=e=>{if(e.target.id==='mod')closeMod();};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#mod').hidden)closeMod();});
$('#modTxt').oninput=()=>{$('#modErr').textContent='';};
$('#modOk').onclick=()=>{const k=modK,r=$('#modTxt').value.replace(/\s+/g,' ').trim();
 if(!r){$('#modErr').textContent='Scrie motivul.';$('#modTxt').focus();return;}
 const old=fail.get(k),raw=NO+k+SEP+r;fail.set(k,{reason:r,raw});closeMod();render();
 save(async()=>{if(old&&old.raw!==raw)await DB.del('preluate','song_id',old.raw);await DB.upsert('preluate',[{song_id:raw}],'song_id');},()=>{old?fail.set(k,old):fail.delete(k);});};
$('#modDel').onclick=()=>{const k=modK,old=fail.get(k);fail.delete(k);closeMod();render();
 save(()=>DB.del('preluate','song_id',old.raw),()=>{fail.set(k,old);});};
const status=t=>{$('#wk').textContent=t;if(!$('#busy').hidden)$('#busyP').textContent=t;};
function busyOn(auto){$('#busyT').textContent=auto?'Auto-fetch în curs. Așteaptă să se termine, datele din pagină se actualizează la final.':'Fetch în curs. Așteaptă să se termine, datele din pagină se actualizează la final.';$('#busyP').textContent='';$('#busy').hidden=false;$('#groups').classList.add('stale');}
function busyOff(){$('#busy').hidden=true;$('#groups').classList.remove('stale');}
const label=()=>status(D?`UPFR W${D.week} ${D.year}`:'');
async function load(){
 D=await DB.latest();if(D)D.songs.forEach(x=>x.score=SCORE.score(x,D));
 const ids=await DB.preluate();done=new Set(ids.filter(x=>!x.startsWith(NO)));fail=new Map();
 ids.filter(x=>x.startsWith(NO)).forEach(raw=>{const r=raw.slice(NO.length),p=r.indexOf(SEP);fail.set(p<0?r:r.slice(0,p),{reason:p<0?'':r.slice(p+SEP.length),raw});});
 label();render();}
document.querySelectorAll('button.tb').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tb').forEach(x=>x.classList.remove('on'));b.classList.add('on');tab=b.dataset.t;render();});
/* Auto-fetch: ziua și ora se aleg din pagină; rulează dacă pagina e deschisă atunci sau la prima deschidere de după. */
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v;}catch(e){return d;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const ad=$('#ad'),at=$('#at');let busy=false;
ad.value=LS.get('ls_auto_day','3');at.value=LS.get('ls_auto_time','16:00');
ad.onchange=()=>{LS.set('ls_auto_day',ad.value);};at.onchange=()=>{LS.set('ls_auto_time',at.value||'16:00');};
function lastSlot(){const d=+ad.value;if(d<0)return 0;const [h,m]=(at.value||'16:00').split(':').map(Number),n=new Date(),s=new Date(n);
 s.setHours(h,m||0,0,0);s.setDate(s.getDate()-((s.getDay()-d+7)%7));if(s>n)s.setDate(s.getDate()-7);return s.getTime();}
async function doFetch(force,auto){if(busy)return;busy=true;const b=$('#fx');b.disabled=true;b.textContent='…';busyOn(auto);
 try{
   const local=FETCHER.supported()&&(auto||force||!D||await FETCHER.hasFolder());
   if(local){await FETCHER.run(status,force,auto);LS.set('ls_last_fetch',String(Date.now()));}
   busyOff();await load();
 }catch(err){busyOff();status(err&&err.name==='AbortError'?'':String(err.message||err));setTimeout(label,6000);}
 b.disabled=false;b.textContent='Fetch';busy=false;}
window.addEventListener('beforeunload',e=>{if(busy){e.preventDefault();e.returnValue='';}});
async function autoCheck(){const s=lastSlot();if(!s||+LS.get('ls_last_fetch','0')>=s||!FETCHER.supported())return;
 if(await FETCHER.canAuto())doFetch(false,true);}
$('#fx').onclick=e=>doFetch(e.shiftKey,false);
setInterval(autoCheck,60000);
if(!DB.hasKey()){document.body.innerHTML='';return;}
load().then(autoCheck).catch(e=>status(String(e.message||e)));
if(!FETCHER.supported())$('#auto').style.display='none';
})();
