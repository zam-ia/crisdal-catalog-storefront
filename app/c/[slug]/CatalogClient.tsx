"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PDFDocument, StandardFonts } from 'pdf-lib';

type Catalog = any; type Category = any; type Product = any;

export default function CatalogClient({ catalog, categories, products }: { catalog:Catalog; categories:Category[]; products:Product[] }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<any[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addedItem, setAddedItem] = useState<string | null>(null);
  const [toast, setToast] = useState<{message:string,type?:'info'|'success'|'error'} | null>(null);
  const [orderResult, setOrderResult] = useState<{url:string, orderId:string, waUrl?:string} | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const visible = useMemo(()=>products.filter(p => (category==='all'||p.category_id===category) && `${p.name} ${p.short_description||''}`.toLowerCase().includes(search.toLowerCase())),[products,category,search]);
  const money = (n:number) => new Intl.NumberFormat("es-PE",{style:"currency",currency:catalog.currency||"PEN"}).format(Number(n));
  const wa = catalog.whatsapp_number?.replace(/\D/g,'');
  const productWa = (p:Product) => wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, quiero información sobre ${p.name} (${money(p.price)})`)}` : '#';

  function showToastMessage(message: string, type: 'info'|'success'|'error' = 'info'){
    setToast({ message, type });
    window.setTimeout(()=>setToast(null), 3000);
  }

  function addToCart(p: Product) {
    setCart(prev => {
      const found = prev.find(i=>i.id===p.id);
      if (found) return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i);
      return [...prev,{ id:p.id, name:p.name, price: Number(p.price||0), image_url:p.image_url, qty:1 }];
    });
    // show quick visual feedback
    setAddedItem(p.id);
    setTimeout(()=>setAddedItem(null), 1000);
    showToastMessage('Añadido al carrito', 'success');
  }

  function removeFromCart(id:string) { setCart(prev=>prev.filter(i=>i.id!==id)); }
  function changeQty(id:string, delta:number) { setCart(prev=>prev.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+delta)}:i)); }

  async function generatePdfAndUpload() {
    if (!cart.length) return alert('El carrito está vacío');
    if (!wa) return alert('Número de WhatsApp no configurado en el catálogo');
    setLoading(true);

    // Open a blank window immediately to avoid popup blockers. Will navigate it later.
    let externalWin: Window | null = null;
    try {
      externalWin = window.open('about:blank', '_blank');
    } catch (e) {
      externalWin = null;
    }

    try {
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595, 842]);
      const { height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);
      let y = height - 60;

      page.drawText(catalog.name || 'Pedido desde catálogo', { x: 40, y, size: 18, font });
      y -= 26;
      page.drawText(`Fecha: ${new Date().toLocaleString()}`, { x: 40, y, size: 10, font: fontNormal });
      y -= 18;

      let total = 0;
      for (const item of cart) {
        if (y < 140) { page = pdfDoc.addPage([595,842]); y = 800; }

        try {
          if (item.image_url) {
            const resp = await fetch(item.image_url);
            if (resp.ok) {
              const buf = await resp.arrayBuffer();
              const contentType = resp.headers.get('content-type') || '';
              let img: any = null;
              if (contentType.includes('png')) img = await pdfDoc.embedPng(buf);
              else img = await pdfDoc.embedJpg(buf).catch(()=>null);
              if (img) {
                const scale = Math.min(80 / img.width, 80 / img.height);
                const imgW = img.width * scale;
                const imgH = img.height * scale;
                page.drawImage(img, { x: 40, y: y - imgH + 10, width: imgW, height: imgH });
              }
            }
          }
        } catch (e) { /* ignore image errors */ }

        const xText = 140;
        const line1 = `${item.name} x${item.qty || 1}`;
        page.drawText(line1, { x: xText, y: y - 10, size: 12, font: fontNormal });
        const price = Number(item.price || 0) * Number(item.qty || 1);
        page.drawText(`${price.toFixed(2)}`, { x: 440, y: y - 10, size: 12, font: fontNormal });
        y -= 90;
        total += price;
      }

      page.drawText(`Total: ${total.toFixed(2)}`, { x: 40, y: y - 10, size: 14, font });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

      // call server API to generate PDF and save order
      const res = await fetch('/api/orders/generate-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cart, catalog }) });
      if (!res.ok) {
        // try to extract server message
        const txt = await res.text().catch(()=>null);
        throw new Error(txt || `Server returned ${res.status}`);
      }
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      const publicUrl = result.url;

      // build message
      let message = `Nuevo pedido desde ${catalog.name || 'Catálogo'}:\n`;
      for (const item of cart) {
        message += `- ${item.name} x${item.qty} => ${money(item.price * item.qty)}\n`;
      }
      message += `Total: ${money(total)}\n\nVer PDF: ${publicUrl}`;

      // build wa.me url
      const waUrl = `https://wa.me/${wa}?text=${encodeURIComponent(message)}`;

      // try to navigate previously opened window to avoid popup blocking; otherwise user can click 'Abrir WhatsApp' in modal
      if (externalWin && !externalWin.closed) {
        try { externalWin.location.href = waUrl; } catch (e) { /* ignore */ }
      }

      // store result and show modal/confirmation to user
      const orderId = (result?.orderId || result?.id || '').toString();
      setOrderResult({ url: publicUrl, orderId, waUrl });
      setShowOrderModal(true);

      // close cart
      setCart([]);
      setCartOpen(false);
      showToastMessage('Pedido creado. Abre WhatsApp para enviar.', 'success');

    } catch (err: any) {
      console.error(err);
      if (externalWin && !externalWin.closed) try { externalWin.close(); } catch(e) {}
      showToastMessage('Error generando o subiendo el PDF', 'error');
      alert('Error generando o subiendo el PDF: ' + (err.message||String(err)));
    } finally { setLoading(false); }
  }

  return <div className={`site ${catalog.layout_style||'fashion'}`} style={{
    ['--primary' as any]:catalog.primary_color,['--secondary' as any]:catalog.secondary_color,['--accent' as any]:catalog.accent_color,
    ['--bg' as any]:catalog.background_color,['--text' as any]:catalog.text_color,['--font' as any]:catalog.font_family
  }}>
    <nav className="nav"><div className="nav-inner"><div className="nav-brand"><img className="logo" src={catalog.logo_url||'/brand/crisdal-shop.png'} alt={catalog.name}/><div><strong>{catalog.name}</strong><div style={{fontSize:11,opacity:.6}}>CATÁLOGO DIGITAL</div></div></div><a className="chip active" href="#catalogo">Ver productos</a></div></nav>

    <header className="hero"><div className="hero-copy"><h1>{catalog.hero_title||catalog.name}</h1><p>{catalog.hero_subtitle||catalog.description}</p><div className="chips" style={{marginTop:24}}>{categories.slice(0,4).map(c=><button key={c.id} className="chip" onClick={()=>{setCategory(c.id);document.getElementById('catalogo')?.scrollIntoView()}}>{c.name}</button>)}</div></div><div className="hero-panel"><img src={catalog.logo_url||'/brand/crisdal-shop.png'} alt=""/></div></header>

    <main className="wrap" id="catalogo"><div className="section-head"><div><h2>Catálogo</h2><div className="count">{visible.length} productos</div></div></div><div className="toolbar"><div className="chips"><button className={`chip ${category==='all'?'active':''}`} onClick={()=>setCategory('all')}>Todos</button>{categories.map(c=><button key={c.id} className={`chip ${category===c.id?'active':''}`} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div><div style={{position:'relative'}}><Search size={17} style={{position:'absolute',left:14,top:13,opacity:.5}}/><input className="search" style={{paddingLeft:40}} placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>

      {visible.length ? <div className="products">{visible.map(p=><article className="product" key={p.id}><div className="image-wrap"><a href={`/c/${catalog.slug}/p/${p.id}`}><img src={p.image_url||'/demo/sneaker.svg'} alt={p.name}/></a>{p.badge&&<span className="badge">{p.badge}</span>}<span className="stock">{p.stock_status==='out'?'Agotado':p.stock_status==='low'?'Últimas unidades':'Disponible'}</span></div><div className="product-body"><h3><a href={`/c/${catalog.slug}/p/${p.id}`} style={{color:'inherit',textDecoration:'none'}}>{p.name}</a></h3><div className="desc">{p.short_description||'Consulta disponibilidad y variantes.'}</div><div className="prices"><span className="price">{money(p.price)}</span>{p.compare_at_price&&<span className="compare">{money(p.compare_at_price)}</span>}</div><div className="variants">{p.variants?.sizes?.length?`Tallas: ${p.variants.sizes.join(', ')}`:''}{p.variants?.sizes?.length&&p.variants?.colors?.length?' · ':''}{p.variants?.colors?.length?`Colores: ${p.variants.colors.join(', ')}`:''}</div>      <div style={{display:'flex',gap:8,marginTop:12}}>{wa&&p.stock_status!=='out'?<a className="cta" href={productWa(p)} target="_blank">Consultar por WhatsApp</a>:<span className="cta" style={{opacity:.5}}>No disponible</span>}
        <button className="chip" onClick={()=>addToCart(p)} style={{padding:'8px 12px'}}>
          {addedItem===p.id ? '¡Añadido!' : 'Añadir'}
        </button>
      </div></div></article>)}</div>:<div className="empty">No encontramos productos con ese filtro.</div>}
    </main>

    <footer className="footer"><div><strong>{catalog.name}</strong><div style={{opacity:.6,marginTop:5}}>Catálogo administrado por CRISDAL Agency</div></div><div style={{display:'flex',gap:18}}>{catalog.instagram_url&&<a href={catalog.instagram_url} target="_blank">Instagram</a>}{catalog.tiktok_url&&<a href={catalog.tiktok_url} target="_blank">TikTok</a>}</div></footer>

    {wa&&<a className="floating" href={`https://wa.me/${wa}`} target="_blank">WhatsApp</a>}

    {/* TOAST */}
    {toast && <div role="status" aria-live="polite" style={{position:'fixed',right:20,top:20,zIndex:9999,minWidth:200,padding:'12px 16px',borderRadius:10,color:'#fff',boxShadow:'0 8px 20px rgba(0,0,0,.15)',background: toast.type==='error'? '#c0392b': toast.type==='success'? '#27ae60' : '#2d9cdb'}}>{toast.message}</div>}

    {/* ORDER MODAL */}
    {showOrderModal && orderResult && <div style={{position:'fixed',left:0,top:0,right:0,bottom:0,display:'flex',alignItems:'center',justifyContent:'center',zIndex:9998}}>
      <div style={{background:'var(--bg)',padding:20,borderRadius:12,boxShadow:'0 30px 80px rgba(0,0,0,.35)',width:'min(720px,95%)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <strong>Pedido creado</strong>
          <button className="chip" onClick={()=>{setShowOrderModal(false); setOrderResult(null);}}>Cerrar</button>
        </div>
        <div style={{marginBottom:12}}>ID: <code style={{background:'rgba(0,0,0,.04)',padding:'4px 8px',borderRadius:6}}>{orderResult.orderId}</code></div>
        <div style={{marginBottom:12}}>PDF: <a href={orderResult.url} target="_blank" rel="noreferrer">Abrir PDF</a></div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
          <button className="cta" onClick={()=>{ if (orderResult?.waUrl) window.open(orderResult.waUrl,'_blank'); setShowOrderModal(false); setOrderResult(null);}}>Abrir WhatsApp</button>
          <button className="chip" onClick={()=>{ navigator.clipboard?.writeText(orderResult.url); showToastMessage('Enlace copiado al portapapeles','success'); }}>Copiar enlace</button>
        </div>
      </div>
    </div>}

    {/* CART FLOAT */}
    <button onClick={()=>setCartOpen(true)} style={{position:'fixed',right:20,bottom:20,zIndex:40,background:'#111',color:'#fff',padding:'12px 16px',borderRadius:999,fontWeight:900,boxShadow:'0 12px 30px rgba(0,0,0,.2)'}}>{`Carrito (${cart.reduce((s,c)=>s+c.qty,0)})`}</button>

    {cartOpen && <div style={{position:'fixed',right:20,bottom:80,zIndex:50,width:360,maxHeight:'70vh',overflow:'auto',background:'var(--bg)',border:'1px solid rgba(0,0,0,.08)',boxShadow:'0 18px 45px rgba(0,0,0,.12)',borderRadius:12,padding:18}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}><strong>Tu pedido</strong><div><button className="chip" onClick={()=>{setCart([])}} style={{marginRight:8}}>Vaciar</button><button className="chip" onClick={()=>setCartOpen(false)}>Cerrar</button></div></div>
      {!cart.length && <div style={{padding:20,textAlign:'center',opacity:.7}}>Carrito vacío</div>}
      {cart.map(item=> <div key={item.id} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(0,0,0,.04)'}}>
        <img src={item.image_url||'/demo/sneaker.svg'} style={{width:64,height:64,objectFit:'cover',borderRadius:8}}/>
        <div style={{flex:1}}>
          <div style={{fontWeight:800}}>{item.name}</div>
          <div style={{opacity:.6,fontSize:13}}>{money(item.price)} · {money(item.price*item.qty)}</div>
          <div style={{marginTop:8,display:'flex',gap:8}}>
            <button className="chip" onClick={()=>changeQty(item.id,-1)}>-</button>
            <div style={{alignSelf:'center'}}>{item.qty}</div>
            <button className="chip" onClick={()=>changeQty(item.id,1)}>+</button>
            <button className="chip" onClick={()=>removeFromCart(item.id)} style={{marginLeft:8}}>Eliminar</button>
          </div>
        </div>
      </div>)}

      <div style={{marginTop:12,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{fontWeight:900}}>Total: {money(cart.reduce((s,c)=>s+c.price*c.qty,0))}</div>
        <div>
          <button className="cta" onClick={generatePdfAndUpload} disabled={loading} style={{opacity:loading?.toString()?0.6:1}}>{loading? 'Generando...' : 'Realizar pedido'}</button>
        </div>
      </div>

    </div>}
  </div>
}
