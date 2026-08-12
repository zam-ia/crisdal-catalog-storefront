"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Flame,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  X,
} from "lucide-react";
import type { Catalog, Category, Product } from "@/lib/catalogTypes";
import { productImages } from "@/lib/catalogTypes";

type RestaurantMenuProps = {
  catalog: Catalog;
  categories: Category[];
  products: Product[];
  table?: string;
};

type MenuCartItem = Pick<Product, "id" | "name" | "price" | "image_url"> & {
  qty: number;
};

const spiceLabels = {
  mild: "Picante suave",
  medium: "Picante medio",
  hot: "Muy picante",
} as const;

function MenuProductCard({
  product,
  money,
  featured = false,
  canOrder,
  onOpen,
  onAdd,
}: {
  product: Product;
  money: (value: number) => string;
  featured?: boolean;
  canOrder: boolean;
  onOpen: (product: Product) => void;
  onAdd: (product: Product) => void;
}) {
  const image = productImages(product)[0] || "/demo/food-placeholder.svg";
  const tags = product.variants?.tags ?? [];
  const spice = product.variants?.spicy_level;

  function add(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onAdd(product);
  }

  return (
    <article
      className={featured ? "menu-star" : "menu-dish"}
      onClick={() => onOpen(product)}
    >
      <div className="menu-dish-image">
        <Image
          src={image}
          alt={product.name}
          fill
          sizes={featured ? "(max-width: 720px) 100vw, 560px" : "112px"}
          loading="lazy"
        />
        {featured ? (
          <span className="chef-ribbon">
            <Sparkles size={13} /> Plato estrella
          </span>
        ) : null}
        {product.stock_status === "out" ? (
          <span className="sold-out-label">Agotado</span>
        ) : null}
      </div>
      <div className="menu-dish-copy">
        <div className="menu-tags">
          {tags.slice(0, featured ? 3 : 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {spice && spice !== "none" ? (
            <span className="spicy">
              <Flame size={11} /> {spiceLabels[spice]}
            </span>
          ) : null}
        </div>
        <div className="menu-dish-heading">
          <h3>{product.name}</h3>
          <strong>{money(product.price)}</strong>
        </div>
        <p>
          {product.short_description ||
            product.description ||
            "Preparado al momento con ingredientes seleccionados."}
        </p>
        {canOrder ? (
          <button
            type="button"
            className="menu-add"
            disabled={product.stock_status === "out"}
            onClick={add}
          >
            <Plus size={17} />{" "}
            {product.stock_status === "out" ? "No disponible" : "Agregar"}
          </button>
        ) : (
          <button type="button" className="menu-detail-link">
            Ver detalle <ChevronRight size={16} />
          </button>
        )}
      </div>
    </article>
  );
}

function DishDialog({
  product,
  productsById,
  money,
  canOrder,
  onClose,
  onAdd,
}: {
  product: Product;
  productsById: Map<string, Product>;
  money: (value: number) => string;
  canOrder: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}) {
  const images = productImages(product);
  const [imageIndex, setImageIndex] = useState(0);
  const recommendations = (product.variants?.recommended_product_ids ?? [])
    .map((id) => productsById.get(id))
    .filter((item): item is Product => Boolean(item));

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  function move(delta: number) {
    setImageIndex(
      (current) =>
        (current + delta + Math.max(images.length, 1)) %
        Math.max(images.length, 1),
    );
  }

  return (
    <div
      className="restaurant-dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="restaurant-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
      >
        <button
          className="restaurant-close"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          <X />
        </button>
        <div className="restaurant-dialog-media">
          <Image
            src={images[imageIndex] || "/demo/food-placeholder.svg"}
            alt={product.name}
            fill
            sizes="(max-width: 700px) 100vw, 560px"
            priority
          />
          {images.length > 1 ? (
            <>
              <button
                className="restaurant-gallery previous"
                onClick={() => move(-1)}
                aria-label="Foto anterior"
              >
                <ChevronLeft />
              </button>
              <button
                className="restaurant-gallery next"
                onClick={() => move(1)}
                aria-label="Foto siguiente"
              >
                <ChevronRight />
              </button>
              <span>
                {imageIndex + 1}/{images.length}
              </span>
            </>
          ) : null}
        </div>
        <div className="restaurant-dialog-copy">
          <div className="menu-tags">
            {(product.variants?.tags ?? []).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
          <h2 id="dish-title">{product.name}</h2>
          <strong className="restaurant-dialog-price">
            {money(product.price)}
          </strong>
          <p>{product.description || product.short_description}</p>
          {recommendations.length ? (
            <div className="pairing-inline">
              <span>Maridaje recomendado</span>
              {recommendations.map((item) => (
                <button key={item.id} onClick={() => onAdd(item)}>
                  <span>{item.name}</span>
                  <b>+ {money(item.price)}</b>
                </button>
              ))}
            </div>
          ) : null}
          {canOrder ? (
            <button
              className="restaurant-primary full"
              disabled={product.stock_status === "out"}
              onClick={() => onAdd(product)}
            >
              <Plus size={18} />{" "}
              {product.stock_status === "out"
                ? "No disponible"
                : "Agregar al pedido"}
            </button>
          ) : null}
        </div>
      </section>
    </div>
  );
}

export default function RestaurantMenu({
  catalog,
  categories,
  products,
  table = "",
}: RestaurantMenuProps) {
  const settings = catalog.settings ?? {};
  const wa = catalog.whatsapp_number?.replace(/\D/g, "") ?? "";
  const canOrder = settings.cta_mode !== "view_only" && Boolean(wa);
  const [splashVisible, setSplashVisible] = useState(
    settings.splash_enabled !== false,
  );
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [upsell, setUpsell] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState<MenuCartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const tableLabel = settings.table_label || "Mesa";
  const storageKey = `crisdal-menu:${catalog.id}`;
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const moneyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: catalog.currency || "PEN",
      }),
    [catalog.currency],
  );
  const money = (value: number) => moneyFormatter.format(Number(value));
  const featured = products.find((product) => product.is_featured);
  const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.qty,
    0,
  );
  const heroImage =
    catalog.hero_image ||
    (featured ? productImages(featured)[0] : null) ||
    "/demo/food-placeholder.svg";

  useEffect(() => {
    if (
      settings.splash_enabled === false ||
      window.sessionStorage.getItem(`${storageKey}:entered`)
    )
      setSplashVisible(false);
  }, [settings.splash_enabled, storageKey]);

  useEffect(() => {
    const sections = categories
      .map((category) => document.getElementById(`menu-${category.id}`))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveCategory(visible.target.id.replace("menu-", ""));
      },
      { rootMargin: "-145px 0px -55%", threshold: [0.05, 0.25, 0.6] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  function enterMenu() {
    window.sessionStorage.setItem(`${storageKey}:entered`, "1");
    setSplashVisible(false);
    window.setTimeout(
      () =>
        document
          .getElementById("menu-content")
          ?.scrollIntoView({ behavior: "smooth" }),
      120,
    );
  }

  function goToCategory(id: string) {
    setActiveCategory(id);
    document
      .getElementById(`menu-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function addToCart(product: Product, suggest = true) {
    if (!canOrder || product.stock_status === "out") return;
    setCart((current) =>
      current.some((item) => item.id === product.id)
        ? current.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
          )
        : [
            ...current,
            {
              id: product.id,
              name: product.name,
              price: Number(product.price),
              image_url: product.image_url,
              qty: 1,
            },
          ],
    );
    setSelectedProduct(null);
    if (suggest) {
      const recommendation = (product.variants?.recommended_product_ids ?? [])
        .map((id) => productsById.get(id))
        .find((item) => item && item.stock_status !== "out");
      setUpsell(recommendation ?? null);
    }
  }

  function changeQty(id: string, delta: number) {
    setCart((current) =>
      current.flatMap((item) =>
        item.id === id
          ? item.qty + delta > 0
            ? [{ ...item, qty: item.qty + delta }]
            : []
          : [item],
      ),
    );
  }

  function orderMessage() {
    return [
      `Hola, quisiera realizar este pedido en ${catalog.name}:`,
      table ? `${tableLabel}: ${table}` : "",
      customerName.trim() ? `Nombre: ${customerName.trim()}` : "",
      "",
      ...cart.map(
        (item) =>
          `• ${item.qty}× ${item.name} — ${money(item.price * item.qty)}`,
      ),
      "",
      `Total: ${money(total)}`,
    ]
      .filter((line) => line !== "")
      .join("\n");
  }

  function sendOrder() {
    if (!wa || !cart.length) return;
    window.open(
      `https://wa.me/${wa}?text=${encodeURIComponent(orderMessage())}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function callWaiter() {
    if (!wa) return;
    const message = `${settings.waiter_message || "Hola, necesitamos atención del mozo."}${table ? ` ${tableLabel}: ${table}.` : ""}`;
    window.open(
      `https://wa.me/${wa}?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const themeStyle = {
    "--primary": catalog.primary_color || "#9A3F2E",
    "--secondary": catalog.secondary_color || "#31251F",
    "--accent": catalog.accent_color || "#E8D8C7",
    "--bg": catalog.background_color || "#F7F3EE",
    "--text": catalog.text_color || "#2C2927",
  } as CSSProperties;

  return (
    <main className="restaurant-site" style={themeStyle}>
      {splashVisible ? (
        <section
          className="restaurant-splash"
          aria-label={`Bienvenida a ${catalog.name}`}
        >
          <Image src={heroImage} alt="" fill sizes="100vw" priority />
          <div className="restaurant-splash-overlay" />
          <div className="restaurant-splash-copy">
            <Image
              src={catalog.logo_url || "/brand/catalog-placeholder.svg"}
              alt={catalog.name}
              width={92}
              height={92}
              priority
            />
            <span>{settings.splash_kicker || "Tradición que provoca"}</span>
            <h1>{catalog.hero_title || catalog.name}</h1>
            <p>{catalog.hero_subtitle || catalog.description}</p>
            {table ? (
              <b>
                {tableLabel} {table}
              </b>
            ) : null}
            <button onClick={enterMenu}>
              <UtensilsCrossed size={19} />{" "}
              {settings.splash_button_label || "Ver menú"}
            </button>
          </div>
        </section>
      ) : null}

      <header className="restaurant-hero">
        <Image
          className="restaurant-hero-image"
          src={heroImage}
          alt=""
          fill
          sizes="100vw"
          priority
        />
        <div className="restaurant-hero-shade" />
        <div className="restaurant-hero-top">
          <div className="restaurant-brand">
            <Image
              src={catalog.logo_url || "/brand/catalog-placeholder.svg"}
              alt=""
              width={58}
              height={58}
            />
            <div>
              <strong>{catalog.name}</strong>
              <span>Carta digital</span>
            </div>
          </div>
          {table ? (
            <b>
              {tableLabel} {table}
            </b>
          ) : null}
        </div>
        <div className="restaurant-hero-copy">
          <span>{settings.splash_kicker || "Tradición que provoca"}</span>
          <h1>{catalog.hero_title || catalog.name}</h1>
          <p>{catalog.hero_subtitle || catalog.description}</p>
          <button
            onClick={() =>
              document
                .getElementById("menu-content")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Explorar la carta <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <nav className="restaurant-categories" aria-label="Categorías del menú">
        <div>
          {categories.map((category) => (
            <button
              key={category.id}
              className={activeCategory === category.id ? "active" : ""}
              onClick={() => goToCategory(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </nav>

      <div className="restaurant-content" id="menu-content">
        {featured ? (
          <section className="restaurant-featured">
            <div className="restaurant-section-heading">
              <span>La especialidad de la casa</span>
              <h2>Una tradición que tienes que probar.</h2>
            </div>
            <MenuProductCard
              product={featured}
              money={money}
              featured
              canOrder={canOrder}
              onOpen={setSelectedProduct}
              onAdd={addToCart}
            />
          </section>
        ) : null}

        {categories.map((category) => {
          const categoryProducts = products.filter(
            (product) =>
              product.category_id === category.id &&
              product.id !== featured?.id,
          );
          if (!categoryProducts.length) return null;
          return (
            <section
              className="restaurant-menu-section"
              id={`menu-${category.id}`}
              key={category.id}
            >
              <div className="restaurant-section-heading compact">
                <span>Nuestra carta</span>
                <h2>{category.name}</h2>
                <p>
                  {categoryProducts.length}{" "}
                  {categoryProducts.length === 1 ? "opción" : "opciones"}
                </p>
              </div>
              <div className="restaurant-dish-list">
                {categoryProducts.map((product) => (
                  <MenuProductCard
                    key={product.id}
                    product={product}
                    money={money}
                    canOrder={canOrder}
                    onOpen={setSelectedProduct}
                    onAdd={addToCart}
                  />
                ))}
              </div>
            </section>
          );
        })}

        <footer className="restaurant-footer">
          <Image
            src={catalog.logo_url || "/brand/catalog-placeholder.svg"}
            alt=""
            width={62}
            height={62}
          />
          <strong>{catalog.name}</strong>
          <span>Carta digital creada por CRISDAL Agency</span>
        </footer>
      </div>

      {wa && settings.cta_mode === "call_waiter" ? (
        <button
          className={`waiter-fab ${itemCount ? "with-cart" : ""}`}
          onClick={callWaiter}
        >
          <MessageCircle size={18} /> Llamar al mozo
        </button>
      ) : null}
      {canOrder && itemCount ? (
        <button
          className="restaurant-cart-fab"
          onClick={() => setCartOpen(true)}
        >
          <ShoppingBag size={19} />
          <span>Ver pedido</span>
          <b>{itemCount}</b>
          <strong>{money(total)}</strong>
        </button>
      ) : null}

      {upsell ? (
        <aside className="upsell-card" aria-live="polite">
          <button
            className="upsell-close"
            onClick={() => setUpsell(null)}
            aria-label="Cerrar sugerencia"
          >
            <X size={16} />
          </button>
          <div className="upsell-icon">
            <Sparkles size={17} />
          </div>
          <div>
            <span>La combinación ideal</span>
            <strong>¿Lo acompañamos con {upsell.name}?</strong>
            <small>{money(upsell.price)}</small>
          </div>
          <button
            onClick={() => {
              addToCart(upsell, false);
              setUpsell(null);
            }}
          >
            <Plus size={16} /> Agregar
          </button>
        </aside>
      ) : null}

      {selectedProduct ? (
        <DishDialog
          product={selectedProduct}
          productsById={productsById}
          money={money}
          canOrder={canOrder}
          onClose={() => setSelectedProduct(null)}
          onAdd={addToCart}
        />
      ) : null}

      {cartOpen ? (
        <div
          className="restaurant-cart-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setCartOpen(false)
          }
        >
          <aside
            className="restaurant-cart"
            role="dialog"
            aria-modal="true"
            aria-labelledby="restaurant-cart-title"
          >
            <header>
              <div>
                <span>Tu selección</span>
                <h2 id="restaurant-cart-title">
                  Pedido {table ? `· ${tableLabel} ${table}` : ""}
                </h2>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Cerrar pedido"
              >
                <X />
              </button>
            </header>
            <div className="restaurant-cart-items">
              {cart.map((item) => (
                <article key={item.id}>
                  <Image
                    src={item.image_url || "/demo/food-placeholder.svg"}
                    alt=""
                    width={64}
                    height={64}
                  />
                  <div>
                    <strong>{item.name}</strong>
                    <span>{money(item.price)}</span>
                  </div>
                  <div className="restaurant-qty">
                    <button
                      onClick={() => changeQty(item.id, -1)}
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Minus size={15} />
                    </button>
                    <b>{item.qty}</b>
                    <button
                      onClick={() => changeQty(item.id, 1)}
                      aria-label={`Añadir ${item.name}`}
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="restaurant-customer">
              <label>
                Nombre para el pedido{" "}
                <input
                  value={customerName}
                  onChange={(event) => setCustomerName(event.target.value)}
                  placeholder="Opcional"
                />
              </label>
            </div>
            <footer>
              <div>
                <span>Total</span>
                <strong>{money(total)}</strong>
              </div>
              {wa ? (
                <button className="restaurant-primary full" onClick={sendOrder}>
                  <MessageCircle size={18} /> Enviar pedido por WhatsApp
                </button>
              ) : (
                <p>Configura un número de WhatsApp para recibir pedidos.</p>
              )}
            </footer>
          </aside>
        </div>
      ) : null}
    </main>
  );
}
