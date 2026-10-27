'use strict';
/* Local shop operations. No network calls, account changes or cloud sync. */
window.Ops=(function(){
  const C=window.OpsCore,stamp=()=>new Date().toISOString();
  const failedKeys=new Set();
  let savedAt='',failed=false,recordQuery='',recordKind='all',recordFrom='',recordTo='',recordLimit=80,reportWeek='',orderWeek='',supplierFilter='';
  const settings=()=>store.get('settings',{});
  const businessToday=()=>C.businessDate(new Date(),settings().cutoff||'04:00');
  function status(){
    const bar=document.getElementById('deviceStatus');if(!bar)return;
    const s=settings(),last=s.lastBackupAt||s.lastBackup;
    const overdue=!last||(Date.now()-new Date(last).getTime())>=7*86400000;
    bar.replaceChildren(h('div',{},h('b',{},failed?'Not saved — check storage':'Saved on this phone'),h('span',{},savedAt?`Last change ${new Date(savedAt).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} · `:'',last?`Backup downloaded ${new Date(last).toLocaleDateString('en-GB')}`:'No backup downloaded yet')),
      h('button',{class:'btn small'+(overdue?' primary':''),onClick:()=>downloadBackup()},overdue?'Back up now':'Backup'));
    bar.classList.toggle('backup-due',overdue||failed);
  }
  function mountStatus(){const bar=h('aside',{id:'deviceStatus',class:'device-status','aria-label':'Save and backup status'});document.querySelector('header.top').after(bar);status();}
  function noteSaved(key,ok){if(!['tab','collapsed'].includes(key)){if(ok){failedKeys.delete(key);savedAt=stamp();}else failedKeys.add(key);failed=failedKeys.size>0;status();}}
  function downloadText(name,text,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=h('a',{href:url,download:name});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  function downloadBackup(recovery=false){
    const s={...settings()};if(!recovery){s.lastBackup=today();s.lastBackupAt=stamp();}
    const data={};Object.keys(localStorage).filter(k=>k.startsWith('fc.')).forEach(k=>data[k]=localStorage.getItem(k));if(!recovery)data['fc.settings']=JSON.stringify(s);
    downloadText(`favorable-${recovery?'recovery':'backup'}-${today()}.json`,JSON.stringify({app:'fc-daily',version:2,saved:stamp(),data},null,1),'application/json');
    if(!recovery)store.set('settings',s);status();refreshClosing();toast(recovery?'Recovery copy downloaded':'Backup download started');
  }
  async function restoreFile(file){
    if(file.size>12*1024*1024)throw Error('This backup is too large to restore safely.');
    const data=JSON.parse(await file.text()),entries=C.validateBackup(data);
    if(!confirm(`Restore ${entries.length} data groups from ${data.saved?new Date(data.saved).toLocaleString('en-GB'):'this backup'}? Current records will be replaced. A recovery backup of this phone will download first.`))return;
    downloadBackup(true);C.restore(localStorage,entries);location.reload();
  }
  function field(label,input){return h('label',{class:'field'},h('span',{},label),input);}
  function error(input,message){input.setCustomValidity(message);input.setAttribute('aria-invalid',String(!!message));let hint=input.parentElement?.querySelector('.field-error');if(message&&!hint){hint=h('span',{class:'field-error',role:'alert'});input.parentElement?.append(hint);}if(hint)hint.textContent=message;return !message;}
  function inputAmount(input,opts={}){return error(input,C.validAmount(input.value,opts));}
  function draft(rec,resetReview=true){if(rec.closingStatus==='completed'){rec.closingStatus='draft';delete rec.completedAt;}if(resetReview)rec.finalReviewed=false;rec.updatedAt=stamp();}
  function settingsControls(){
    const s=settings(),cut=h('input',{class:'input',type:'time',value:s.cutoff||'04:00'});
    cut.addEventListener('change',()=>{if(!cut.value)return;const v=settings();v.cutoff=cut.value;store.set('settings',v);toast('Cutoff saved; existing dates are unchanged');});
    return h('section',{class:'settings-extra'},h('h4',{},'Trading day'),field('New trading day starts at',cut),h('p',{class:'hint'},'Before this time, new cash-ups use the previous date. Existing records never move. Default: 04:00.'),h('h4',{},'Records and exports'),h('button',{class:'btn',onClick:()=>{$('#settings').close();show('records');}},'Search records / export CSV'));
  }
  function closing(view,date,rec){
    const box=h('section',{class:'card closing',id:'closingRoutine'});view.append(box);
    function draw(){
      const salesOk=C.hasSales(rec)&&['front','delivery',...DEDUCT,'float','cash'].every(k=>!C.validAmount(rec[k]));
      const counted=String(rec.cash??'').trim()!==''&&!C.validAmount(rec.cash);
      const c=calc(rec),needsNote=counted&&Math.abs(c.diff)>=.005,notesOk=!!rec.note?.trim()||(!needsNote&&rec.notesReviewed);
      const completed=rec.closingStatus==='completed';
      const step=(done,label,action)=>h('button',{class:'closing-step'+(done?' done':''),onClick:action},h('span',{},done?'✓':'○'),label);
      const focus=label=>{const inputs=[...document.querySelectorAll('#view input,#view textarea')];const el=inputs.find(i=>i.closest('label')?.textContent.includes(label)||i.tagName==='TEXTAREA'&&label==='Note');el?.focus();el?.scrollIntoView({behavior:'smooth',block:'center'});};
      const reviewed=h('input',{type:'checkbox',checked:!!rec.finalReviewed,onChange:e=>{rec.finalReviewed=e.target.checked;draft(rec,false);saveRec(date,rec);draw();}});
      box.replaceChildren(...[h('div',{class:'row-between'},h('h2',{},'Close the trading day'),h('span',{class:'status-badge '+(completed?'completed':'draft')},completed?'Completed':'Draft')),
        h('div',{class:'closing-steps'},step(salesOk,'1 Sales',()=>focus('Front')),step(counted,'2 Cash count',()=>focus('Cash counted')),step(notesOk,'3 Notes',()=>focus('Note')),step(!!rec.finalReviewed,'4 Final check',()=>reviewed.focus()),step(!!settings().lastBackupAt&&settings().lastBackupAt>=(rec.completedAt||'9999'),'5 Backup',()=>downloadBackup())),
        h('p',{class:'hint'},`Trading date: ${fmtLong(date)}. ${completed?'Editing amounts reopens this day as Draft.':'Enter Front and Delivery, including zero when there were no sales.'}`),
        counted?h('p',{class:needsNote?'review-warning':'hint'},`Cash difference: ${money(c.diff)}${needsNote?' — add an explanation before completing.':''}`):null,
        h('label',{class:'check-row'},h('input',{type:'checkbox',checked:!!rec.notesReviewed,onChange:e=>{rec.notesReviewed=e.target.checked;draft(rec,false);saveRec(date,rec);draw();}}),'I reviewed the notes, including any cash difference'),
        h('label',{class:'check-row'},reviewed,'I checked the amounts and selected trading date'),
        h('div',{class:'btn-row'},h('button',{class:'btn primary',disabled:completed,onClick:()=>{
          if(!salesOk||!counted||!notesOk||!rec.finalReviewed||document.querySelector('#view [aria-invalid="true"]')){toast('Finish sales, cash count, notes and final check first');return;}
          rec.closingStatus='completed';rec.completedAt=stamp();if(saveRec(date,rec)!==false){toast('Day completed — download a backup next');draw();}
        }},completed?'Day completed':'Complete day'),h('button',{class:'btn',onClick:()=>downloadBackup()},'Download backup'))].filter(x=>x!=null));
      refreshWeekly();
    }
    box._refresh=draw;draw();
  }
  function refreshClosing(){document.getElementById('closingRoutine')?._refresh?.();}
  function data(){return {sales:allSales(),food:getFood(),ledger:getLedger(),shifts:getShifts(),staff:getStaff()};}
  function weekly(view,date){
    const slot=h('div',{id:'weeklyPartnerSlot'});view.append(slot);slot._refresh=()=>{const wasOpen=!!slot.querySelector('details')?.open;slot.replaceChildren();drawWeekly(slot,date);if(wasOpen)slot.querySelector('details').open=true;};slot._refresh();
  }
  function refreshWeekly(){document.getElementById('weeklyPartnerSlot')?._refresh?.();}
  function drawWeekly(view,date){
    reportWeek=reportWeek||weekStart(date);const start=reportWeek,summary=C.weekSummary(start,data());
    const box=h('details',{class:'card fold weekly-report'});view.append(box);box.append(h('summary',{},'Weekly partner report & sales trends'),dateNav(start,d=>{reportWeek=weekStart(d);show('sales');},{step:7,label:k=>`${fmtDay(k)} – ${fmtDay(addDays(k,6))}`}),
      h('div',{class:'metric-grid'},metric('Sales',money(summary.sales)),metric('Food purchases',money(summary.food)),metric('Recorded wages',money(summary.wages)),metric('Waste',money(summary.waste))),
      h('p',{class:'hint'},`${summary.completedDays}/7 sales days completed · ${summary.foodRecordedDays}/7 food days recorded · Cash counted on ${summary.cashCountedDays} days · ${summary.unpricedShifts} shifts without a rate. Missing entries are not zero spending. Figures are not profit.`),
      h('button',{class:'btn primary',onClick:()=>{const s=C.weekSummary(start,data());printDoc('Weekly partner report',`${fmtLong(start)} – ${fmtLong(s.end)}`,C.partnerHTML(s));}},'Download weekly partner PDF'));
    const trend=C.salesTrend(start,allSales(),businessToday()),day=C.weekdayTrend(date,allSales());
    box.append(h('h3',{},'Like-for-like sales'),h('p',{},trend.pct==null?trend.message:`${trend.pct>0?'+':''}${trend.pct}% versus the same weekdays last week`),h('p',{class:'hint'},`${money(trend.current||0)} this period · ${money(trend.previous||0)} previous. ${trend.message}`),h('p',{},day.average==null?'No completed matching weekdays in the previous four weeks.':`${fmtDay(date,{weekday:'long'})}: previous ${day.samples} completed matching weekday${day.samples===1?'':'s'} averaged ${money(day.average)}${day.pct==null?'':` (${day.pct>0?'+':''}${day.pct}% for selected day)`}.`));
  }
  const metric=(label,value)=>h('div',{class:'metric'},h('span',{},label),h('b',{},value));
  function orders(){return C.normaliseOrders(store.get('orderHistory',[]),catalog);}
  function snapshot(basket){return catalog.filter(i=>nPositive(basket[i.id])).map(i=>({id:i.id,name:i.name,qty:num(basket[i.id]),unit:i.unit||'',supplier:i.supplier||''}));}
  const nPositive=v=>Number.isFinite(Number(v))&&Number(v)>0;
  function saveDraft(date,basket){const drafts=store.get('orderDrafts',{});if(Object.values(basket).some(nPositive))drafts[date]={date,items:snapshot(basket),basket:{...basket},updatedAt:stamp()};else delete drafts[date];return store.set('orderDrafts',drafts);}
  function switchOrderDate(target){saveDraft(orderDate,getBasket());orderDate=target;store.set('basketDate',target);const b=store.get('orderDrafts',{})[target]?.basket||{};store.set('basket',b);show('order');}
  function archiveOrder(date,basket){const lines=Object.entries(basket).filter(([,q])=>nPositive(q));if(!lines.length){toast('Add items before saving an order');return false;}const hist=orders();hist.unshift({id:uid(),date,createdAt:stamp(),lines,items:snapshot(basket)});return store.set('orderHistory',hist);}
  function itemEditor(item){
    const name=h('input',{class:'input',value:item.name,'aria-label':'Item name'}),unit=h('input',{class:'input',value:item.unit||'',placeholder:'e.g. cases, bags, kg'}),supplier=h('input',{class:'input',value:item.supplier||'',placeholder:'Optional'});
    const card=h('details',{class:'item-details'},h('summary',{},'Name, unit & supplier'),h('div',{class:'fields'},field('Item name',name),field('Unit',unit),field('Supplier',supplier)),h('button',{class:'btn small',onClick:()=>{
      const next=name.value.trim();if(!next){error(name,'Enter an item name.');return;}if(catalog.some(i=>i.id!==item.id&&i.name.toLowerCase()===next.toLowerCase())){error(name,'Another item already has this name.');return;}
      // Capture old names/units before changing the live catalog; IDs remain stable.
      if(!store.set('orderHistory',orders()))return;const old={name:item.name,unit:item.unit,supplier:item.supplier};item.name=next;item.unit=unit.value.trim();item.supplier=supplier.value.trim();if(saveCatalog()){saveDraft(orderDate,getBasket());toast('Item updated; past orders keep their original details');show('order');}else Object.assign(item,old);
    }},'Save item details'));
    return card;
  }
  function ensureReminders(){const existing=store.get('reminders',null);if(existing!==null)return existing;const oil=catalog.find(i=>/veggie\s*oil|vegetable\s*oil|vegie\s*oil/i.test(i.name));const list=oil?[{id:'weekly-oil',itemId:oil.id,name:oil.name,needDay:1,leadDays:1,qty:oil.usual||1,active:true}]:[];store.set('reminders',list);return list;}
  function reminders(view){
    const list=ensureReminders(),due=C.dueReminders(businessToday(),list,orders(),store.get('reminderDismissed',{}));
    if(due.length)view.append(h('section',{class:'card reminder-alert'},h('h2',{},'Order reminders'),due.map(r=>h('div',{class:'reminder-row'},h('div',{},h('b',{},catalog.find(i=>i.id===r.itemId)?.name||r.name),h('p',{class:'hint'},`Needed ${fmtDay(r.need)} · Order by ${fmtDay(r.due)}`)),h('button',{class:'btn small primary',onClick:()=>{const i=catalog.find(x=>x.id===r.itemId);if(!i){toast('Choose a replacement item in reminder settings');return;}if(orderDate!==businessToday()){switchOrderDate(businessToday());}const b=getBasket();b[i.id]=Math.max(num(b[i.id]),num(r.qty)||1);setBasket(b);show('order');}},'Add to order'),h('button',{class:'btn small',onClick:()=>{const skips=store.get('reminderDismissed',{});skips[r.id+'@'+r.need]=true;store.set('reminderDismissed',skips);show(current);}},'Skip this week')))));
  }
  function reminderSettings(view){
    const list=ensureReminders(),who=h('select',{class:'input'},catalog.map(i=>h('option',{value:i.id},i.name))),day=h('select',{class:'input'},['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map((d,i)=>h('option',{value:i,selected:i===1},d))),lead=h('input',{class:'input',type:'number',min:0,max:6,value:1}),qty=h('input',{class:'input',inputmode:'decimal',value:1});
    const box=h('details',{class:'card fold'},h('summary',{},'Recurring stock reminders'),h('p',{class:'hint'},'Reminders appear in the app when opened; these are not phone push notifications. Completed saved orders satisfy that week’s reminder.'),list.map(r=>h('div',{class:'reminder-row'},h('span',{},`${catalog.find(i=>i.id===r.itemId)?.name||r.name} · need ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][r.needDay]} · ${r.leadDays} day(s) before · ${r.qty}`),h('button',{class:'btn small',onClick:()=>{store.set('reminders',list.filter(x=>x.id!==r.id));show('order');}},'Remove reminder'))),h('div',{class:'fields'},field('Item',who),field('Needed every',day),field('Remind this many days before',lead),field('Quantity',qty)),h('button',{class:'btn',onClick:()=>{if(!inputAmount(qty,{required:true})||num(qty.value)<=0||!Number.isInteger(Number(lead.value))||num(lead.value)<0||num(lead.value)>6){toast('Enter a positive quantity and 0–6 days lead time');return;}const i=catalog.find(x=>x.id===who.value);if(!i)return;list.push({id:uid(),itemId:i.id,name:i.name,needDay:Number(day.value),leadDays:Number(lead.value),qty:num(qty.value),active:true});store.set('reminders',list);show('order');}},'Add weekly reminder'));
    view.append(box);
  }
  function supplierControls(view){const suppliers=[...new Set(catalog.map(i=>i.supplier).filter(Boolean))];if(supplierFilter&&supplierFilter!=='__none'&&!suppliers.includes(supplierFilter))supplierFilter='';const sel=h('select',{class:'input','aria-label':'Filter order items by supplier'},h('option',{value:''},'All suppliers'),h('option',{value:'__none'},'No supplier set'),suppliers.map(s=>h('option',{value:s},s)));sel.value=supplierFilter;sel.addEventListener('change',()=>{supplierFilter=sel.value;show('order');});
    const send=mode=>{const all=getBasket(),b={};for(const i of catalog)if(matchesSupplier(i)&&num(all[i.id])>0)b[i.id]=all[i.id];if(!Object.keys(b).length){toast('Add this supplier’s items to the order first');return;}if(mode==='copy')copyText(orderText(b));else if(mode==='whatsapp')whatsapp(orderText(b));else printDoc(`${SHOP} – Order`,fmtLong(orderDate),'<ul>'+orderLines(b).map(line=>`<li>${esc(line.slice(2))}</li>`).join('')+'</ul>',{plain:true});};
    view.append(h('div',{class:'supplier-filter'},field('Supplier list',sel),supplierFilter?h('div',{class:'btn-row',style:'margin-top:10px'},h('button',{class:'btn small',onClick:()=>send('copy')},'Copy supplier order'),h('button',{class:'btn small',onClick:()=>send('whatsapp')},'WhatsApp supplier order'),h('button',{class:'btn small',onClick:()=>send('pdf')},'Supplier PDF')):null));}
  const matchesSupplier=i=>!supplierFilter?true:supplierFilter==='__none'?!i.supplier:i.supplier===supplierFilter;
  function orderHistory(view){
    orderWeek=orderWeek||weekStart(orderDate);const start=orderWeek,end=addDays(start,6),asOf=businessToday(),comparisonEnd=asOf<end?asOf:end,all=orders(),week=all.filter(o=>o.date>=start&&o.date<=end),previous=all.filter(o=>o.date>=addDays(start,-7)&&o.date<=addDays(comparisonEnd,-7)),comparison=C.orderComparison(start,all,asOf);
    const box=h('details',{class:'card fold order-history'},h('summary',{},'Order history & weekly comparison'),dateNav(start,d=>{orderWeek=weekStart(d);show('order');},{step:7,label:k=>`${fmtDay(k)} – ${fmtDay(addDays(k,6))}`}),h('p',{class:'hint'},`${week.length} saved orders in this week; ${previous.length} in the comparison weekdays last week. ${asOf>=start&&asOf<end?'Quantities compare the same elapsed weekdays; this week is partial.':'Historical weeks compare full weeks.'} Only recorded orders count; missing history affects comparisons. Orders are purchases requested, not stock used or sales speed.`));
    if(!comparison.length)box.append(h('p',{class:'empty'},'Save an order to begin building comparisons.'));
    for(const r of comparison)box.append(h('div',{class:'history-line'},h('div',{},h('b',{},r.name),h('span',{class:'hint'},`${r.flag}${r.pct==null?'':` (${r.pct>0?'+':''}${r.pct}%)`}`)),h('span',{},`${r.current} vs ${r.previous}${r.unit?' '+r.unit:''}`)));
    const draftRows=Object.values(store.get('orderDrafts',{})).filter(o=>o.date>=start&&o.date<=end);
    if(draftRows.length)box.append(h('h3',{},'Unfinished daily orders'),draftRows.map(o=>h('button',{class:'btn small',onClick:()=>switchOrderDate(o.date)},`${fmtDay(o.date)} · ${o.items.length} items · Draft`)));
    box.append(h('h3',{},'Saved orders'),week.map(o=>orderCard(o)),h('p',{class:'hint'},'All new saved orders are retained. Legacy history contains only what the previous version kept.'));
    view.append(box);reminderSettings(view);
  }
  function orderCard(o){return h('details',{class:'history-order'},h('summary',{},`${fmtLong(o.date)} · ${o.items.length} items`),h('ul',{},o.items.map(i=>h('li',{},`${i.name} x ${i.qty}${i.unit?' '+i.unit:''}${i.supplier?' · '+i.supplier:''}`))),h('div',{class:'btn-row'},h('button',{class:'btn small',onClick:()=>{switchOrderDate(businessToday());const b=getBasket();for(const i of o.items)if(catalog.some(x=>x.id===i.id))b[i.id]=num(b[i.id])+num(i.qty);setBasket(b);show('order');toast('Available items added to the current order');}},'Add items to today’s order'),h('button',{class:'btn small',onClick:()=>{const body='<ul>'+o.items.map(i=>`<li>${esc(`${i.name} x ${i.qty}${i.unit?' '+i.unit:''}`)}</li>`).join('')+'</ul>';printDoc(`${SHOP} – Order`,fmtLong(o.date),body,{plain:true});}},'Download saved order PDF')));}
  function wasteReasonInput(){return h('select',{class:'input'},['Not specified','Expired','Overprepared','Damaged delivery','Mistake','Other'].map(r=>h('option',{value:r},r)));}
  function wasteSummary(view,start){const reasons={};for(const e of getLedger())if(e.type==='waste'&&e.date>=start&&e.date<=addDays(start,6)){const reason=e.reason||'Not specified';reasons[reason]=(reasons[reason]||0)+num(e.qty)*num(e.price);}if(Object.keys(reasons).length)view.append(h('section',{class:'card'},h('h2',{},'Waste by reason'),Object.entries(reasons).sort((a,b)=>b[1]-a[1]).map(([r,v])=>h('div',{class:'sum-line'},h('span',{},r),h('b',{},money(v))))));}
  function trashRecord(key,item){const all=store.get(key,[]),trash=store.get('trash',[]);trash.push({id:uid(),key,item,deletedAt:stamp()});if(!store.set('trash',trash))return false;if(!store.set(key,all.filter(x=>x.id!==item.id)))return false;toast('Moved to Recently deleted — Undo in Records');return true;}
  function trashSale(date){const all=allSales(),rec=all[date];if(!rec)return true;const trash=store.get('trash',[]);trash.push({id:uid(),key:'sales',item:{date,name:'Daily sales',record:rec},deletedAt:stamp()});if(!store.set('trash',trash))return false;delete all[date];return store.set('sales',all);}
  function undoDeleted(id){const trash=store.get('trash',[]),entry=trash.find(x=>x.id===id);if(!entry)return;let all;if(entry.key==='sales'){all=allSales();if(all[entry.item.date]){toast('This date has a record already; it was not overwritten.');return;}all[entry.item.date]=entry.item.record;}else{all=store.get(entry.key,[]);if(!all.some(x=>x.id===entry.item.id))all.push(entry.item);}if(store.set(entry.key,all)){store.set('trash',trash.filter(x=>x.id!==id));show('records');}}
  function recordRows(){const rows=[];for(const [date,r]of Object.entries(allSales()))rows.push({kind:'sales',date,name:'Daily sales',amount:C.hasSales(r)?calc(r).total:null,note:r.note||'',status:r.closingStatus||'draft',source:r});for(const [start,amounts]of Object.entries(getFood()))amounts.forEach((v,i)=>{if(String(v??'').trim()!=='')rows.push({kind:'food',date:addDays(start,i),name:'Food purchases',amount:num(v),source:{week:start}});});for(const e of getLedger())rows.push({kind:'stock',date:e.date,name:e.item,amount:num(e.qty)*num(e.price),note:[e.supplier,e.type,e.reason].filter(Boolean).join(' · '),source:e});for(const s of getShifts())rows.push({kind:'shifts',date:s.date,name:s.name,amount:null,note:`${s.start}–${s.end} · ${hrs(C.shiftMinutes(s)/60)}`,source:s});for(const o of orders())rows.push({kind:'orders',date:o.date,name:'Saved order',amount:null,note:o.items.map(i=>`${i.name} x ${i.qty} ${i.unit||''}`).join(' · '),source:o});for(const d of Object.values(store.get('orderDrafts',{})))rows.push({kind:'orders',date:d.date,name:'Draft order',amount:null,note:(d.items||[]).map(i=>i.name).join(' · '),status:'draft',source:d});return rows.sort((a,b)=>b.date.localeCompare(a.date));}
  function filteredRows(){const q=recordQuery.trim().toLowerCase();return recordRows().filter(r=>(recordKind==='all'||r.kind===recordKind)&&(!recordFrom||r.date>=recordFrom)&&(!recordTo||r.date<=recordTo)&&(!q||`${r.name} ${r.note||''} ${r.date} ${r.status||''}`.toLowerCase().includes(q)));}
  function exportCSV(){
    if(recordFrom&&recordTo&&recordFrom>recordTo){toast('From date must be before To date');return;}
    const salesKeys=['front','delivery',...DEDUCT,'cash','float'];
    const rows=[['Type','Date','Name / item','Quantity','Unit','Supplier','Amount GBP','Start','Finish','Break minutes','Status','Notes','Hours','Hourly rate GBP','Recorded wages GBP','Rate source',...['Front','Delivery','Just Eat','Uber Eats','Deliveroo','Delivery Drop','P.out','Dojo','Teya','Cash counted','Float'].map(s=>s+' GBP')]];
    for(const r of filteredRows()){const s=r.source;if(r.kind==='orders'){const items=s.items||[];for(const i of items)rows.push([r.kind,r.date,i.name,num(i.qty),i.unit||'',i.supplier||'','','','','',r.status||'saved','']);}
      else if(r.kind==='sales')rows.push([r.kind,r.date,r.name,'','','',r.amount??'','','','',r.status,r.note||'','','','','',...salesKeys.map(k=>String(s[k]??'').trim()===''?'':num(s[k]))]);
      else {const rate=s.rate??getStaff().find(p=>p.id===s.staffId)?.rate,priced=rate!=null&&String(rate).trim()!=='';rows.push([r.kind,r.date,r.name,r.kind==='stock'?num(s.qty):'',s.unit||'',s.supplier||'',r.amount??'',s.start||'',s.end||'',s.brk??'',r.status||'',r.note||'',r.kind==='shifts'?C.shiftMinutes(s)/60:'',r.kind==='shifts'&&priced?num(rate):'',r.kind==='shifts'&&priced?Math.round(C.shiftMinutes(s)/60*num(rate)*100)/100:'',r.kind==='shifts'?(s.rate==null?'Current staff rate (legacy)':'Stored with shift'):'']);}}
    const padded=rows.map(row=>[...row,...Array(Math.max(0,rows[0].length-row.length)).fill('')]);
    downloadText(`favorable-records-${today()}.csv`,C.csv(padded),'text/csv;charset=utf-8');toast('CSV download started');
  }
  function renderRecords(view){
    view.append(banner('sales','Records','Find past work, recover entries and export your records.'));
    const results=h('div'),search=h('input',{class:'input',type:'search',value:recordQuery,placeholder:'Item, person, supplier, note or date…','aria-label':'Search records'}),kind=h('select',{class:'input','aria-label':'Record type'},[['all','All records'],['sales','Sales'],['food','Food purchases'],['stock','Deliveries & waste'],['shifts','Shifts'],['orders','Orders']].map(([v,label])=>h('option',{value:v},label))),from=h('input',{class:'input',type:'date',value:recordFrom}),to=h('input',{class:'input',type:'date',value:recordTo});kind.value=recordKind;
    const draw=()=>{const rows=filteredRows();results.replaceChildren(...[h('p',{class:'hint'},`${rows.length} matching records. CSV includes every match.`),...rows.slice(0,recordLimit).map(r=>h('details',{class:'card record-card'},h('summary',{},`${fmtDay(r.date)} · ${r.name}${r.amount==null?'':' · '+money(r.amount)}${r.status?' · '+r.status:''}`),h('p',{class:'hint'},r.note||'No note'),r.kind==='orders'&&r.source.items?h('ul',{},r.source.items.map(i=>h('li',{},`${i.name} x ${i.qty}${i.unit?' '+i.unit:''}`))):null,h('button',{class:'btn small',onClick:()=>{if(r.kind==='sales'){salesDate=r.date;show('sales');}else if(r.kind==='food'||r.kind==='stock'){foodWeek=weekStart(r.date);stockWeek=foodWeek;show('food');}else if(r.kind==='shifts'){period='custom';customFrom=r.date;customTo=r.date;show('shifts');}else{orderWeek=weekStart(r.date);show('order');document.querySelector('.order-history')?.setAttribute('open','');}}},'Open record'))),rows.length>recordLimit?h('button',{class:'btn',onClick:()=>{recordLimit+=80;draw();}},'Show 80 more'):null].filter(x=>x!=null));};
    for(const [el,fn]of [[search,()=>recordQuery=search.value],[kind,()=>recordKind=kind.value],[from,()=>recordFrom=from.value],[to,()=>recordTo=to.value]])el.addEventListener(el===search?'input':'change',()=>{fn();recordLimit=80;draw();});
    view.append(h('section',{class:'card'},field('Search',search),h('div',{class:'fields'},field('Type',kind),field('From',from),field('To',to)),h('button',{class:'btn primary',onClick:exportCSV},'Export matching records CSV')),results);
    const deleted=store.get('trash',[]);view.append(h('details',{class:'card fold'},h('summary',{},`Recently deleted (${deleted.length})`),deleted.map(e=>h('div',{class:'reminder-row'},h('span',{},`${e.item.name||e.item.item||'Entry'} · ${e.item.date}`),h('button',{class:'btn small',onClick:()=>undoDeleted(e.id)},'Undo delete')))));draw();
  }
  return {businessToday,mountStatus,noteSaved,downloadBackup,restoreFile,settingsControls,inputAmount,error,draft,closing,refreshClosing,weekly,refreshWeekly,orders,snapshot,saveDraft,switchOrderDate,archiveOrder,itemEditor,reminders,supplierControls,matchesSupplier,orderHistory,wasteReasonInput,wasteSummary,trashRecord,trashSale,renderRecords};
})();
