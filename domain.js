/* Shared pure operations: no synthetic values enter official-data calculations. */
(function(root){
  const api = {
    scopes: {nonprivate:'城镇非私营单位就业人员',private:'城镇私营单位就业人员',full:'全口径（社保参考）'},
    find(records,city,year,scope){return records.find(r=>r.city===city&&r.year===Number(year)&&r.scope===scope)||null;},
    rank(records,year,scope,ascending=false){return records.filter(r=>r.city!=='全国'&&r.year===Number(year)&&r.scope===scope).slice().sort((a,b)=>(ascending?1:-1)*(a.annual-b.annual)||a.city.localeCompare(b.city,'zh'));},
    history(records,city,scope){return records.filter(r=>r.city===city&&r.scope===scope).slice().sort((a,b)=>a.year-b.year);},
    growth(records,city,year,scope){const now=this.find(records,city,year,scope),old=this.find(records,city,Number(year)-1,scope);return now&&old&&old.annual>0?{delta:now.annual-old.annual,percent:(now.annual/old.annual-1)*100,previous:old}:null;},
    policyBase(data,region,year,component){return data.bases.find(r=>r.region===region&&r.year===Number(year)&&r.components.includes(component))||null;},
    displayed(annual,unit){return unit==='month'?annual/12:annual;},
    payroll(g,s,f,t){const deduction=g*(s+f)/100+t;if(![g,s,f,t].every(Number.isFinite)||g<0||g>1e8||s<0||f<0||s>100||f>100||t<0||deduction>g)return null;return {net:g-deduction,social:g*s/100,fund:g*f/100,tax:t,deduction};}
  };
  if(typeof module==='object'&&module.exports)module.exports=api;else root.SalaryDomain=api;
})(typeof window==='object'?window:globalThis);
