import RestaurantMenu from "@/app/c/[slug]/RestaurantMenu";
import type { Catalog, Category, Product } from "@/lib/catalogTypes";

const catalog: Catalog = {
  id: "demo-pilcomayo",
  name: "Fogón de Pilcomayo",
  slug: "fogon-pilcomayo",
  description:
    "Sabores del valle, recetas de familia y productos de nuestra tierra.",
  logo_url: "/brand/catalog-placeholder.svg",
  hero_image:
    "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=82",
  hero_title: "Tradición servida a la mesa.",
  hero_subtitle:
    "Cocina regional preparada al momento, con el sabor que reúne a la familia.",
  primary_color: "#963F2E",
  secondary_color: "#2E241F",
  accent_color: "#DFC9AE",
  background_color: "#F7F3EE",
  text_color: "#2C2927",
  font_family: "Inter, system-ui, sans-serif",
  currency: "PEN",
  whatsapp_number: "51999999999",
  instagram_url: null,
  tiktok_url: null,
  layout_style: "restaurant",
  settings: {
    splash_enabled: true,
    splash_kicker: "Tradición que provoca",
    splash_button_label: "Ver nuestra carta",
    cta_mode: "call_waiter",
    waiter_message: "Hola, necesitamos atención del mozo.",
    table_label: "Mesa",
  },
};

const categories: Category[] = [
  {
    id: "entradas",
    catalog_id: catalog.id,
    name: "Entradas",
    slug: "entradas",
    sort_order: 1,
  },
  {
    id: "cuy",
    catalog_id: catalog.id,
    name: "Cuy",
    slug: "cuy",
    sort_order: 2,
  },
  {
    id: "chancho",
    catalog_id: catalog.id,
    name: "Chancho",
    slug: "chancho",
    sort_order: 3,
  },
  {
    id: "trucha",
    catalog_id: catalog.id,
    name: "Trucha",
    slug: "trucha",
    sort_order: 4,
  },
  {
    id: "bebidas",
    catalog_id: catalog.id,
    name: "Bebidas",
    slug: "bebidas",
    sort_order: 5,
  },
];

function dish(
  partial: Partial<Product> &
    Pick<Product, "id" | "category_id" | "name" | "price" | "image_url">,
): Product {
  return {
    catalog_id: catalog.id,
    slug: partial.id,
    sku: null,
    short_description: null,
    description: null,
    compare_at_price: null,
    gallery: [],
    badge: null,
    variants: {},
    stock_status: "available",
    is_featured: false,
    ...partial,
  };
}

const products: Product[] = [
  dish({
    id: "cuy-colorado",
    category_id: "cuy",
    name: "Cuy colorado de la casa",
    price: 68,
    image_url:
      "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=82",
    short_description:
      "Crocante por fuera, jugoso por dentro, acompañado de papas doradas y ensalada fresca.",
    description:
      "Nuestra receta insignia: cuy seleccionado, aderezo tradicional de ají colorado, papas nativas y ensalada fresca. Preparado al momento.",
    is_featured: true,
    badge: "Recomendación del chef",
    variants: {
      tags: ["Recomendación del chef", "Receta tradicional"],
      spicy_level: "mild",
      recommended_product_ids: ["chicha-jora"],
    },
  }),
  dish({
    id: "papa-huancaina",
    category_id: "entradas",
    name: "Papa a la huancaína",
    price: 18,
    image_url:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80",
    short_description: "Papa amarilla con cremosa salsa de ají y queso fresco.",
    variants: { tags: ["Clásico"] },
  }),
  dish({
    id: "chicharron",
    category_id: "chancho",
    name: "Chicharrón dorado",
    price: 42,
    image_url:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
    short_description: "Chancho crocante con mote, camote y salsa criolla.",
    variants: { tags: ["Favorito"], recommended_product_ids: ["chicha-jora"] },
  }),
  dish({
    id: "pachamanca",
    category_id: "chancho",
    name: "Pachamanca especial",
    price: 55,
    image_url:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=700&q=80",
    short_description: "Carnes, habas y papas marinadas en hierbas andinas.",
    variants: { tags: ["Para compartir"] },
  }),
  dish({
    id: "trucha-frita",
    category_id: "trucha",
    name: "Trucha frita",
    price: 39,
    image_url:
      "https://images.unsplash.com/photo-1579631542720-3a87824fff86?auto=format&fit=crop&w=700&q=80",
    short_description: "Trucha fresca con papas, arroz y ensalada de la casa.",
    variants: { tags: ["Fresco"], recommended_product_ids: ["limonada"] },
  }),
  dish({
    id: "chicha-jora",
    category_id: "bebidas",
    name: "Chicha de Jora",
    price: 8,
    image_url:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=700&q=80",
    short_description: "Bebida tradicional de maíz, servida bien fresca.",
    variants: { tags: ["Maridaje ideal"] },
  }),
  dish({
    id: "limonada",
    category_id: "bebidas",
    name: "Limonada con hierbaluisa",
    price: 10,
    image_url:
      "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=700&q=80",
    short_description: "Limón recién exprimido y hierbaluisa aromática.",
    variants: { tags: ["Sin alcohol"] },
  }),
];

export default async function RestaurantDemoPage({
  searchParams,
}: {
  searchParams: Promise<{ mesa?: string }>;
}) {
  const { mesa } = await searchParams;
  return (
    <RestaurantMenu
      catalog={catalog}
      categories={categories}
      products={products}
      table={mesa || "08"}
    />
  );
}
