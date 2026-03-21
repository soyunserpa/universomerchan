import { NextRequest } from "next/server";
import { GET_topProducts } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_topProducts(req);
}
