window.SCORE=(function(){
const W={secured:{est:50,share:20,trend:15,weeks:15},early:{pe:30,near:20,trend:20,est:15,fresh:15},watch:0.5};
const tr=t=>t==='urcă'?1:t==='coboară'?0:0.5;
const cap=x=>Math.max(0,Math.min(1,x));
function months(rel,gen){if(!rel)return null;const a=new Date(rel+'T00:00:00'),b=new Date(gen+'T00:00:00');return (b-a)/(30.44*864e5);}
function parts(s,D){
  if(s.cat==='secured')return {est:cap(s.value8/2),share:cap(s.share/3),trend:tr(s.trend),weeks:cap(1-s.weeks/52)};
  const inc=s.pos!=null,m=months(s.release,D.generated);
  return {pe:inc?1:cap((s.p_enter??s.p_used)/50),near:inc?1:cap(s.impact_ratio/100),trend:tr(s.trend),est:cap(s.value8/0.5),fresh:m==null?0.5:cap(1-m/12)};}
function score(s,D){const p=parts(s,D),w=s.cat==='secured'?W.secured:W.early;let t=0;for(const k in w)t+=w[k]*p[k];if(s.cat==='early_watch')t*=W.watch;return Math.round(t);}
return {W,parts,score,months};})();
