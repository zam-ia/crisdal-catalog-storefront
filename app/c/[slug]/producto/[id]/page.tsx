import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProductDetailClient from "./ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { data: catalog } = await supabase.from("catalogs").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  if (!catalog) notFound();

  const { data: product } = await supabase.from("products").select("*").eq("id", id).eq("catalog_id", catalog.id).eq("is_active", true).maybeSingle();
  if (!product) notFound();

  return <ProductDetailClient catalog={catalog} product={product} />;
}
