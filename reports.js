'use strict';
/* Direct, device-local PDFs. Vendor: pdf-lib (MIT). No report data leaves the device. */
(function (root) {
  const LOGO_PNG = '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';
  const { PDFDocument, StandardFonts, rgb } = root.PDFLib;
  const color = (hex) => rgb(...hex.match(/\w\w/g).map((v) => parseInt(v, 16) / 255));
  const C = { ink: color('243D32'), forest: color('244F3C'), muted: color('59695E'), line: color('DADFD2'), paper: color('FFFDF8'), pale: color('EDF2E5'), gold: color('D3AB62'), white: rgb(1,1,1) };
  const clean = (s) => String(s ?? '').replace(/[\u2010-\u2015\u2212]/g, '-').replace(/\s+/g, ' ').trim();

  async function createReport(model) {
    const doc = await PDFDocument.create();
    const regular = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const serif = await doc.embedFont(StandardFonts.TimesRomanBold);
    const logo = await doc.embedPng(LOGO_PNG);
    const fontText = (s, font = regular) => { const text = clean(s); font.encodeText(text); return text; };
    const width = 595.28, height = 841.89, margin = 42, available = width - margin * 2;
    let page, y;
    const pages = [];
    const text = (s, x, top, size = 10, font = regular, fill = C.ink) => page.drawText(fontText(s,font), { x, y: height - top - size, size, font, color: fill });
    const rect = (x, top, w, h, fill) => page.drawRectangle({ x, y: height - top - h, width:w, height:h, color:fill });
    const rule = (top) => page.drawLine({start:{x:margin,y:height-top},end:{x:width-margin,y:height-top},color:C.line,thickness:.7});
    function wrap(s, font, size, maxWidth) {
      const words = fontText(s,font).split(' '), out = []; let line = '';
      for (let word of words) {
        if (font.widthOfTextAtSize(word,size) > maxWidth) {
          if (line) {out.push(line);line='';}
          let part=''; for (const ch of word) {if (part && font.widthOfTextAtSize(part+ch,size)>maxWidth){out.push(part);part='';}part+=ch;} word=part;
        }
        const candidate = line ? line+' '+word : word;
        if (line && font.widthOfTextAtSize(candidate,size)>maxWidth) {out.push(line);line=word;} else line=candidate;
      }
      if(line)out.push(line);return out.length?out:[''];
    }
    const drawLines = (lines, x, top, size, font, fill, align, cellWidth) => lines.forEach((line,i)=>text(line, align==='right'?x+cellWidth-font.widthOfTextAtSize(line,size):x,top+i*(size+4),size,font,fill));
    function newPage() {
      page=doc.addPage([width,height]); pages.push(page);
      rect(0,0,width,8,C.forest);
      page.drawImage(logo,{x:margin,y:height-65,width:34,height:34});
      text(model.shop||'Favorable Chicken',margin+47,31,17,serif);
      text('DAILY TOOLS / SHOP RECORDS',margin+47,54,7.4,bold,C.muted);
      const smallTitle=pages.length===1?'OPERATIONS REPORT':'CONTINUED';
      text(smallTitle,margin,86,8,bold,C.muted);
      const titles=wrap(model.title,serif,28,available);
      drawLines(titles,margin,103,28,serif,C.ink);
      const subTop=103+titles.length*32+7;
      const subLines=wrap(model.sub,regular,10,available);
      drawLines(subLines,margin,subTop,10,regular,C.muted);
      y=subTop+subLines.length*14+17;rule(y);y+=19;
    }
    const ensure = (h) => {if(y+h>height-66)newPage();};
    newPage();
    for(const block of model.blocks) {
      if(block.type==='heading') {
        const lines=wrap(block.text,bold,12,available);
        ensure(lines.length*16+70);
        if(y>195)y+=9;
        drawLines(lines,margin,y,12,bold,C.forest);y+=lines.length*16+10;
      } else if(block.type==='paragraph') {
        const lines=wrap(block.text,regular,10,available-24);
        for(let i=0;i<lines.length;) {
          ensure(40); const fit=Math.max(1,Math.floor((height-66-y-24)/14));const chunk=lines.slice(i,i+fit);
          rect(margin,y,available,chunk.length*14+24,C.pale);
          drawLines(chunk,margin+12,y+12,10,regular,C.ink);y+=chunk.length*14+35;i+=chunk.length;
        }
      } else if(block.type==='table') {
        const columns=block.headers?.length||block.rows[0]?.cells.length||2;
        const fractions=columns===2?[.7,.3]:columns===5?[.34,.16,.16,.16,.18]:columns===6?[.3,.14,.14,.14,.14,.14]:Array(columns).fill(1/columns);
        const widths=fractions.map(f=>available*f);
        const drawRow = (row,header=false) => {
          const total=row.total===true;
          const font=header||total?bold:regular;const size=header?8:10;
          const lines=row.cells.map((cell,i)=>wrap(cell,font,size,widths[i]-20));
          const rowH=Math.max(28,...lines.map(l=>l.length*(size+4)+14));
          if(rowH>height-270)throw new Error('Row too long for PDF; use print fallback');
          if(y+rowH>height-66){newPage();if(block.headers&&!header)drawRow({cells:block.headers,align:block.rows[0]?.align},true);}
          if(header)rect(margin,y,available,rowH,C.forest);
          else if(total)rect(margin,y,available,rowH,C.pale);
          else if(row.index%2===1)rect(margin,y,available,rowH,color('F7F8F3'));
          let x=margin;
          lines.forEach((l,i)=>{drawLines(l,x+10,y+7,size,font,header?C.white:C.ink,row.align?.[i]==='right'?'right':'left',widths[i]-20);x+=widths[i];});
          y+=rowH;if(!header)rule(y);
        };
        ensure(65);if(block.headers)drawRow({cells:block.headers,align:block.rows[0]?.align},true);
        block.rows.forEach((row,index)=>drawRow({...row,index}));y+=19;
      }
    }
    const stamp=new Date(model.generatedAt||Date.now()).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
    pages.forEach((p,i)=>{page=p;rule(height-47);text('Generated on device  /  '+stamp,margin,height-34,8,regular,C.muted);const label=`${i+1} / ${pages.length}`;text(label,width-margin-regular.widthOfTextAtSize(label,8),height-34,8,regular,C.muted);});
    doc.setTitle(model.title+' - '+(model.shop||'Favorable Chicken'));
    doc.setCreator('Daily Tools');doc.setProducer('Daily Tools / pdf-lib');
    return doc.save();
  }
  function modelFromHTML(title,sub,bodyHtml,shop) {
    const holder=document.createElement('div');holder.innerHTML=bodyHtml;
    const blocks=[];
    for(const el of holder.children) {
      if(el.tagName==='TABLE') {
        const heads=[...el.querySelectorAll('thead th')].map(c=>c.textContent);
        const rows=[...el.querySelectorAll('tbody tr,tfoot tr')].map(tr=>{
          const cells=[],align=[];
          for(const c of tr.cells){cells.push(c.textContent);align.push(c.classList.contains('r')?'right':'left');for(let i=1;i<c.colSpan;i++){cells.push('');align.push('left');}}
          return {cells,align,total:tr.parentElement.tagName==='TFOOT'||/^Total sales$|^Expected cash$/.test(tr.cells[0]?.textContent||'')};
        });
        blocks.push({type:'table',headers:heads.length?heads:null,rows});
      } else if(/^H[1-6]$/.test(el.tagName))blocks.push({type:'heading',text:el.textContent});
      else if(el.textContent.trim())blocks.push({type:'paragraph',text:el.textContent});
    }
    return {title,sub,shop,blocks};
  }
  async function download(title,sub,bodyHtml,shop) {
    const bytes=await createReport(modelFromHTML(title,sub,bodyHtml,shop));
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const a=document.createElement('a');a.href=url;
    a.download='daily-tools-'+title.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'-'+new Date().toLocaleDateString('en-CA')+'.pdf';
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  root.DailyPDF={createReport,modelFromHTML,download};
})(typeof window==='undefined'?globalThis:window);
