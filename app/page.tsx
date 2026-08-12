import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Palette, QrCode, Smartphone, Zap } from "lucide-react";

const models = [
  { name: "Moda editorial", className: "fashion-model", description: "Galerías amplias para prendas, colores y tallas.", image: "/demo/hoodie.svg" },
  { name: "Menú gastronómico", className: "food-model", description: "Categorías claras, precios y pedidos por WhatsApp.", image: "/demo/bag.svg" },
  { name: "Catálogo minimal", className: "minimal-model", description: "Ideal para servicios, imprentas y productos técnicos.", image: "/demo/sneaker.svg" },
  { name: "Colección premium", className: "luxury-model", description: "Una presentación sobria para marcas de alto valor.", image: "/demo/loafer.svg" },
];

export default function AgencyLanding() {
  return (
    <main className="agency-page">
      <nav className="agency-nav"><Link className="agency-brand" href="/"><Image src="/brand/crisdal-agency.png" alt="CRISDAL Agency" width={48} height={48} /><span>CRISDAL <b>AGENCY</b></span></Link><div><a href="#modelos">Modelos</a><a href="#como-funciona">Cómo funciona</a><Link className="agency-nav-cta" href="/c/crisdal-shop">Ver demo</Link></div></nav>

      <section className="agency-hero">
        <div className="agency-pill"><Zap size={14} /> Catálogos que se actualizan sin volver a imprimir</div>
        <h1>Tu negocio merece algo mejor que un PDF olvidado.</h1>
        <p>Diseñamos catálogos digitales rápidos, elegantes y fáciles de compartir por link o código QR. Tú nos envías los cambios; nosotros mantenemos todo al día.</p>
        <div className="agency-hero-actions"><Link className="agency-primary" href="/c/crisdal-shop">Explorar catálogo demo <ArrowRight size={18} /></Link><a className="agency-secondary" href="#modelos">Ver estilos</a></div>
        <div className="agency-browser" aria-label="Vista previa de un catálogo digital">
          <div className="browser-top"><i /><i /><i /><span>tumarca.com/catalogo</span></div>
          <div className="browser-content"><div className="browser-copy"><small>NUEVA COLECCIÓN</small><strong>Productos que se ven tan bien como en persona.</strong><span>Optimizado para vender desde cualquier pantalla.</span></div><div className="browser-products">{["/demo/hoodie.svg", "/demo/sneaker.svg", "/demo/bag.svg"].map((src, index) => <div key={src}><Image src={src} alt="" fill sizes="240px" /><span>{["Producto destacado", "Nueva temporada", "Edición especial"][index]}</span></div>)}</div></div>
        </div>
      </section>

      <section className="agency-benefits" aria-label="Beneficios"><article><Smartphone /><h2>Hecho para móvil</h2><p>La mayoría de tus clientes lo verá desde el teléfono. Cada interacción está pensada para ser rápida y cómoda.</p></article><article><Palette /><h2>Tu propia identidad</h2><p>Colores, logo, tipografía y estructura adaptados al rubro y personalidad de cada negocio.</p></article><article><QrCode /><h2>Un link, siempre vigente</h2><p>Imprime el QR una sola vez. Los productos, fotos y precios se pueden actualizar cuando quieras.</p></article></section>

      <section className="agency-models" id="modelos"><div className="agency-section-copy"><span>Diseño flexible</span><h2>Un estilo para cada tipo de negocio.</h2><p>No obligamos a una cafetería, una tienda de ropa y una imprenta a verse iguales. Partimos de una estructura sólida y la adaptamos.</p></div><div className="model-grid">{models.map((model) => <article className={`model-card ${model.className}`} key={model.name}><div className="model-preview"><div className="model-preview-nav" /><div className="model-preview-copy"><i /><i /><i /></div><div className="model-preview-image"><Image src={model.image} alt="" fill sizes="300px" /></div></div><h3>{model.name}</h3><p>{model.description}</p></article>)}</div></section>

      <section className="agency-process" id="como-funciona"><div className="agency-section-copy"><span>Simple para ti y tu cliente</span><h2>De la idea al QR en cuatro pasos.</h2></div><ol><li><b>01</b><div><h3>Conocemos el negocio</h3><p>Definimos productos, categorías, estilo visual y forma de contacto.</p></div></li><li><b>02</b><div><h3>Construimos el catálogo</h3><p>Cargamos fotos, precios, variantes y textos con una presentación profesional.</p></div></li><li><b>03</b><div><h3>Revisas y publicamos</h3><p>Recibes tu link y código QR listos para redes, mesas, vitrinas o impresos.</p></div></li><li><b>04</b><div><h3>Lo mantenemos actualizado</h3><p>Cuando algo cambie, nos avisas. El mismo enlace refleja la nueva información.</p></div></li></ol></section>

      <section className="agency-order-feature"><div><span className="agency-pill"><Check size={14} /> Más que una vitrina</span><h2>Convierte visitas en pedidos claros.</h2><p>El cliente arma su pedido, elige variantes y genera un documento PDF que puede compartir directamente por WhatsApp. Menos mensajes confusos, más claridad para vender.</p><Link className="agency-primary" href="/c/crisdal-shop">Probar el flujo de pedido <ArrowRight size={18} /></Link></div><div className="order-phone"><div className="phone-speaker" /><small>TU PEDIDO</small><h3>3 productos</h3><div className="phone-line"><i /><span>Producto destacado<br/><small>Talla M · Negro</small></span><b>S/ 60</b></div><div className="phone-line"><i /><span>Edición especial<br/><small>2 unidades</small></span><b>S/ 90</b></div><div className="phone-total"><span>Total</span><b>S/ 150</b></div><button>Compartir pedido en PDF</button></div></section>

      <section className="agency-final"><Image src="/brand/crisdal-agency.png" alt="" width={76} height={76} /><h2>Haz que tus productos sean fáciles de descubrir y pedir.</h2><p>Empieza con un catálogo demo y conviértelo en una experiencia hecha para tu marca.</p><Link className="agency-primary light" href="/c/crisdal-shop">Ver demostración <ArrowRight size={18} /></Link></section>
      <footer className="agency-footer"><span>© {new Date().getFullYear()} CRISDAL Agency</span><span>Catálogos digitales para negocios que quieren verse mejor.</span></footer>
    </main>
  );
}
