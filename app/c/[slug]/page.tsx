import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CatalogClient from "./CatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: catalog } = await supabase.from("catalogs").select("*").eq("slug",slug).eq("is_published",true).maybeSingle();
  if (!catalog) return notFound();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").eq("catalog_id",catalog.id).eq("is_active",true).order("sort_order"),
    supabase.from("products").select("*").eq("catalog_id",catalog.id).eq("is_active",true).order("sort_order").order("created_at",{ascending:false})
  ]);
  return <CatalogClient catalog={catalog} categories={categories??[]} products={products??[]}/>;
}
