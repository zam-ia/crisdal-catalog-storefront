"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { Catalog, Product } from "@/lib/catalogTypes";
import { productImages } from "@/lib/catalogTypes";

export default function ProductDetailClient({ catalog, product }: { catalog: Catalog; product: Product }) {
  const images = useMemo(() => productImages(product), [product]);
  const sizes = product.variants?.sizes ?? [];
  const colors = product.variants?.colors ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const wa = catalog.whatsapp_number?.replace(/\D/g, "") || "";
  const moneyFormatter = useMemo(() => new Intl.NumberFormat("es-PE", { style: "currency", currency: catalog.currency || "PEN" }), [catalog.currency]);
  const money = (value: number) => moneyFormatter.format(Number(value));
  const variant = [size ? `Talla ${size}` : "", color ? `Color ${color}` : ""].filter(Boolean).join(", ");
  const message = `Hola, quisiera consultar por ${product.name}${variant ? ` (${variant})` : ""}. Precio: ${money(product.price)}.`;
  const moveImage = (delta: number) => setImageIndex((current) => (current + delta + Math.max(images.length, 1)) % Math.max(images.length, 1));
  const themeStyle = { "--primary": catalog.primary_color, "--secondary": catalog.secondary_color, "--accent": catalog.accent_color, "--bg": catalog.background_color, "--text": catalog.text_color, "--font": catalog.font_family } as CSSProperties;

  return (
    <main className="detail-site" style={themeStyle}>
      <nav className="detail-nav"><Link href={`/c/${catalog.slug}`}><ArrowLeft size={18} /> Volver al catálogo</Link><Link className="detail-brand" href={`/c/${catalog.slug}`}><Image src={catalog.logo_url || "/brand/crisdal-shop.png"} alt="" width={42} height={42} /><strong>{catalog.name}</strong></Link></nav>
      <div className="detail-layout">
        <section className="detail-gallery" aria-label={`Fotos de ${product.name}`}>
          <div className="detail-main-image"><Image src={images[imageIndex] || "/demo/sneaker.svg"} alt={product.name} fill sizes="(max-width: 860px) 100vw, 56vw" priority />{images.length > 1 ? <><button className="gallery-arrow previous" onClick={() => moveImage(-1)} aria-label="Imagen anterior"><ChevronLeft /></button><button className="gallery-arrow next" onClick={() => moveImage(1)} aria-label="Imagen siguiente"><ChevronRight /></button><span className="gallery-counter">{imageIndex + 1} / {images.length}</span></> : null}</div>
          {images.length > 1 ? <div className="detail-thumbnails">{images.map((image, index) => <button key={image} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`Ver imagen ${index + 1}`}><Image src={image} alt="" fill sizes="82px" /></button>)}</div> : null}
        </section>
        <section className="detail-copy"><span className="eyebrow">{product.badge || (product.stock_status === "low" ? "Últimas unidades" : "Disponible")}</span><h1>{product.name}</h1><div className="detail-prices"><strong>{money(product.price)}</strong>{product.compare_at_price ? <span>{money(product.compare_at_price)}</span> : null}</div><p>{product.description || product.short_description || "Consulta los detalles y la disponibilidad directamente con la tienda."}</p>{sizes.length ? <fieldset className="option-group"><legend>Elige una talla</legend><div className="option-list">{sizes.map((value) => <button type="button" key={value} className={size === value ? "selected" : ""} onClick={() => setSize(value)}>{value}</button>)}</div></fieldset> : null}{colors.length ? <fieldset className="option-group"><legend>Elige un color</legend><div className="option-list">{colors.map((value) => <button type="button" key={value} className={color === value ? "selected" : ""} onClick={() => setColor(value)}>{value}</button>)}</div></fieldset> : null}{wa ? <a className="primary-action full detail-cta" href={`https://wa.me/${wa}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer"><MessageCircle size={19} /> Consultar por WhatsApp</a> : null}<Link className="secondary-action full" href={`/c/${catalog.slug}#catalogo`}>Volver y añadir al pedido</Link><p className="detail-note">La compra y disponibilidad final se coordinan directamente con {catalog.name}.</p></section>
      </div>
    </main>
  );
}
