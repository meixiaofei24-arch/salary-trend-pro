'use strict';
const $=s=>document.querySelector(s), D=SalaryDomain, official=SALARY_OFFICIAL, demo=SALARY_DEMO;
const directory=SALARY_DIRECTORY,benefits=SALARY_BENEFITS;
const cityNames=directory.cities.map(c=>c.name);
const provinceOf=n=>directory.cities.find(c=>c.name===n)?.province;
const pct=n=>(n>0?'+':'')+n.toFixed(2)+'%';
const growthText=r=>{const g=D.growth(official.records,r.city,r.year,r.scope);return g?'同比 '+pct(g.percent)+' · '+(g.delta>0?'+':'')+money(g.delta)+' /年':'同比暂缺连续年度同口径数据';};
const years=[...new Set(official.records.map(r=>r.year))].sort((a,b)=>b-a);
const state={mode:'official',year:2025,scope:'nonprivate',unit:'annual',page:'home',type:'city',name:'深圳',a:'深圳',b:'广州',job:0,period:6,policyCity:'北京',policyYear:2026};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'¥'+Number(n).toLocaleString('zh-CN',{maximumFractionDigits:2});
const real=()=>state.mode==='official';
const value=r=>D.displayed(r.annual,state.unit), unitText=()=>state.unit==='month'?'折合月均（年薪÷12）':'年平均工资';
const metric=()=>real()?D.scopes[state.scope]:'模拟岗位月薪';
const empty=t=>`<p class="empty">${t}</p>`;
function sourceHTML(r){const s=official.sources[r.source];return `<p class="hint">${r.year} 年 · ${esc(D.scopes[r.scope])} · 税前平均数<br>来源：${esc(s.publisher)} · ${s.published?'发布 '+s.published:'本站未收录发布日期'}<br><a target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">查看官方原文：${esc(s.title)}</a><br>本站核验：${s.verifiedOn} · 样本量：本站未结构化收录，详见原文</p>`;}
function current(city){return D.find(official.records,city,state.year,state.scope);}
function demoCity(name){return demo.cities.find(c=>c.name===name);}
function synthetic(base,n){return Array.from({length:n},(_,i)=>({label:'第'+(i+1)+'月',v:Math.round(base*(1+.035*Math.sin(i*.68)-.0009*(n-i)))}));}
function plot(selector,points,label,bounds,yearExtent){
 const el=$(selector);if(!points.length){el.innerHTML=empty('暂无已核验的同口径历史数据；不生成模拟曲线。');return;}
 const vals=points.map(p=>p.v),lo=bounds?bounds[0]:Math.min(...vals)*.94,hi=bounds?bounds[1]:Math.max(...vals)*1.06;
 const y=v=>155-(v-lo)/Math.max(1,hi-lo)*125,x=i=>45+(yearExtent?(points[i].year-yearExtent[0])*535/Math.max(1,yearExtent[1]-yearExtent[0]):points.length===1?260:i*535/(points.length-1));
 const segments=[];let group=[];points.forEach((p,i)=>{if(i&&p.year&&p.year!==points[i-1].year+1){segments.push(group);group=[];}group.push(`${x(i)},${y(p.v)}`);});segments.push(group);
 el.innerHTML=`<p class="hint">${esc(label)} · ${real()?unitText():'模拟月薪'} · 单位：元${points.length===1?' · 仅1个已核验年份，不表示趋势':''}</p><svg viewBox="0 0 610 185" role="img" aria-label="${esc(label)}，详细数值见下表"><path d="M45 15V155H590" fill="none" stroke="#777"/><text x="0" y="25" fill="#bbb" font-size="10">${Math.round(hi)}</text><text x="0" y="155" fill="#bbb" font-size="10">${Math.round(lo)}</text>${segments.filter(g=>g.length>1).map(g=>`<polyline points="${g.join(' ')}" fill="none" stroke="#e8d18d" stroke-width="3"/>`).join('')}${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.v)}" r="3" fill="#e8d18d"><title>${esc(p.label)}：${money(p.v)}</title></circle>`).join('')}<text x="45" y="177" fill="#bbb" font-size="11">${esc(yearExtent?yearExtent[0]+'年':points[0].label)}</text><text x="530" y="177" fill="#bbb" font-size="11">${esc(yearExtent?yearExtent[1]+'年':points.at(-1).label)}</text></svg><details class="charttable"><summary>查看${real()?'官方':'模拟'}数据表</summary><table><thead><tr><th>时期</th><th>数值（元）</th><th>同比变化</th><th>来源</th></tr></thead><tbody>${points.map(p=>`<tr><td>${esc(p.label)}</td><td>${money(p.v)}</td><td>${esc(p.growth||'模拟')}</td><td>${p.source?`<a href="${esc(official.sources[p.source].url)}" target="_blank" rel="noopener noreferrer">官方原文</a>`:'模拟'}</td></tr>`).join('')}</tbody></table></details>`;
}
function historyPoints(city){return D.history(official.records,city,state.scope).filter(r=>r.year<=state.year).map(r=>({label:r.year+'年',year:r.year,v:value(r),source:r.source,growth:growthText(r)}));}
function row(name,type,amount,index=null,note=''){
 return `<div class="row">${index===null?'':`<span class="rank">${index+1}</span>`}<div class="rowmain"><strong>${esc(name)}</strong><small>${esc(note|| (real()?`${state.year} · ${metric()}`:'模拟数据 · 非真实市场统计'))}</small></div><div class="rowright"><strong>${amount===null?'暂未收录':money(amount)}</strong><small>${amount===null?'未用模拟值补齐':real()?unitText():'模拟月薪'}</small></div><button class="smallbtn" data-open="${type}" data-name="${esc(name)}" aria-label="查看${esc(name)}">查看</button></div>`;
}
function ranked(){return real()?D.rank(official.records,state.year,state.scope,$('#rankSort').value==='asc').sort((a,b)=>$('#rankSort').value==='growth'?(D.growth(official.records,b.city,b.year,b.scope)?.percent??-Infinity)-(D.growth(official.records,a.city,a.year,a.scope)?.percent??-Infinity):0):demo.cities.slice().sort((a,b)=>($('#rankSort').value==='asc'?1:-1)*(a.v-b.v));}
function renderRanks(){
 const rows=ranked(),q=$('#cityFilter').value.trim(),filtered=rows.filter(r=>(r.city||r.name).includes(q)&&(!real()||!$('#provinceFilter').value||provinceOf(r.city)===$('#provinceFilter').value));
 const html=filtered.map(r=>row(r.city||r.name,'city',real()?value(r):r.v,rows.indexOf(r),real()?growthText(r):'')).join('');
 $('#cityList').innerHTML=html||empty('当前筛选没有已收录数据，可调整年份或口径。');
 $('#rankCount').textContent=($('#rankSort').value==='growth'&&real()?'按同比增长排序，缺少连续年度数据的城市排在末尾；名次仍为当前排序内序号。 ':'')+`${state.year} 年 · ${metric()} · ${rows.length} 个已收录城市，匹配 ${filtered.length} 个。名次仅限这些城市。`;
 $('#homeRanks').innerHTML=rows.slice(0,6).map((r,i)=>row(r.city||r.name,'city',real()?value(r):r.v,i)).join('')||empty('当前年份与口径暂无已收录城市。');
 $('#rankSummary').textContent=real()?`${state.year} 年 · ${metric()} · ${rows.length} 个已核验城市。缺失城市不参与排序。`:'43 个模拟城市，仅用于交互演示。';
 $('#directoryCoverage').textContent=`全国目录 ${cityNames.length} 个地级行政区及直辖市 · 累计收录工资 ${new Set(official.records.filter(r=>r.city!=='全国').map(r=>r.city)).size} 个 · 工资记录 ${official.records.length} 条（含全国汇总）。目录含自治州、地区和盟，不含县级市及港澳台。`;
 $('#missingCities').innerHTML=real()?cityNames.filter(n=>!current(n)&&n.includes(q)&&(!$('#provinceFilter').value||provinceOf(n)===$('#provinceFilter').value)).map(n=>row(n,'city',null)).join('')||empty('当前筛选无缺失城市。'):empty('演示模式不包含真实城市统计。');
}
function renderHome(){
 const covered=new Set(official.records.filter(r=>r.city!=='全国').map(r=>r.city)).size;
 $('#stats').innerHTML=real()?`<div class="stat"><div class="label">已核验城市（含不同口径）</div><div class="number">${covered}</div><small>非全国完整覆盖</small></div><div class="stat"><div class="label">当前可比城市</div><div class="number">${ranked().length}</div><small>${state.year} · ${metric()}</small></div><div class="stat"><div class="label">最新已收录统计年度</div><div class="number">2025</div><small>发布年度不等于统计年度</small></div><div class="stat"><div class="label">本站核验日期</div><div class="number" style="font-size:20px">${official.verifiedOn}</div><small>静态快照，非实时接口</small></div>`:`<div class="stat"><div class="label">模拟城市</div><div class="number">${demo.cities.length}</div></div><div class="stat"><div class="label">模拟岗位</div><div class="number">${demo.jobs.length}</div></div>`;
 $('#periodTabs').hidden=real();$('#trendTitle').textContent=real()?'全国已发布年度工资趋势':'模拟月薪趋势';
 plot('#homeChart',real()?historyPoints('全国'):synthetic(10000,state.period),real()?'全国 · '+metric():'模拟趋势');
 $('#homeJobs').innerHTML=real()?`<p class="hint">官方城市平均工资不能代表招聘专员、工程师等细分岗位。当前尚未接入真实招聘岗位数据。</p><button class="cta" data-page="jobs">搜索岗位与查看数据状态</button>`:demo.jobs.slice(0,5).map((j,i)=>row(j.name,'job',j.v,i)).join('');
}
function renderJob(){
 const j=demo.jobs[+$('#jobSelect').value],c=$('#citySelect').value;if(!j)return;
 if(real()){$('#jobDetail').innerHTML=`<h2>${esc(c)} · ${esc(j.name)}</h2><p class="notice">暂无已核验的真实岗位薪资。</p><p class="hint">城市平均工资是宏观统计，不能通过乘系数推算该城市的细分岗位薪资。可在城市页查看官方统计，或切换模拟演示模式体验岗位区间与走势图。</p><button class="cta" data-open="job" data-name="${esc(j.name)}">查看数据状态／收藏岗位</button>`;$('#jobChart').innerHTML='';return;}
 const v=Math.round(j.v*demoCity(c).v/10000);$('#jobDetail').innerHTML=`<h2>${esc(c)} · ${esc(j.name)}</h2><p class="notice">模拟数据 · 按演示公式生成</p><div class="number">${money(v)}</div><p>模拟月薪区间：${money(v*.8)} – ${money(v*1.2)}</p><button class="cta" data-open="job" data-name="${esc(j.name)}">查看岗位详情</button>`;plot('#jobChart',synthetic(v,12),'模拟岗位月薪');
}
function renderSearch(){
 const q=$('#globalSearch').value.trim().toLowerCase(),box=$('#searchResults');box.hidden=!q;if(!q)return;
 const cities=cityNames.filter(n=>n.toLowerCase().includes(q)),jobs=demo.jobs.filter(j=>j.name.toLowerCase().includes(q));
 box.innerHTML=`<h2>搜索结果 · ${cities.length+jobs.length} 项</h2><p class="hint">${real()?'有官方来源才显示数值；岗位暂无真实数据。':'全部为模拟数据。'}</p><div class="card">${cities.map(n=>row(n,'city',real()?(current(n)?value(current(n)):null):demoCity(n)?.v??null)).join('')}${jobs.map(j=>row(j.name,'job',real()?null:j.v)).join('')||(!cities.length?empty('未找到匹配城市或岗位。'):'')}</div>`;
}
let previous='home';
function openDetail(type,name){if(state.page!=='detail')previous=state.page;state.type=type;state.name=name;$('#globalSearch').value='';navigate('detail');}
function renderDetail(){
 $('#detailTitle').textContent=state.name+' · '+(real()?'官方数据':'模拟数据');
 const r=state.type==='city'?current(state.name):null;
 if(real()){$('#detailBody').innerHTML=r?`<div class="label">${unitText()} · 官方税前平均数</div><div class="number">${money(value(r))}</div>${state.unit==='month'?`<p class="hint">原始年平均工资 ${money(r.annual)} ÷ 12；折合值不是实际月发工资。</p>`:''}<p class="notice">${growthText(r)}</p>${sourceHTML(r)}<button class="smallbtn" data-policy="${esc(state.name)}">查看本城五险一金</button><p class="hint">${esc(official.notes[state.scope])}<br>${esc(official.notes.general)}</p>`:empty(state.type==='job'?'暂无已核验真实岗位薪资；不会用城市系数推算。':'当前年份、口径暂未收录；不代表官方未发布。');
 if(state.type==='city')plot('#detailChart',historyPoints(state.name),state.name+' · '+metric());else $('#detailChart').innerHTML='';
 }else{const o=(state.type==='city'?demo.cities:demo.jobs).find(x=>x.name===state.name);$('#detailBody').innerHTML=o?`<p class="notice">模拟数据 · 非真实市场统计</p><div class="number">${money(o.v)}</div><p class="hint">模拟月薪指标，手工基础值。</p>`:empty('未找到模拟项目');if(o)plot('#detailChart',synthetic(o.v,12),'模拟数据');else $('#detailChart').innerHTML='';}
 if(real()&&state.type==='city'&&!r)$('#detailBody').innerHTML+=`<button class="smallbtn" data-policy="${esc(state.name)}">查看本城五险一金</button>`;
 $('#favBtn').textContent=getFavs().some(f=>favKey(f)===favKey(detailFavorite()))?'★ 已收藏':'☆ 收藏';
}
function renderCompare(){
 const a=$('#compareA').value,b=$('#compareB').value;state.a=a;state.b=b;
 $('#compareJobLabel').hidden=real();$('#compareNotice').textContent=real()?`比较 ${state.year} 年 · ${metric()}，共用纵轴；只显示已核验年份，不补齐缺失点。`:'模拟岗位薪资对比 · 非真实市场差异';
 let av,bv,ap,bp;
 if(real()){const ar=current(a),br=current(b);if(!ar||!br){$('#compareResult').innerHTML=empty('所选城市在当前年份或口径没有同时收录的数据，无法比较。请调整城市、年份或口径。');$('#compareChart').innerHTML='';return;}av=value(ar);bv=value(br);ap=historyPoints(a);bp=historyPoints(b);$('#compareResult').innerHTML=`<h2>${esc(a)} 与 ${esc(b)}</h2><p>${esc(a)}：${money(av)}；${esc(b)}：${money(bv)}</p><p>差额：${money(av-bv)}（${((av/bv-1)*100).toFixed(2)}%）</p>${sourceHTML(ar)}${sourceHTML(br)}`;
 }else{state.job=+$('#compareJob').value;const j=demo.jobs[state.job];av=Math.round(j.v*demoCity(a).v/10000);bv=Math.round(j.v*demoCity(b).v/10000);ap=synthetic(av,12);bp=synthetic(bv,12);$('#compareResult').innerHTML=`<h2>${esc(j.name)} · 模拟月薪</h2><p>${esc(a)}：${money(av)}；${esc(b)}：${money(bv)}</p><p>模拟差额：${money(av-bv)}（${((av/bv-1)*100).toFixed(2)}%）</p>`;}
 const all=[...ap,...bp].map(p=>p.v),bounds=[Math.min(...all)*.94,Math.max(...all)*1.06];$('#compareChart').innerHTML='<div id="lineA"></div><div id="lineB"></div>';const time=real()?[Math.min(...[...ap,...bp].map(p=>p.year)),Math.max(...[...ap,...bp].map(p=>p.year))]:null;plot('#lineA',ap,a+' · '+metric(),bounds,time);plot('#lineB',bp,b+' · '+metric(),bounds,time);
}
let memory=[];
function readStorage(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return null}}
function getFavs(){const list=readStorage('salary-favs-v3')??memory;return Array.isArray(list)?list.filter(f=>f&&['official','demo'].includes(f.mode)&&['city','job'].includes(f.type)&&typeof f.name==='string'&&(f.type==='city'?cityNames:demo.jobs.map(j=>j.name)).includes(f.name)&&years.includes(f.year)&&Object.hasOwn(D.scopes,f.scope)):[];}
function saveFavs(a){memory=a;try{localStorage.setItem('salary-favs-v3',JSON.stringify(a))}catch{toast('浏览器存储不可用，收藏仅在本次访问有效')}}
function migrate(){if(readStorage('salary-favs-v3')!==null&&localHasV3())return;const old=readStorage('salary-favs');if(!Array.isArray(old))return;saveFavs(old.filter(k=>typeof k==='string').map(k=>{const [type,name]=k.split(':');return {mode:'demo',type,name,year:2025,scope:'nonprivate',unit:'month'}}).filter(f=>(f.type==='city'?cityNames:demo.jobs.map(j=>j.name)).includes(f.name)));}
function localHasV3(){try{return localStorage.getItem('salary-favs-v3')!==null}catch{return false}}
function detailFavorite(){return {mode:state.mode,type:state.type,name:state.name,year:state.year,scope:state.scope,unit:state.unit};}
function favKey(f){return [f.mode,f.type,f.name,f.year,f.scope].join(':');}
function toggleFavorite(){const f=detailFavorite(),a=getFavs();saveFavs(a.some(x=>favKey(x)===favKey(f))?a.filter(x=>favKey(x)!==favKey(f)):[...a,f]);renderDetail();}
function renderFavorites(){const a=getFavs();$('#favorites').innerHTML=a.map((f,i)=>`<div class="row"><div class="rowmain"><strong>${esc(f.name)}</strong><small>${f.mode==='official'?'官方数据 · '+f.year+' · '+esc(D.scopes[f.scope]):'模拟数据 · 原演示收藏'}</small></div><button class="smallbtn" data-favorite="${i}">查看</button><button class="smallbtn" data-remove="${i}">删除</button></div>`).join('')||empty('还没有收藏内容。');}
function calculate(e){if(e)e.preventDefault();const r=D.payroll(...['gross','social','fund','tax'].map(id=>+$('#'+id).value));$('#calcResult').innerHTML=r?`<p class="label">自定义参数估算 · 月到手</p><div class="number">${money(r.net)}</div><p>个人社保：${money(r.social)}<br>个人公积金：${money(r.fund)}<br>自填税额：${money(r.tax)}<br>合计扣除：${money(r.deduction)}</p><p class="hint">公式：税前月薪 − 社保 − 公积金 − 自填税额。未考虑缴费基数上下限、累计预扣税及专项附加扣除，以工资单为准。</p>`:empty('请输入有效数值，扣除总额不能超过税前月薪。');}
function toast(t){const el=document.createElement('div');el.className='toast';el.role='status';el.textContent=t;document.body.append(el);setTimeout(()=>el.remove(),3500);}
function showShareLink(){let box=$('#shareFallback');if(box)box.remove();box=document.createElement('div');box.id='shareFallback';box.className='notice';const label=document.createElement('label');label.textContent='复制分享链接（包含当前模式、年份与口径）';const input=document.createElement('input');input.className='field';input.readOnly=true;input.value=location.href;input.setAttribute('aria-label','复制分享链接');label.append(input);box.append(label);const close=document.createElement('button');close.textContent='关闭';close.className='smallbtn';close.onclick=()=>box.remove();box.append(close);$('.page.active').prepend(box);input.focus();input.select();}
async function share(){showShareLink();const data={title:'薪资趋势Pro V2.2',text:real()?'官方平均工资，查看来源和统计口径。':'模拟演示数据，非真实薪资。',url:location.href};try{if(navigator.share){await navigator.share(data);return}}catch(e){if(e.name==='AbortError')return}try{await navigator.clipboard.writeText(data.url);toast('分享链接已复制')}catch{toast('请复制页面内的分享链接')}}
function options(list){return list.map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');}
function syncControls(){
 $('#mode').value=state.mode;$('#year').value=String(state.year);$('#scope').value=state.scope;$('#unit').value=state.unit;
 for(const id of ['year','scope','unit'])$('#'+id).disabled=!real();
 const names=real()?cityNames:demo.cities.map(c=>c.name);for(const id of ['citySelect','compareA','compareB']){const old=$('#'+id).value;$('#'+id).innerHTML=options(names);$('#'+id).value=names.includes(old)?old:names[0];}
 $('#compareA').value=names.includes(state.a)?state.a:names[0];$('#compareB').value=names.includes(state.b)?state.b:names[1];$('#compareJob').value=String(state.job);
}
function render(){
 syncControls();document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===state.page));document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===state.page));
 $('#dataNotice').textContent=real()?`官方公开统计快照 · 核验 ${official.verifiedOn}。${state.year} 年 · ${metric()}。${state.scope==='full'?official.notes.full:'税前平均数，不是中位数、招聘报价或到手工资。'}${state.unit==='month'?'折合月均=年平均工资÷12，非实际月发工资。':''}`:'模拟演示模式：所有薪资、区间、排行和曲线均为虚构样本，不代表真实市场。';
 renderHome();renderRanks();renderJob();if(state.page==='benefits')renderBenefits();renderSearch();renderFavorites();if(state.page==='detail')renderDetail();if(state.page==='compare')renderCompare();
 $('#methodology').textContent=Object.values(official.notes).join(' ')+' '+official.updateMethod+'；缺失数据不插值，不自动回退到模拟值。';
 $('#sources').innerHTML=Object.values(official.sources).map(s=>`<div class="row"><div class="rowmain"><strong>${esc(s.publisher)}</strong><small>${s.published||'本站未收录发布日期'} · 核验 ${s.verifiedOn}</small><a target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.title)}</a></div></div>`).join('');
}
function routeURL(){const path=state.page==='detail'?`detail/${state.type}/${encodeURIComponent(state.name)}`:state.page;const params=new URLSearchParams({mode:state.mode,year:state.year,scope:state.scope,unit:state.unit});if(state.page==='cities'){params.set('province',$('#provinceFilter').value);params.set('sort',$('#rankSort').value);params.set('q',$('#cityFilter').value)}if(state.page==='benefits'){params.set('city',state.policyCity);params.set('policyYear',state.policyYear)}if(state.page==='compare'){params.set('a',state.a);params.set('b',state.b);params.set('job',state.job)}return '#'+path+'?'+params;}
function writeRoute(replace=false){history[replace?'replaceState':'pushState'](null,'',routeURL());}
function navigate(name){state.page=name;writeRoute();render();window.scrollTo(0,0);}
function readRoute(){
 const [path,query='']=location.hash.slice(1).split('?'),p=new URLSearchParams(query);let parts;try{parts=path.split('/').map(decodeURIComponent)}catch{parts=['home']}
 state.mode=p.get('mode')==='demo'?'demo':'official';state.year=years.includes(+p.get('year'))?+p.get('year'):2025;state.scope=Object.hasOwn(D.scopes,p.get('scope'))?p.get('scope'):'nonprivate';state.unit=p.get('unit')==='month'?'month':'annual';
 state.page=['home','cities','jobs','mine','compare','calculator','detail','benefits'].includes(parts[0])?parts[0]:'home';
 if(state.page==='cities'){$('#provinceFilter').value=[...new Set(directory.cities.map(c=>c.province))].includes(p.get('province'))?p.get('province'):'';$('#rankSort').value=['desc','asc','growth'].includes(p.get('sort'))?p.get('sort'):'desc';$('#cityFilter').value=p.get('q')||'';}
 if(state.page==='benefits'){state.policyCity=cityNames.includes(p.get('city'))?p.get('city'):'北京';state.policyYear=p.get('policyYear')==='2025'?2025:2026;}
 if(state.page==='detail'){state.type=parts[1]==='job'?'job':'city';const names=state.type==='city'?cityNames:demo.jobs.map(j=>j.name);if(names.includes(parts[2]))state.name=parts[2];else state.page='home';}
 if(state.page==='compare'){for(const key of ['a','b'])if(cityNames.includes(p.get(key)))state[key]=p.get(key);state.job=/^\d+$/.test(p.get('job'))&&+p.get('job')<demo.jobs.length?+p.get('job'):0;
 // V2.0 numeric comparison links refer only to the old simulated city order.
 if(parts.length===4&&parts.slice(1).every(v=>/^\d+$/.test(v))){const names=demo.cities.map(c=>c.name);if(names[+parts[1]]&&names[+parts[2]]&&demo.jobs[+parts[3]]){state.mode='demo';state.a=names[+parts[1]];state.b=names[+parts[2]];state.job=+parts[3];}}}
 render();writeRoute(true);
}
$('#year').innerHTML=years.map(y=>`<option>${y}</option>`).join('');$('#jobSelect').innerHTML=demo.jobs.map((j,i)=>`<option value="${i}">${esc(j.name)}</option>`).join('');$('#compareJob').innerHTML=$('#jobSelect').innerHTML;
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.policy){state.policyCity=b.dataset.policy;navigate('benefits');}if(b.dataset.page)navigate(b.dataset.page);if(b.dataset.open)openDetail(b.dataset.open,b.dataset.name);if(b.dataset.period){state.period=+b.dataset.period;renderHome();}if(b.dataset.remove!==undefined){const a=getFavs();a.splice(+b.dataset.remove,1);saveFavs(a);renderFavorites();}if(b.dataset.favorite!==undefined){const f=getFavs()[+b.dataset.favorite];if(f){Object.assign(state,f);navigate('detail');}}});
for(const key of ['mode','year','scope','unit'])$('#'+key).onchange=()=>{state[key]=key==='year'?+$('#'+key).value:$('#'+key).value;if(key==='mode')state.unit=real()?'annual':'month';writeRoute(true);render();};
$('#cityFilter').oninput=()=>{renderRanks();writeRoute(true);};$('#rankSort').onchange=()=>{renderRanks();writeRoute(true);};$('#globalSearch').oninput=renderSearch;$('#jobSelect').onchange=renderJob;$('#citySelect').onchange=renderJob;
for(const id of ['compareA','compareB','compareJob'])$('#'+id).onchange=()=>{renderCompare();writeRoute(true);};
$('#favBtn').onclick=toggleFavorite;$('#backBtn').onclick=()=>navigate(previous);for(const id of ['shareBtn','detailShareBtn','compareShare','benefitShare'])$('#'+id).onclick=share;$('#calcForm').onsubmit=calculate;

const components={pension:'养老保险',medical:'医疗保险（可能含生育）',unemployment:'失业保险',injury:'工伤保险',maternity:'生育保险',fund:'住房公积金'};
function policyLink(id){const s=benefits.sources[id];return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`;}
function rateText(v){return v===null||v===undefined?'待核验':Array.isArray(v)?v.join('—')+'%':v+'%';}
function renderBenefits(){
 $('#benefitCity').value=state.policyCity;$('#policyYear').value=state.policyYear;
 const region=provinceOf(state.policyCity),year=state.policyYear,local=benefits.bases.filter(r=>(r.region===region||r.region===state.policyCity)&&r.year===year);
 const getBase=(y,k)=>D.policyBase(benefits,state.policyCity,y,k)||D.policyBase(benefits,region,y,k);
 const covered=new Set(benefits.bases.filter(r=>r.level==='province'&&r.year===year).map(r=>r.region));
 const cities=directory.cities.filter(c=>covered.has(c.province)).length;
 $('#benefitCoverage').textContent=`${state.policyCity} · ${region} · ${year}年度政策快照。全国${covered.size}/31个省级地区、${cities}/${cityNames.length}个目录地区至少收录一项基数；不表示六项齐全。当前城市${local.length?'部分已核验':'本地基数待核验'}，核验日期 ${benefits.verifiedOn}。`;
 $('#benefitBody').innerHTML=Object.entries(components).map(([key,label])=>{
 const base=getBase(year,key),rates=benefits.rates.filter(r=>r.component===key&&((r.region===region||r.region===state.policyCity)&&r.year===year||r.region==='全国'));
 return `<article class="card policycard"><h2>${label}</h2>${base?`<p>个人月缴费基数：<strong>${money(base.min)} — ${money(base.max)}</strong></p><p class="hint">${esc(base.period)} · ${esc(base.region)}${base.level==='city'?'市级规则':'省级统一规则'}<br>${policyLink(base.source)}</p>`:empty('本地缴费基数暂未核验，不套用其他险种上下限。')}${rates.length?rates.map(r=>`<p>个人：<strong>${rateText(r.employee)}${r.employeeFixed?' + '+r.employeeFixed+'元/月':''}</strong> · 单位：<strong>${rateText(r.employer)}</strong></p><p class="hint">${esc(r.period)}<br>${esc(r.note)}<br>${policyLink(r.source)}</p>`).join(''):empty('个人及单位费率暂未核验，不表示为0。')}</article>`;
 }).join('');
 $('#benefitHistory').innerHTML=Object.entries(components).map(([key,label])=>{
 const now=getBase(year,key),old=getBase(year-1,key);if(!now)return '';
 return `<div class="policycard"><h3>${label}</h3>${old?`<p>${year-1} → ${year}：下限 ${money(old.min)} → ${money(now.min)}（${pct((now.min/old.min-1)*100)}）；上限 ${money(old.max)} → ${money(now.max)}（${pct((now.max/old.max-1)*100)}）</p><p class="hint">上一版本：${esc(old.period)} · ${policyLink(old.source)}<br>本版：${esc(now.period)} · ${policyLink(now.source)}<br>比较各年度已公布版本，不代表全年按同一版本缴费；费率变化暂未形成完整历史序列。</p>`:empty('缺少上一年度同险种基数，暂不计算增长率。')}</div>`;
 }).join('')||empty('该城市暂无已核验的基数历史。');
}
$('#provinceFilter').innerHTML='<option value="">全国省份</option>'+options([...new Set(directory.cities.map(c=>c.province))]);
$('#provinceFilter').onchange=()=>{renderRanks();writeRoute(true);};
$('#latestData').onclick=()=>{state.mode='official';state.year=2025;state.scope='nonprivate';state.unit='annual';writeRoute(true);render();};
$('#benefitCity').innerHTML=options(cityNames);
for(const id of ['benefitCity','policyYear'])$('#'+id).onchange=()=>{state.policyCity=$('#benefitCity').value;state.policyYear=+$('#policyYear').value;renderBenefits();writeRoute(true);};

window.addEventListener('popstate',readRoute);window.addEventListener('hashchange',readRoute);migrate();calculate();readRoute();
