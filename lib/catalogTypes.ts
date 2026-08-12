export type Catalog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  hero_image?: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  font_family: string;
  currency: string;
  whatsapp_number: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  payment_info?: string | null;
  layout_style: string;
  settings?: CatalogSettings | null;
};

export type CatalogSettings = {
  business_category?: string;
  brand_colors?: string[];
  splash_enabled?: boolean;
  splash_kicker?: string;
  splash_button_label?: string;
  cta_mode?: "whatsapp_order" | "call_waiter" | "view_only";
  waiter_message?: string;
  table_label?: string;
  show_search?: boolean;
};

export type Category = {
  id: string;
  catalog_id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type Product = {
  id: string;
  catalog_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  gallery: string[] | null;
  badge: string | null;
  variants: ProductVariants | null;
  stock_status: "available" | "low" | "out";
  is_featured: boolean;
};

export type ProductVariants = {
  sizes?: string[];
  colors?: string[];
  tags?: string[];
  spicy_level?: "none" | "mild" | "medium" | "hot";
  recommended_product_ids?: string[];
};

export function productImages(product: Product) {
  return Array.from(
    new Set(
      [product.image_url, ...(product.gallery ?? [])].filter(
        (value): value is string => Boolean(value),
      ),
    ),
  );
}
