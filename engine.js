/* Licensing Scout · calculul săptămânal (identic cu analiza din 18.11.2026) */
(function(root){
const DAY=864e5, BASE=Date.UTC(2024,0,2);
const idxFromMs=ms=>Math.floor((ms-BASE)/(7*DAY))+1;
function isoTuesday(y,w){const j4=Date.UTC(y,0,4),dow=(new Date(j4).getUTCDay()+6)%7;return j4-dow*DAY+(w-1)*7*DAY+DAY;}
function wkOf(i){const ms=BASE+(i-1)*7*DAY,y=new Date(ms+2*DAY).getUTCFullYear(),j4=Date.UTC(y,0,4),dow=(new Date(j4).getUTCDay()+6)%7;return [y,Math.floor((ms-(j4-dow*DAY))/(7*DAY))+1];}
const wlab=i=>{const [y,w]=wkOf(i);return `W${w} ${y}`;};
function pyRound(x,nd=0){const m=Math.pow(10,nd),v=x*m,f=Math.floor(v),d=v-f;let r;if(Math.abs(d-0.5)<1e-9)r=(f%2===0)?f:f+1;else r=Math.round(v);return r/m;}
function norm(s){s=String(s??'None').normalize('NFKD').replace(/[^\x00-\x7F]/g,'').toLowerCase();s=s.replace(/\(.*?\)|\[.*?\]/g,'').replace(/[^a-z0-9 ]/g,' ');return s.split(/\s+/).filter(Boolean).join(' ');}
function fa(a){return norm((' '+String(a??'None').toLowerCase()+' ').split(/,|&| x | feat| ft\.? | and | with | vs /)[0]);}
const key=(t,a)=>norm(t)+'|'+fa(a);
const low=s=>(s||'').toLowerCase();
const MAJ=['universal','umg','sony','warner','columbia','rca','epic','atlantic','parlophone','island','polydor','republic','interscope','def jam','capitol','virgin','emi','elektra','ministry of sound','ultra music','ultra records','spinnin','big beat','positiva','arista','b1 recordings','rhino','asylum','astralwerks','geffen','motown','300 entertainment','roc nation','ffrr','the orchard','awal','ingrooves'];
const MAJI=['USUM','USUG','USUV','GBUM','DEUM','FRUM','NLUM','USWB','USAT','USEE','GBAHS','GBAHT','GBAYE','USRC','USSM','USQX','GBARL','GBBKS','USCA2','USIR1','USJI1','USIR2'];
const ROLAB=['global records','cat music','hahaha','ethos','atom','roton','green tree','vescan','andra records','who media','okapisound','thr music','hood famous','creator records','baladda','elixir','lidia buble','future sound','nostalgia','mattman','major music','nicole cherry','media pro','mediapro','famous production','electrecord','agurida','miralicious'];
const ismaj=(l,i)=>MAJ.some(m=>low(l).includes(m))||MAJI.includes(String(i||'').slice(0,4))||MAJI.includes(String(i||'').slice(0,5));
const isro=(l,i)=>ROLAB.some(m=>low(l).includes(m))||String(i||'').startsWith('RO');
const ours=l=>low(l).includes('roton')||low(l).includes('green tree');
/* date verificate manual în Songstats (18.11.2026); au prioritate față de căutarea automată */
const SEED=[['mi chico','dj goja','2026-03-27','gamma. / DJ Goja Music'],['movin to the sun','hugel','2026-05-22','Make The Girls Dance Records'],['let me be','the second voice','2026-01-25',"INT Vibez / Spinnin' Records"],['nuevayol','bad bunny','2025-01-05','Rimas Entertainment LLC'],['talk to you','anotr','2026-03-06','NO ART'],['the story','somn3um','2018-08-31',"Somn'thing Records"],['new religion','bebe rexha','2026-03-06','EMPIRE'],['turn the lights off','kato','2010-02-01','disco:wax (Sony)'],['fire fire','shimza','2025-06-13','Helix Records'],['sun in your eyes','alex parker','2026-05-24','MUZE x Eternal / Robbins Entertainment'],['she doesn t mind','riviera','2026-05-28','Riviera Music'],['i run','haven','2025-10-29','Isekai / Broke'],['give it up','palm monkey','2026-06-12','LoudKult Div.'],['happiness is so sad','swedish house mafia','2026-07-30','DANSA'],['collide','glockenbach','2026-09-25','WEFOR'],['never walk alone','blond ish','2024-08-02','Insomniac Records']];
const EXCLUDE=[['let me be','the second voice']];
function seedOf(k){const [t,a]=k.split('|');for(const s of SEED)if(t.startsWith(s[0])&&a.includes(s[1]))return {release:s[2],label:s[3],src:'Songstats'};return null;}
const excluded=k=>{const [t,a]=k.split('|');return EXCLUDE.some(e=>t.startsWith(e[0])&&a.includes(e[1]));};
const band=p=>p<=10?'1-10':p<=30?'11-30':p<=60?'31-60':'61-100';
const ab=a=>a<=4?'1-4':a<=12?'5-12':a<=25?'13-25':'26+';
const pb=x=>x<.5?'25-50%':x<1?'50-100%':'≥100%';
const mean=v=>v.reduce((s,x)=>s+x,0)/v.length;
const median=v=>{const s=[...v].sort((a,b)=>a-b),n=s.length;return n?(n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2):NaN;};

/* upfr: [{year,week,period,rows:[[pos,title,artist,label,plays,impact]],channels:[[name,plays,audience]]}]
   match: [{file,pairs:[[title,artist,label,isrc,catalog,plays,{channel:plays}]]}] (sortate după nume) */
function prepare(upfr,match){
  const rows=[],by=new Map(),tot=new Map(),thr=new Map(),period=new Map(),chanByI=new Map();
  for(const f of upfr){const i=idxFromMs(isoTuesday(f.year,f.week));period.set(i,f.period);chanByI.set(i,f.channels||[]);
    for(const r of f.rows){const o={i,pos:r[0],title:r[1],artist:r[2],label:r[3],plays:r[4],imp:r[5]||0,k:key(r[1],r[2])};rows.push(o);}}
  for(const r of rows){tot.set(r.i,(tot.get(r.i)||0)+r.imp);thr.set(r.i,Math.min(thr.get(r.i)??1e12,r.imp));}
  for(const r of rows){r.sh=r.imp/tot.get(r.i)*100;if(!by.has(r.k))by.set(r.k,new Map());by.get(r.k).set(r.i,r);}
  const W=Math.max(...rows.map(r=>r.i)),OBS=new Set(rows.map(r=>r.i));
  const ppc={};for(const c of chanByI.get(W)||[])ppc[String(c[0]).trim().toLowerCase()]=c[2]/c[1];
  const VH=new Map(),META=new Map(),IS=new Set();
  for(const f of match){const m=/from_(\d{4})-(\d\d)-(\d\d)/.exec(f.file);if(!m)continue;const ms=Date.UTC(+m[1],+m[2]-1,+m[3]);if(new Date(ms).getUTCDay()!==2)continue;
    const i=idxFromMs(ms);IS.add(i);
    for(const p of f.pairs){const k=key(p[0],p[1]);if(!VH.has(k))VH.set(k,new Map());const h=VH.get(k);if(!h.has(i))h.set(i,{plays:0,est:0,ch:new Set()});const x=h.get(i);
      x.plays+=p[5];for(const c in p[6]){const cl=String(c).trim().toLowerCase();x.est+=p[6][c]*(ppc[cl]||0);x.ch.add(cl);}
      if(!META.has(k))META.set(k,[p[0],p[1],p[2],p[3],p[4]]);}}
  return {rows,by,tot,thr,period,W,OBS,VH,META,IS:[...IS].sort((a,b)=>a-b)};
}
/* ISRC-urile pentru care merită căutată data de lansare */
function lookups(S){const out=new Set(),{by,VH,META,W,thr}=S,Y=wkOf(W)[0],YRS=[String(Y).slice(2),String(Y-1).slice(2)];
  for(const [k,h] of by)if(h.has(W)){const m=META.get(k),r=h.get(W);if(!m||!m[3]||seedOf(k)||ours(r.label)||excluded(k))continue;
    if(ismaj(r.label,m[3])||ismaj(m[2],'')||isro(r.label,m[3])||isro(m[2],''))continue;out.add(m[3]);}
  for(const [k,h] of VH){if((by.get(k)||new Map()).has(W)||!h.has(W))continue;const m=META.get(k);if(!m||!m[3]||seedOf(k)||excluded(k))continue;
    if(ismaj(m[2],m[3])||isro(m[2],m[3])||ours(m[2])||!YRS.includes(String(m[3]).slice(5,7)))continue;
    if(h.get(W).est/thr.get(W)>=.25&&h.get(W).ch.size>=2)out.add(m[3]);}
  return [...out];}
/* releases: {ISRC:{release,label,src}} */
function compute(S,releases,today){
  const {rows,by,tot,thr,period,W,OBS,VH,META,IS}=S;releases=releases||{};
  const [Y,WK]=wkOf(W),yy=n=>String(n).slice(2),YRS=[yy(Y),yy(Y-1)];
  const age=(k,i)=>{let n=0;for(const j of by.get(k).keys())if(j<=i)n++;return n;};
  const relOf=(k,isrc)=>seedOf(k)||(isrc&&releases[isrc])||null;
  const c2=new Map();
  for(const r of rows){const i=r.i;let ok=i+8<=W;for(let j=1;ok&&j<=8;j++)if(!OBS.has(i+j))ok=false;if(!ok)continue;
    const h=by.get(r.k);let s=0;for(let j=1;j<=8;j++){const x=h.get(i+j);if(x)s+=x.sh;}
    const c=band(r.pos)+'|'+ab(age(r.k,i));if(!c2.has(c))c2.set(c,[]);c2.get(c).push(s/r.sh);}
  const M2={};for(const [c,v] of c2)M2[c]=[pyRound(mean(v),2),v.length];
  const est=(h,i)=>h.has(i)?h.get(i).est:0;
  const up2=(h,i)=>est(h,i)>est(h,i-1)&&est(h,i-1)>est(h,i-2);
  const PE={};const first=IS[0],last=IS[IS.length-1];
  for(const [k,h] of VH){const isrc=META.get(k)[3]||'';if(!YRS.includes(String(isrc).slice(5,7)))continue;
    const fu=by.has(k)?Math.min(...by.get(k).keys()):Infinity;
    for(const i of IS){if(i+4>last||i-2<first||!h.has(i)||fu<=i||!thr.has(i))continue;const x=h.get(i).est/thr.get(i);if(x<.25)continue;
      const c=pb(x)+'|'+(up2(h,i)?'urcă 2 săpt':'altfel');PE[c]=PE[c]||[0,0];PE[c][1]++;if(fu-i<=4)PE[c][0]++;}}
  const traj=k=>{const h=by.get(k),o=[];for(let i=W-5;i<=W;i++)o.push({w:wkOf(i)[1],p:h.has(i)?h.get(i).pos:null});return o;};
  const peak=k=>{let b=null;for(const [i,r] of by.get(k))if(!b||r.pos<b.pos)b={...r,i};return {p:b.pos,w:wlab(b.i)};};
  const impAt=(k,i)=>{const h=by.get(k);if(h&&h.has(i))return [h.get(i).imp,'UPFR'];const v=VH.get(k);if(v&&v.has(i))return [v.get(i).est,'Vericast'];return [0,'-'];};
  const trendOf=k=>{const s=[W-2,W-1,W].map(i=>impAt(k,i)),[a,b,c]=s.map(x=>x[0]);return {trend:c>b&&b>a?'urcă':c<b&&b<a?'coboară':'stabilă',trend_series:s.map(x=>pyRound(x[0])),trend_src:s.map(x=>x[1])};};
  const songs=[],inW=new Set();
  for(const [k,h] of by){if(!h.has(W))continue;inW.add(k);const r=h.get(W),m=META.get(k)||['','','','',''],vl=m[2]||'',isrc=m[3]||'',lab=r.label,ri=relOf(k,isrc);
    if(ours(lab)||excluded(k))continue;
    if(ismaj(lab,isrc)||ismaj(vl,'')||(ri&&ismaj(ri.label,'')))continue;
    if(isro(lab,isrc)||isro(vl,''))continue;
    const a=age(k,W),share=pyRound(r.sh,2),c=band(r.pos)+'|'+ab(a),mu=M2[c],other=ri?ri.label:vl,v=VH.get(k);
    songs.push(Object.assign({id:r.title+'|'+r.artist,title:r.title,artist:r.artist,label:lab,label_other:low(other)!==low(lab)?other:'',isrc,
      release:ri?ri.release:null,release_src:ri?ri.src:(isrc?'ISRC 20'+isrc.slice(5,7):''),first_seen:'UPFR '+wlab(Math.min(...h.keys())),
      pos:r.pos,traj:traj(k),weeks:a,peak:peak(k),share,mult:mu[0],mult_n:mu[1],mult_cell:band(r.pos)+' · '+ab(a),value8:pyRound(share*mu[0]/8,2),
      impact:pyRound(r.imp),impact_ratio:pyRound(r.imp/thr.get(W)*100),channels:v&&v.has(W)?v.get(W).ch.size:0,cat:a<=2?'early_rel':'secured'},trendOf(k)));}
  for(const [k,h] of VH){if(inW.has(k)||!h.has(W))continue;const m=META.get(k),t=m[0],a=m[1],l=m[2]||'',isrc=m[3]||'';
    if(ismaj(l,isrc)||isro(l,isrc)||ours(l)||excluded(k))continue;
    const x=h.get(W).est/thr.get(W);if(x<.25||h.get(W).ch.size<2)continue;
    const ri=relOf(k,isrc),yr=isrc.slice(5,7),rel=ri?ri.release:null;
    if(ri&&ismaj(ri.label,''))continue;
    const isNew=(rel&&rel>=(Y-1)+'-01-01')||(!rel&&YRS.includes(yr));
    if(!(isrc||rel)||!isNew)continue;const ch=by.has(k);if(ch&&by.get(k).size>4)continue;
    const u=up2(h,W),pc=pb(x)+'|'+(u?'urcă 2 săpt':'altfel'),pe=PE[pc]||[0,0];
    const pEnter=ch?null:(pe[1]?pyRound(100*pe[0]/pe[1]):null);
    songs.push(Object.assign({id:t+'|'+a,title:t,artist:a,label:l,label_other:ri&&low(ri.label)!==low(l)?ri.label:'',isrc,release:rel,release_src:ri?ri.src:'ISRC 20'+yr,
      first_seen:ch?'UPFR '+wlab(Math.min(...by.get(k).keys())):'Vericast '+wlab(Math.min(...h.keys())),pos:null,traj:ch?traj(k):[],weeks:ch?age(k,W):0,peak:ch?peak(k):null,
      share:null,value8:0,impact:pyRound(h.get(W).est),impact_ratio:pyRound(x*100),impact_trend:[W-3,W-2,W-1,W].map(i=>pyRound(est(h,i))),
      channels:h.get(W).ch.size,channels_trend:[W-3,W-2,W-1,W].map(i=>h.has(i)?h.get(i).ch.size:0),up2:u,p_enter:pEnter,p_k:pe[0],p_n:pe[1],
      p_used:pEnter??(pe[1]?pyRound(100*pe[0]/pe[1]):0),p_cell:pc.replace('|',' · '),reentry:ch,cat:(!ch&&x>=.5&&u)?'early_rel':'early_watch'},trendOf(k)));}
  const cal=[];for(const [k,h] of by){if(!h.has(W))continue;const v=VH.get(k);if(v&&v.has(W)&&v.get(W).plays===h.get(W).plays)cal.push(v.get(W).est/h.get(W).imp);}
  const per=/from\s+(\d\d)-(\d\d)-(\d{4})\s+to\s+(\d\d)-(\d\d)-(\d{4})/.exec(period.get(W)||'');
  return {week:WK,year:Y,period:per?`${per[1]}.${per[2]}.${per[3]} – ${per[4]}.${per[5]}.${per[6]}`:'',generated:today||new Date().toISOString().slice(0,10),
    threshold100:pyRound(thr.get(W)),total_impact:pyRound(tot.get(W)),share100:pyRound(thr.get(W)/tot.get(W)*100,3),mult:M2,penter:PE,
    calib:`${median(cal).toFixed(2).replace('.',',')} (${cal.length} piese, W${WK})`,songs};
}
root.ENGINE={prepare,lookups,compute,key,norm,fa,wkOf};
})(typeof window!=='undefined'?window:globalThis);
