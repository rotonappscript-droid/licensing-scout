(function(){
const GROUPS=[
 {id:'sec',name:'SECURED',cls:'',sub:[['secured','']],score:'Scor Secured',cols:['title','artist','label','isrc','release','pos','weeks','trend','share','est','score']},
 {id:'ear',name:'EARLY',cls:'early',sub:[['early_rel','RELEVANTE'],['early_watch','DE URMĂRIT']],score:'Scor Early',cols:['title','artist','label','isrc','release','pos','weeks','trend','share','est','near','pe','score']}];
const COL={title:['Piesă',180],artist:['Artist',165],label:['Label',145],isrc:['ISRC',110],release:['Lansare',82],pos:['Poziție UPFR',62,1],weeks:['Săptămâni în Top 100',74,1],
 trend:['Trend',52],share:['Cotă de piață %',66,1],est:['Cotă estimată / săpt. %',78,1],near:['Apropiere de Top 100 %',78,1],pe:['Șansă de intrare %',70,1],score:['Scor',96,1]};
let D=null,tab='all',done=new Set();const S={sec:['score',-1],ear:['score',-1]};
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
 g.sub.forEach(([c,lab])=>{const L=D.songs.filter(s=>s.cat===c&&(tab==='all'||done.has(id(s)))).sort(cmp);total+=L.length;
  if(tab==='done'&&!L.length)return;
  if(lab)body+=`<tr class="cat"><td colspan="${n}">${lab}<span>${L.length}</span></td></tr>`;
  body+=L.map((s,i)=>{const d=done.has(id(s));return `<tr class="${d?'done':''}"><td class="n dim">${i+1}</td>${g.cols.map(k=>cell(s,k)).join('')}<td style="text-align:right"><button class="pb" data-id="${esc(id(s))}">${d?'Preluat':'Preia'}</button></td></tr>`;}).join('');});
 if(tab==='done'&&!total)return '';
 const head=`<tr><th class="n">#</th>${g.cols.map(k=>{const c=COL[k],lbl=k==='score'?g.score:c[0];return `<th class="${c[2]?'n':''}${k==='score'?' sc':''}" data-g="${g.id}" data-k="${k}">${lbl}${k===sk?(sd<0?' ↓':' ↑'):''}</th>`;}).join('')}<th></th></tr>`;
 const cg=`<colgroup><col style="width:32px">${g.cols.map(k=>`<col style="width:${COL[k][1]}px">`).join('')}<col style="width:82px"></colgroup>`;
 return `<div class="grp ${g.cls}"><h2>${g.name}<span>${total}</span></h2><div class="tw"><table>${cg}<thead>${head}</thead><tbody>${body}</tbody></table></div></div>`;}
function render(){
 if(!D){$('#groups').innerHTML='<p class="dim" style="padding:24px 0">0</p>';return;}
 let h=GROUPS.map(table).join('');if(tab==='done'&&!h)h='<p class="dim" style="padding:24px 0">0</p>';
 $('#groups').innerHTML=h;$('#nd').textContent=[...done].filter(x=>D.songs.some(s=>id(s)===x)).length;
 document.querySelectorAll('.pb').forEach(b=>b.onclick=async()=>{const k=b.dataset.id,was=done.has(k);was?done.delete(k):done.add(k);render();
   try{was?await DB.del('preluate','song_id',k):await DB.upsert('preluate',[{song_id:k}],'song_id');}catch(e){was?done.add(k):done.delete(k);render();status('Eroare la salvare');}});
 document.querySelectorAll('th[data-k]').forEach(t=>t.onclick=()=>{const g=t.dataset.g,k=t.dataset.k;const s=S[g];if(s[0]===k)s[1]=-s[1];else{s[0]=k;s[1]=['title','artist','label','isrc','pos'].includes(k)?1:-1;}render();});}
const status=t=>{$('#wk').textContent=t;};
const label=()=>status(D?`UPFR W${D.week} ${D.year}`:'');
async function load(){
 D=await DB.latest();if(D)D.songs.forEach(x=>x.score=SCORE.score(x,D));
 done=new Set(await DB.preluate());label();render();}
document.querySelectorAll('button.tb').forEach(b=>b.onclick=()=>{document.querySelectorAll('.tb').forEach(x=>x.classList.remove('on'));b.classList.add('on');tab=b.dataset.t;render();});
$('#fx').onclick=async e=>{const b=$('#fx');b.disabled=true;b.textContent='…';
 try{
   const local=FETCHER.supported()&&(e.shiftKey||!D||await FETCHER.hasFolder());
   if(local)await FETCHER.run(status,e.shiftKey);
   await load();
 }catch(err){status(err&&err.name==='AbortError'?'':String(err.message||err));setTimeout(label,6000);}
 b.disabled=false;b.textContent='Fetch';};
if(!DB.hasKey()){document.body.innerHTML='';return;}
load().catch(e=>status(String(e.message||e)));
})();
