import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mesa?: string | string[] }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const rawTable = Array.isArray(query.mesa) ? query.mesa[0] : query.mesa;
  const table =
    rawTable?.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ -]/g, "").slice(0, 30) || "";
  const { data: catalog } = await supabase
    .from("catalogs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (!catalog) return notFound();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("catalog_id", catalog.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select("*")
      .eq("catalog_id", catalog.id)
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at", { ascending: false }),
  ]);
  return (
    <CatalogClient
      catalog={catalog}
      categories={categories ?? []}
      products={products ?? []}
      table={table}
    />
  );
}
