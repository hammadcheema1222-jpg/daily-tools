'use strict';
/* Pure operations helpers; shared by the interface and regression checks. */
(function(root){
  const n=v=>{const x=Number(String(v??'').replace(/[£,\s]/g,''));return Number.isFinite(x)?x:0;};
  const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const date=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d);};
  const add=(k,d)=>{const x=date(k);x.setDate(x.getDate()+d);return key(x);};
  const monday=k=>add(k,-((date(k).getDay()+6)%7));
  const money=v=>Math.round((v+Number.EPSILON)*100)/100;
  function businessDate(now=new Date(),cutoff='04:00'){
    if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoff))cutoff='04:00';
    const [h,m]=cutoff.split(':').map(Number);return add(key(now),now.getHours()*60+now.getMinutes()<h*60+m?-1:0);
  }
  function validAmount(v,{required=false,integer=false}={}){
    const s=String(v??'').trim().replace(/^£\s*/, '').replace(/,/g,'');
    if(!s)return required?'Enter an amount.':'';
    if(!(integer?/^\d+$/:/^\d+(\.\d{1,2})?$/).test(s))return integer?'Use a whole number, zero or more.':'Use a number of zero or more, with up to 2 decimal places.';
    if(!Number.isFinite(Number(s))||Number(s)>100000000)return 'Check this amount; it is too large.';return '';
  }
  function shiftMinutes(s){
    if(!/^\d{2}:\d{2}$/.test(s.start||'')||!/^\d{2}:\d{2}$/.test(s.end||''))return 0;
    const mins=t=>{const [h,m]=t.split(':').map(Number);return h*60+m;};
    let d=mins(s.end)-mins(s.start);if(d<0)d+=1440;
    return Math.max(0,d-n(s.brk));
  }
  function shiftError(s){
    if(!s.start||!s.end)return 'Enter both start and finish times.';
    if(s.start===s.end)return 'Start and finish are identical. Check the shift times.';
    if(validAmount(s.brk,{integer:true}))return 'Break must be a whole number of minutes, zero or more.';
    const raw=shiftMinutes({...s,brk:0});if(n(s.brk)>raw)return 'Break cannot be longer than the shift.';return '';
  }
  const hasSales=r=>!!r&&String(r.front??'').trim()!==''&&String(r.delivery??'').trim()!=='';
  function weekSummary(start,data){
    const end=add(start,6),sales=data.sales||{},days=Array.from({length:7},(_,i)=>add(start,i));
    const sums={sales:0,front:0,delivery:0,cashDifference:0,cashCountedDays:0,recordedDays:0,completedDays:0,food:0,deliveries:0,waste:0,hours:0,wages:0,unpricedShifts:0,legacyRates:0};
    for(const k of days){const r=sales[k];if(!hasSales(r))continue;sums.recordedDays++;if(r.closingStatus==='completed')sums.completedDays++;sums.front+=n(r.front);sums.delivery+=n(r.delivery);
      if(String(r.cash??'').trim()!==''){const ded=['jeat','uber','delivero','deliveryDrop','pout','dojo','teya'].reduce((a,f)=>a+n(r[f]),0);sums.cashDifference+=n(r.cash)-n(r.float)-(n(r.front)+n(r.delivery)-ded);sums.cashCountedDays++;}}
    sums.sales=sums.front+sums.delivery;sums.food=(data.food?.[start]||[]).reduce((a,v)=>a+n(v),0);sums.foodRecordedDays=(data.food?.[start]||[]).filter(v=>String(v??'').trim()!=='').length;
    for(const r of data.ledger||[])if(r.date>=start&&r.date<=end)sums[r.type==='waste'?'waste':'deliveries']+=n(r.qty)*n(r.price);
    for(const s of data.shifts||[])if(s.date>=start&&s.date<=end){const hours=shiftMinutes(s)/60;sums.hours+=hours;const person=(data.staff||[]).find(p=>p.id===s.staffId);const rate=s.rate??person?.rate;if(rate==null||String(rate).trim()==='')sums.unpricedShifts++;else{sums.wages+=hours*n(rate);if(s.rate==null)sums.legacyRates++;}}
    for(const k of ['sales','front','delivery','cashDifference','food','deliveries','waste','wages'])sums[k]=money(sums[k]);return {start,end,days,...sums};
  }
  function salesTrend(start,sales,asOf){
    const end=add(start,6);const last=asOf<start?null:asOf>end?end:asOf;
    if(!last)return {ready:false,message:'This trading week has not started.'};
    const days=[];for(let k=start;k<=last;k=add(k,1))days.push(k);
    let current=0,previous=0,matched=0;
    for(const k of days){const a=sales[k],b=sales[add(k,-7)];if(hasSales(a))current+=n(a.front)+n(a.delivery);if(hasSales(b))previous+=n(b.front)+n(b.delivery);if(hasSales(a)&&hasSales(b)&&a.closingStatus==='completed'&&b.closingStatus==='completed')matched++;}
    const ready=matched===days.length;return {ready,current:money(current),previous:money(previous),matched,expected:days.length,pct:ready&&previous>0?money((current-previous)/previous*100):null,message:ready?'Same weekdays; completed days only.':`Incomplete: ${matched} of ${days.length} weekday pairs are completed. Percentage hidden.`};
  }
  function weekdayTrend(selected,sales){
    const past=[];for(let i=1;i<=4;i++){const k=add(selected,-7*i),r=sales[k];if(hasSales(r)&&r.closingStatus==='completed')past.push(n(r.front)+n(r.delivery));}
    const r=sales[selected],value=hasSales(r)?n(r.front)+n(r.delivery):null,average=past.length?past.reduce((a,b)=>a+b,0)/past.length:null;
    return {samples:past.length,average:average==null?null:money(average),value,pct:average>0&&r?.closingStatus==='completed'?money((value-average)/average*100):null};
  }
  function normaliseOrders(history,catalog){
    return (history||[]).map((o,index)=>({...o,id:o.id||`legacy-${o.date}-${index}`,items:Array.isArray(o.items)?o.items:(o.lines||[]).map(([id,qty])=>{const item=catalog.find(x=>x.id===id);return {id,name:item?.name||`Archived item (${id})`,qty:n(qty),unit:item?.unit||'',supplier:item?.supplier||''};})}));
  }
  function orderComparison(start,orders,asOf){
    if(asOf&&asOf<start)return [];
    const a={},b={},end=asOf&&asOf<add(start,6)?asOf:add(start,6),prev=add(start,-7),previousEnd=add(end,-7);
    for(const order of orders){let target;if(order.date>=start&&order.date<=end)target=a;else if(order.date>=prev&&order.date<=previousEnd)target=b;else continue;for(const item of order.items||[]){const unit=item.unit||'',k=JSON.stringify([item.id,unit]);target[k]??={id:item.id,name:item.name,unit,qty:0};target[k].qty+=n(item.qty);}}
    return [...new Set([...Object.keys(a),...Object.keys(b)])].map(k=>{const x=a[k]||b[k],current=money(a[k]?.qty||0),previous=money(b[k]?.qty||0);return {...x,current,previous,pct:previous>0?money((current-previous)/previous*100):null,flag:current>previous?(previous?'Ordered more':'New this week'):current<previous?'Ordered less':'Same quantity'};}).sort((x,y)=>(y.current-y.previous)-(x.current-x.previous));
  }
  function dueReminders(day,reminders,orders,dismissed={}){
    const weekday=date(day).getDay();return reminders.filter(r=>r.active!==false).map(r=>{const need=add(day,(Number(r.needDay)-weekday+7)%7),due=add(need,-Math.min(6,Math.max(0,Number(r.leadDays)||0)));return {...r,need,due};}).filter(r=>day>=r.due&&day<=r.need&&!dismissed[r.id+'@'+r.need]&&!orders.some(o=>o.date>=r.due&&o.date<=r.need&&(o.items||[]).some(i=>i.id===r.itemId&&n(i.qty)>0)));
  }
  const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function partnerHTML(summary){
    const lines=[['Sales',summary.sales],['Food purchases (weekly docket)',summary.food],['Itemised deliveries (separate log)',summary.deliveries],['Recorded wages',summary.wages],['Waste value',summary.waste],['Cash difference',summary.cashDifference]];
    return `<table><thead><tr><th>Weekly measure</th><th class="r">Amount</th></tr></thead><tbody>${lines.map(([label,value])=>`<tr><td>${esc(label)}</td><td class="r">£${Number(value).toFixed(2)}</td></tr>`).join('')}</tbody></table><p>${summary.recordedDays}/7 sales days recorded; ${summary.completedDays}/7 completed; cash counted on ${summary.cashCountedDays} days. Food docket entries: ${summary.foodRecordedDays}/7 days. Hours: ${(Math.round(summary.hours*100)/100)}. Shifts without a rate: ${summary.unpricedShifts}. Legacy shifts using the current staff rate: ${summary.legacyRates}.</p><p>Missing entries do not prove zero spending. Food docket and itemised deliveries are separate views and must not be added together. Waste may already be included in purchases. These figures are operational records, not profit or full payroll costs.</p>`;
  }
  function csv(rows){return '\uFEFF'+rows.map(row=>row.map(value=>{let s=String(value??'');if(typeof value==='string'&&/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}).join(',')).join('\r\n');}
  function validateBackup(input){
    if(!input||input.app!=='fc-daily'||!input.data||typeof input.data!=='object'||Array.isArray(input.data))throw Error('Not a Daily Tools backup.');
    const entries=Object.entries(input.data);if(!entries.length)throw Error('The backup is empty.');
    const arrays=['catalog','ledger','staff','shifts','orderHistory','reminders','trash'];
    const objects=['sales','food','settings','basket','open','orderDrafts','reminderDismissed'];
    for(const [key,raw] of entries){if(!/^fc\.[A-Za-z][A-Za-z0-9]*$/.test(key)||typeof raw!=='string')throw Error('Invalid backup key or value.');let value;try{value=JSON.parse(raw);}catch{throw Error('A backup record is not valid JSON.');}
      const short=key.slice(3);if(arrays.includes(short)&&!Array.isArray(value))throw Error(`Invalid ${short} records.`);if(objects.includes(short)&&(!value||typeof value!=='object'||Array.isArray(value)))throw Error(`Invalid ${short} records.`);
      if(short==='catalog'&&!value.every(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&typeof x.section==='string'&&Number.isFinite(Number(x.usual))&&Number(x.usual)>0))throw Error('Invalid order catalog.');
      if(short==='sales'&&!Object.entries(value).every(([d,r])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&r&&typeof r==='object'&&!Array.isArray(r)))throw Error('Invalid sales dates or records.');
      if(short==='shifts'&&!value.every(x=>x&&typeof x.id==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&typeof x.name==='string'))throw Error('Invalid shift records.');
      if(short==='ledger'&&!value.every(x=>x&&typeof x.item==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&Number.isFinite(Number(x.qty))&&Number.isFinite(Number(x.price))))throw Error('Invalid stock records.');
      if(short==='food'&&!Object.values(value).every(x=>Array.isArray(x)&&x.length<=7&&x.every(v=>!validAmount(v))))throw Error('Invalid food docket.');
      if(short==='orderHistory'&&!value.every(x=>x&&/^\d{4}-\d{2}-\d{2}$/.test(x.date||'')&&Array.isArray(x.lines)&&x.lines.every(l=>Array.isArray(l)&&typeof l[0]==='string'&&Number.isFinite(Number(l[1])))))throw Error('Invalid order history.');
      if(short==='staff'&&!value.every(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&(x.rate==null||String(x.rate).trim()===''||Number.isFinite(Number(x.rate)))))throw Error('Invalid staff records.');
      if(short==='basket'&&!Object.values(value).every(q=>Number.isFinite(Number(q))&&Number(q)>=0))throw Error('Invalid order quantities.');
      if(short==='reminders'&&!value.every(x=>x&&typeof x.id==='string'&&typeof x.itemId==='string'&&Number.isInteger(x.needDay)&&x.needDay>=0&&x.needDay<=6&&Number.isInteger(x.leadDays)&&x.leadDays>=0&&x.leadDays<=6&&Number(x.qty)>0))throw Error('Invalid recurring reminders.');
      if(short==='orderDrafts'&&!Object.entries(value).every(([d,x])=>/^\d{4}-\d{2}-\d{2}$/.test(d)&&x&&x.date===d&&x.basket&&typeof x.basket==='object'&&!Array.isArray(x.basket)&&Array.isArray(x.items)&&x.items.every(i=>i&&typeof i.id==='string'&&typeof i.name==='string'&&Number(i.qty)>0)))throw Error('Invalid daily order drafts.');
    }
    return entries;
  }
  function restore(storage,entries){
    const previous=Object.keys(storage).filter(k=>k.startsWith('fc.')).map(k=>[k,storage.getItem(k)]),incoming=new Map(entries);
    try{for(const [k,v]of entries)storage.setItem(k,v);for(const [k]of previous)if(!incoming.has(k))storage.removeItem(k);}
    catch(error){try{Object.keys(storage).filter(k=>k.startsWith('fc.')).forEach(k=>storage.removeItem(k));for(const [k,v]of previous)storage.setItem(k,v);}catch{throw Error('Restore failed. Use the recovery backup downloaded before restoring.');}throw Error('Restore failed; the original records were restored.');}
  }
  const api={n,key,date,add,monday,businessDate,validAmount,shiftMinutes,shiftError,hasSales,weekSummary,salesTrend,weekdayTrend,normaliseOrders,orderComparison,dueReminders,partnerHTML,csv,validateBackup,restore};
  root.OpsCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
