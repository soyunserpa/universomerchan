"use server";

import { getProductList } from "@/lib/catalog-api";

export async function loadMoreProducts(params: {
  category?: string;
  subcategory?: string;
  search?: string;
  page?: string;
  sort?: string;
  green?: string;
  color?: string;
}) {
  const category = params.category || "Todos";
  const subcategory = params.subcategory || "Todas";
  const search = params.search || "";
  const page = parseInt(params.page || "1");
  const sort = (params.sort || "newest") as any;
  const greenOnly = params.green === "true";
  const color = params.color || "Todos";

  return getProductList({
    category: category === "Todos" ? undefined : category,
    subcategory: subcategory === "Todas" ? undefined : subcategory,
    search,
    page,
    sort,
    greenOnly,
    color: color === "Todos" ? undefined : color,
    limit: 24,
  });
}
