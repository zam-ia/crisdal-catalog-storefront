"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Search,
  Share2,
  ShoppingBag,
  X,
} from "lucide-react";
import type { Catalog, Category, Product } from "@/lib/catalogTypes";
import { productImages } from "@/lib/catalogTypes";
import RestaurantMenu from "./RestaurantMenu";

type CartItem = {
  lineId: string;
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  qty: number;
  variant?: string;
};

type Customer = { name: string; phone: string; note: string };
type Toast = { message: string; type: "success" | "error" | "info" };
type FallbackOrder = { orderId: string; fileUrl: string; waUrl: string | null };

function ProductQuickView({
  product,
  currency,
  onClose,
  onAdd,
}: {
  product: Product;
  currency: string;
  onClose: () => void;
  onAdd: (
    product: Product,
    selection: { size?: string; color?: string },
  ) => void;
}) {
  const images = useMemo(() => productImages(product), [product]);
  const sizes = product.variants?.sizes ?? [];
  const colors = product.variants?.colors ?? [];
  const [imageIndex, setImageIndex] = useState(0);
  const [size, setSize] = useState(sizes[0] ?? "");
  const [color, setColor] = useState(colors[0] ?? "");
  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: currency || "PEN",
      }).format(Number(product.price)),
    [currency, product.price],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  const moveImage = (delta: number) =>
    setImageIndex(
      (current) =>
        (current + delta + Math.max(images.length, 1)) %
        Math.max(images.length, 1),
    );

  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="product-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-product-title"
      >
        <button
          className="icon-button dialog-close"
          onClick={onClose}
          aria-label="Cerrar detalles"
        >
          <X size={20} />
        </button>
        <div className="quick-gallery">
          <div className="quick-main-image">
            <Image
              src={images[imageIndex] || "/demo/sneaker.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 760px) 94vw, 48vw"
            />
            {images.length > 1 ? (
              <>
                <button
                  className="gallery-arrow previous"
                  onClick={() => moveImage(-1)}
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft />
                </button>
                <button
                  className="gallery-arrow next"
                  onClick={() => moveImage(1)}
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight />
                </button>
                <span className="gallery-counter">
                  {imageIndex + 1} / {images.length}
                </span>
              </>
            ) : null}
          </div>
          {images.length > 1 ? (
            <div className="quick-thumbnails" aria-label="Galería del producto">
              {images.map((image, index) => (
                <button
                  key={image}
                  className={index === imageIndex ? "active" : ""}
                  onClick={() => setImageIndex(index)}
                  aria-label={`Ver imagen ${index + 1}`}
                >
                  <Image src={image} alt="" fill sizes="72px" />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="quick-copy">
          <div className="eyebrow">{product.badge || "Producto"}</div>
          <h2 id="quick-product-title">{product.name}</h2>
          <div className="quick-price">{money}</div>
          <p>
            {product.description ||
              product.short_description ||
              "Consulta disponibilidad y detalles con la tienda."}
          </p>
          {sizes.length ? (
            <fieldset className="option-group">
              <legend>Talla</legend>
              <div className="option-list">
                {sizes.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={size === value ? "selected" : ""}
                    onClick={() => setSize(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          {colors.length ? (
            <fieldset className="option-group">
              <legend>Color</legend>
              <div className="option-list">
                {colors.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={color === value ? "selected" : ""}
                    onClick={() => setColor(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}
          <button
            className="primary-action full"
            disabled={product.stock_status === "out"}
            onClick={() =>
              onAdd(product, {
                size: size || undefined,
                color: color || undefined,
              })
            }
          >
            <ShoppingBag size={18} />{" "}
            {product.stock_status === "out" ? "Agotado" : "Añadir al pedido"}
          </button>
        </div>
      </section>
    </div>
  );
}

type CatalogClientProps = {
  catalog: Catalog;
  categories: Category[];
  products: Product[];
  table?: string;
};

export default function CatalogClient(props: CatalogClientProps) {
  if (props.catalog.layout_style === "restaurant")
    return <RestaurantMenu {...props} />;
  return <CommerceCatalog {...props} />;
}

function CommerceCatalog({
  catalog,
  categories,
  products,
}: CatalogClientProps) {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customer, setCustomer] = useState<Customer>({
    name: "",
    phone: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [fallbackOrder, setFallbackOrder] = useState<FallbackOrder | null>(
    null,
  );

  const storageKey = `crisdal-cart:v1:${catalog.id}`;
  const wa = catalog.whatsapp_number?.replace(/\D/g, "") || "";
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: catalog.currency || "PEN",
      }),
    [catalog.currency],
  );
  const money = (value: number) => moneyFormatter.format(Number(value));
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const visible = useMemo(
    () =>
      products.filter((product) => {
        const matchesCategory =
          category === "all" || product.category_id === category;
        const haystack =
          `${product.name} ${product.short_description || ""} ${product.sku || ""}`.toLowerCase();
        return (
          matchesCategory &&
          (!deferredSearch || haystack.includes(deferredSearch))
        );
      }),
    [products, category, deferredSearch],
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed))
          setCart(
            parsed.filter((item): item is CartItem =>
              Boolean(
                item &&
                  typeof item === "object" &&
                  "lineId" in item &&
                  "qty" in item,
              ),
            ),
          );
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    } finally {
      setCartReady(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (cartReady)
      window.localStorage.setItem(storageKey, JSON.stringify(cart));
  }, [cart, cartReady, storageKey]);

  function showToast(message: string, type: Toast["type"] = "info") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function addToCart(
    product: Product,
    selection: { size?: string; color?: string } = {},
  ) {
    const variant = [
      selection.size ? `Talla: ${selection.size}` : "",
      selection.color ? `Color: ${selection.color}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
    const lineId = `${product.id}:${selection.size || ""}:${selection.color || ""}`;
    setCart((current) => {
      const exists = current.some((item) => item.lineId === lineId);
      return exists
        ? current.map((item) =>
            item.lineId === lineId ? { ...item, qty: item.qty + 1 } : item,
          )
        : [
            ...current,
            {
              lineId,
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url,
              qty: 1,
              variant,
            },
          ];
    });
    setSelectedProduct(null);
    showToast(`${product.name} añadido al pedido`, "success");
  }

  function requestAdd(product: Product) {
    const hasOptions = Boolean(
      product.variants?.sizes?.length ||
        product.variants?.colors?.length ||
        productImages(product).length > 1,
    );
    if (hasOptions) setSelectedProduct(product);
    else addToCart(product);
  }

  function changeQty(lineId: string, delta: number) {
    setCart((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? { ...item, qty: Math.max(1, item.qty + delta) }
          : item,
      ),
    );
  }

  function removeFromCart(lineId: string) {
    setCart((current) => current.filter((item) => item.lineId !== lineId));
  }

  function orderMessage(orderId: string) {
    const lines = cart.map(
      (item) =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ""} x${item.qty} — ${money(item.price * item.qty)}`,
    );
    return [
      `Hola, envío mi pedido #${orderId} desde ${catalog.name}.`,
      customer.name ? `Nombre: ${customer.name}` : "",
      ...lines,
      `Total: ${money(total)}`,
      "Adjunto el pedido en PDF.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  async function shareOrder() {
    if (!cart.length || loading) return;
    setLoading(true);
    let supportsFileShare = false;
    try {
      supportsFileShare =
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [new File([], "pedido.pdf", { type: "application/pdf" })],
        });
    } catch {
      supportsFileShare = false;
    }
    const whatsappWindow =
      !supportsFileShare && wa ? window.open("about:blank", "_blank") : null;

    try {
      const response = await fetch("/api/orders/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart,
          catalog: {
            name: catalog.name,
            currency: catalog.currency,
            payment_info: catalog.payment_info,
          },
          customer,
        }),
      });
      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ error: "No se pudo generar el documento." }));
        throw new Error(error.error);
      }

      const blob = await response.blob();
      const orderId =
        response.headers.get("X-Order-Id") || Date.now().toString().slice(-8);
      const filename = `pedido-${catalog.slug}-${orderId}.pdf`;
      const file = new File([blob], filename, { type: "application/pdf" });

      if (supportsFileShare) {
        try {
          await navigator.share({
            title: `Pedido #${orderId}`,
            text: orderMessage(orderId),
            files: [file],
          });
          setCart([]);
          setCartOpen(false);
          showToast("Documento compartido correctamente", "success");
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            showToast(
              "El pedido sigue guardado; puedes compartirlo cuando quieras.",
              "info",
            );
            return;
          }
          throw error;
        }
      }

      const fileUrl = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = fileUrl;
      download.download = filename;
      download.click();
      const waUrl = wa
        ? `https://wa.me/${wa}?text=${encodeURIComponent(orderMessage(orderId))}`
        : null;
      if (whatsappWindow && waUrl) whatsappWindow.location.href = waUrl;
      setFallbackOrder({ orderId, fileUrl, waUrl });
      setCartOpen(false);
      showToast("PDF descargado. Ahora adjúntalo en WhatsApp.", "success");
    } catch (error) {
      whatsappWindow?.close();
      showToast(
        error instanceof Error
          ? error.message
          : "No se pudo generar el pedido.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }

  function finishFallbackOrder() {
    if (fallbackOrder) URL.revokeObjectURL(fallbackOrder.fileUrl);
    setFallbackOrder(null);
    setCart([]);
  }

  const themeStyle = {
    "--primary": catalog.primary_color,
    "--secondary": catalog.secondary_color,
    "--accent": catalog.accent_color,
    "--bg": catalog.background_color,
    "--text": catalog.text_color,
    "--font": catalog.font_family,
  } as CSSProperties;

  return (
    <div
      className={`site ${catalog.layout_style || "fashion"}`}
      style={themeStyle}
    >
      <nav className="nav">
        <div className="nav-inner">
          <Link
            className="nav-brand"
            href={`/c/${catalog.slug}`}
            aria-label={`Inicio de ${catalog.name}`}
          >
            <Image
              className="logo"
              src={catalog.logo_url || "/brand/catalog-placeholder.svg"}
              alt=""
              width={58}
              height={58}
              priority
            />
            <div>
              <strong>{catalog.name}</strong>
              <span>CATÁLOGO DIGITAL</span>
            </div>
          </Link>
          <a className="nav-action" href="#catalogo">
            Ver productos
          </a>
        </div>
      </nav>

      <header className={`hero ${catalog.hero_image ? "with-image" : ""}`}>
        <div className="hero-copy">
          <div className="eyebrow">Compra fácil · Atención directa</div>
          <h1>{catalog.hero_title || catalog.name}</h1>
          <p>{catalog.hero_subtitle || catalog.description}</p>
          <div className="hero-chips">
            {categories.slice(0, 5).map((item) => (
              <button
                key={item.id}
                className="chip"
                onClick={() => {
                  setCategory(item.id);
                  document.getElementById("catalogo")?.scrollIntoView();
                }}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
        {catalog.hero_image ? (
          <div className="hero-panel">
            <Image
              src={catalog.hero_image}
              alt=""
              fill
              sizes="(max-width: 760px) 100vw, 42vw"
              priority
            />
          </div>
        ) : null}
      </header>

      <main className="wrap" id="catalogo">
        <div className="section-head">
          <div>
            <span className="eyebrow">Explora</span>
            <h2>Catálogo</h2>
            <div className="count">
              {visible.length} {visible.length === 1 ? "producto" : "productos"}
            </div>
          </div>
        </div>
        <div className="toolbar">
          <div className="chips" aria-label="Filtrar por categoría">
            <button
              className={`chip ${category === "all" ? "active" : ""}`}
              onClick={() => setCategory("all")}
            >
              Todos
            </button>
            {categories.map((item) => (
              <button
                key={item.id}
                className={`chip ${category === item.id ? "active" : ""}`}
                onClick={() => setCategory(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Buscar productos</span>
            <input
              className="search"
              placeholder="Buscar productos"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>

        {visible.length ? (
          <div className="products">
            {visible.map((product) => {
              const images = productImages(product);
              return (
                <article className="product" key={product.id}>
                  <Link
                    className="image-wrap"
                    href={`/c/${catalog.slug}/producto/${product.id}`}
                    aria-label={`Ver ${product.name}`}
                  >
                    <Image
                      src={images[0] || "/demo/sneaker.svg"}
                      alt={product.name}
                      fill
                      sizes="(max-width: 560px) 92vw, (max-width: 1050px) 45vw, 25vw"
                    />
                    {product.badge ? (
                      <span className="badge">{product.badge}</span>
                    ) : null}
                    <span className="stock">
                      {product.stock_status === "out"
                        ? "Agotado"
                        : product.stock_status === "low"
                          ? "Últimas unidades"
                          : "Disponible"}
                    </span>
                    {images.length > 1 ? (
                      <span className="photo-count">{images.length} fotos</span>
                    ) : null}
                  </Link>
                  <div className="product-body">
                    <Link
                      className="product-title"
                      href={`/c/${catalog.slug}/producto/${product.id}`}
                    >
                      <h3>{product.name}</h3>
                    </Link>
                    <p className="desc">
                      {product.short_description ||
                        "Consulta disponibilidad y variantes."}
                    </p>
                    <div className="prices">
                      <span className="price">{money(product.price)}</span>
                      {product.compare_at_price ? (
                        <span className="compare">
                          {money(product.compare_at_price)}
                        </span>
                      ) : null}
                    </div>
                    <div className="variants">
                      {product.variants?.sizes?.length
                        ? `Tallas: ${product.variants.sizes.join(", ")}`
                        : ""}
                      {product.variants?.sizes?.length &&
                      product.variants?.colors?.length
                        ? " · "
                        : ""}
                      {product.variants?.colors?.length
                        ? `Colores: ${product.variants.colors.join(", ")}`
                        : ""}
                    </div>
                    <div className="product-actions">
                      <button
                        className="primary-action"
                        disabled={product.stock_status === "out"}
                        onClick={() => requestAdd(product)}
                      >
                        <Plus size={17} />{" "}
                        {product.variants?.sizes?.length ||
                        product.variants?.colors?.length
                          ? "Elegir"
                          : "Añadir"}
                      </button>
                      {wa ? (
                        <a
                          className="secondary-action"
                          href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, quisiera información sobre ${product.name}.`)}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Consultar
                        </a>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty">
            <Search size={28} />
            <h3>No encontramos productos</h3>
            <p>Prueba otra categoría o cambia tu búsqueda.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <div>
          <strong>{catalog.name}</strong>
          <span>Catálogo digital administrado por CRISDAL Agency</span>
        </div>
        <div className="footer-links">
          {catalog.instagram_url ? (
            <a href={catalog.instagram_url} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : null}
          {catalog.tiktok_url ? (
            <a href={catalog.tiktok_url} target="_blank" rel="noreferrer">
              TikTok
            </a>
          ) : null}
          <Link href="/">Crear mi catálogo</Link>
        </div>
      </footer>

      <div className="contact-dock">
        {wa ? (
          <a
            className="dock-button whatsapp"
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
          >
            <Image src="/wsp-icon.svg" alt="" width={25} height={25} />{" "}
            <span>WhatsApp</span>
          </a>
        ) : null}
        <button
          className="dock-button cart"
          onClick={() => setCartOpen(true)}
          aria-label={`Abrir pedido con ${itemCount} productos`}
        >
          <ShoppingBag size={22} />
          <span>Pedido</span>
          {itemCount ? <b>{itemCount}</b> : null}
        </button>
      </div>

      {selectedProduct ? (
        <ProductQuickView
          key={selectedProduct.id}
          product={selectedProduct}
          currency={catalog.currency}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      ) : null}

      {cartOpen ? (
        <div
          className="drawer-backdrop"
          role="presentation"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setCartOpen(false)
          }
        >
          <aside
            className="cart-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
          >
            <div className="drawer-head">
              <div>
                <span className="eyebrow">Resumen</span>
                <h2 id="cart-title">Tu pedido</h2>
              </div>
              <button
                className="icon-button"
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar pedido"
              >
                <X />
              </button>
            </div>
            <div className="cart-lines">
              {!cart.length ? (
                <div className="cart-empty">
                  <ShoppingBag size={34} />
                  <h3>Tu pedido está vacío</h3>
                  <p>Añade productos del catálogo para comenzar.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div className="cart-line" key={item.lineId}>
                    <div className="cart-thumb">
                      <Image
                        src={item.image_url || "/demo/sneaker.svg"}
                        alt=""
                        fill
                        sizes="72px"
                      />
                    </div>
                    <div className="cart-line-copy">
                      <strong>{item.name}</strong>
                      {item.variant ? <span>{item.variant}</span> : null}
                      <span>{money(item.price)} c/u</span>
                      <div className="quantity">
                        <button
                          onClick={() => changeQty(item.lineId, -1)}
                          aria-label="Quitar uno"
                        >
                          <Minus size={15} />
                        </button>
                        <b>{item.qty}</b>
                        <button
                          onClick={() => changeQty(item.lineId, 1)}
                          aria-label="Añadir uno"
                        >
                          <Plus size={15} />
                        </button>
                        <button
                          className="remove"
                          onClick={() => removeFromCart(item.lineId)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                    <strong>{money(item.price * item.qty)}</strong>
                  </div>
                ))
              )}
            </div>
            {cart.length ? (
              <div className="checkout">
                <h3>Datos para el pedido</h3>
                <div className="checkout-grid">
                  <label>
                    Nombre{" "}
                    <input
                      value={customer.name}
                      onChange={(event) =>
                        setCustomer({ ...customer, name: event.target.value })
                      }
                      placeholder="¿A nombre de quién?"
                    />
                  </label>
                  <label>
                    Teléfono{" "}
                    <input
                      inputMode="tel"
                      value={customer.phone}
                      onChange={(event) =>
                        setCustomer({ ...customer, phone: event.target.value })
                      }
                      placeholder="Opcional"
                    />
                  </label>
                  <label className="full">
                    Indicaciones{" "}
                    <textarea
                      value={customer.note}
                      onChange={(event) =>
                        setCustomer({ ...customer, note: event.target.value })
                      }
                      placeholder="Dirección, horario u otra indicación"
                    />
                  </label>
                </div>
                <div className="checkout-total">
                  <span>Total estimado</span>
                  <strong>{money(total)}</strong>
                </div>
                <button
                  className="primary-action full order-submit"
                  onClick={shareOrder}
                  disabled={loading}
                >
                  <Share2 size={19} />{" "}
                  {loading ? "Preparando PDF…" : "Compartir pedido en PDF"}
                </button>
                <p className="checkout-help">
                  En celular podrás enviar el documento directamente a WhatsApp.
                  En computadora se descargará para que lo adjuntes.
                </p>
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}

      {fallbackOrder ? (
        <div className="dialog-backdrop">
          <section
            className="order-confirmation"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-ready-title"
          >
            <div className="success-icon">
              <Check />
            </div>
            <span className="eyebrow">Pedido #{fallbackOrder.orderId}</span>
            <h2 id="order-ready-title">Tu PDF está listo</h2>
            <p>
              El documento se descargó. Adjúntalo en la conversación de WhatsApp
              que acabamos de abrir.
            </p>
            <a
              className="primary-action full"
              href={fallbackOrder.fileUrl}
              download={`pedido-${fallbackOrder.orderId}.pdf`}
            >
              Descargar otra vez
            </a>
            {fallbackOrder.waUrl ? (
              <a
                className="secondary-action full"
                href={fallbackOrder.waUrl}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>
            ) : null}
            <button className="text-button" onClick={finishFallbackOrder}>
              Listo, ya lo envié
            </button>
          </section>
        </div>
      ) : null}

      {toast ? (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.type === "success" ? <Check size={18} /> : null}
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}
