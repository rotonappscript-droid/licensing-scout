/* Supabase prin REST. Cheia de acces vine din linkul secret (#...) și rămâne salvată în browser. */
(function(){
let s='';try{const h=location.hash.slice(1);if(h){localStorage.setItem('ls_key',h);}s=h||localStorage.getItem('ls_key')||'';}catch(e){s=location.hash.slice(1);}
const H=extra=>Object.assign({apikey:CONFIG.key,'x-scout-key':s,'Content-Type':'application/json'},extra||{});
const U=p=>CONFIG.url+'/rest/v1/'+p;
async function ok(r){if(!r.ok)throw new Error((await r.text())||r.status);return r;}
const q=v=>encodeURIComponent('"'+String(v).replace(/\\/g,'\\\\').replace(/"/g,'\\"')+'"');
window.DB={
  hasKey:()=>!!s,
  get:async p=>(await ok(await fetch(U(p),{headers:H()}))).json(),
  upsert:async(t,rows,conf)=>ok(await fetch(U(t+(conf?'?on_conflict='+conf:'')),{method:'POST',headers:H({Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(rows)})),
  del:async(t,col,val)=>ok(await fetch(U(`${t}?${col}=eq.${q(val)}`),{method:'DELETE',headers:H()})),
  latest:async()=>{const r=await DB.get('snapshots?select=year,week,data&order=year.desc,week.desc&limit=1');return r[0]?r[0].data:null;},
  preluate:async()=>(await DB.get('preluate?select=song_id')).map(r=>r.song_id),
  q
};
})();
