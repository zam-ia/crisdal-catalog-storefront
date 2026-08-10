"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

type Catalog = any; type Category = any; type Product = any;

export default function CatalogClient({ catalog, categories, products }: { catalog:Catalog; categories:Category[]; products:Product[] }) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const visible = useMemo(()=>products.filter(p => (category==='all'||p.category_id===category) && `${p.name} ${p.short_description||''}`.toLowerCase().includes(search.toLowerCase())),[products,category,search]);
  const money = (n:number) => new Intl.NumberFormat("es-PE",{style:"currency",currency:catalog.currency||"PEN"}).format(Number(n));
  const wa = catalog.whatsapp_number?.replace(/\D/g,'');
  const productWa = (p:Product) => wa ? `https://wa.me/${wa}?text=${encodeURIComponent(`Hola, quiero información sobre ${p.name} (${money(p.price)})`)}` : '#';
  return <div className={`site ${catalog.layout_style||'fashion'}`} style={{
    ['--primary' as any]:catalog.primary_color,['--secondary' as any]:catalog.secondary_color,['--accent' as any]:catalog.accent_color,
    ['--bg' as any]:catalog.background_color,['--text' as any]:catalog.text_color,['--font' as any]:catalog.font_family
  }}>
    <nav className="nav"><div className="nav-inner"><div className="nav-brand"><img className="logo" src={catalog.logo_url||'/brand/crisdal-shop.png'} alt={catalog.name}/><div><strong>{catalog.name}</strong><div style={{fontSize:11,opacity:.6}}>CATÁLOGO DIGITAL</div></div></div><a className="chip active" href="#catalogo">Ver productos</a></div></nav>
    <header className="hero"><div className="hero-copy"><h1>{catalog.hero_title||catalog.name}</h1><p>{catalog.hero_subtitle||catalog.description}</p><div className="chips" style={{marginTop:24}}>{categories.slice(0,4).map(c=><button key={c.id} className="chip" onClick={()=>{setCategory(c.id);document.getElementById('catalogo')?.scrollIntoView()}}>{c.name}</button>)}</div></div><div className="hero-panel"><img src={catalog.logo_url||'/brand/crisdal-shop.png'} alt=""/></div></header>
    <main className="wrap" id="catalogo"><div className="section-head"><div><h2>Catálogo</h2><div className="count">{visible.length} productos</div></div></div><div className="toolbar"><div className="chips"><button className={`chip ${category==='all'?'active':''}`} onClick={()=>setCategory('all')}>Todos</button>{categories.map(c=><button key={c.id} className={`chip ${category===c.id?'active':''}`} onClick={()=>setCategory(c.id)}>{c.name}</button>)}</div><div style={{position:'relative'}}><Search size={17} style={{position:'absolute',left:14,top:13,opacity:.5}}/><input className="search" style={{paddingLeft:40}} placeholder="Buscar…" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
      {visible.length ? <div className="products">{visible.map(p=><article className="product" key={p.id}><div className="image-wrap"><img src={p.image_url||'/demo/sneaker.svg'} alt={p.name}/>{p.badge&&<span className="badge">{p.badge}</span>}<span className="stock">{p.stock_status==='out'?'Agotado':p.stock_status==='low'?'Últimas unidades':'Disponible'}</span></div><div className="product-body"><h3>{p.name}</h3><div className="desc">{p.short_description||'Consulta disponibilidad y variantes.'}</div><div className="prices"><span className="price">{money(p.price)}</span>{p.compare_at_price&&<span className="compare">{money(p.compare_at_price)}</span>}</div><div className="variants">{p.variants?.sizes?.length?`Tallas: ${p.variants.sizes.join(', ')}`:''}{p.variants?.sizes?.length&&p.variants?.colors?.length?' · ':''}{p.variants?.colors?.length?`Colores: ${p.variants.colors.join(', ')}`:''}</div>{wa&&p.stock_status!=='out'?<a className="cta" href={productWa(p)} target="_blank">Consultar por WhatsApp</a>:<span className="cta" style={{opacity:.5}}>No disponible</span>}</div></article>)}</div>:<div className="empty">No encontramos productos con ese filtro.</div>}
    </main>
    <footer className="footer"><div><strong>{catalog.name}</strong><div style={{opacity:.6,marginTop:5}}>Catálogo administrado por CRISDAL Agency</div></div><div style={{display:'flex',gap:18}}>{catalog.instagram_url&&<a href={catalog.instagram_url} target="_blank">Instagram</a>}{catalog.tiktok_url&&<a href={catalog.tiktok_url} target="_blank">TikTok</a>}</div></footer>
    {wa&&<a className="floating" href={`https://wa.me/${wa}`} target="_blank">WhatsApp</a>}
  </div>
}
