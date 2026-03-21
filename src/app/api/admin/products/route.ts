import { NextRequest } from "next/server";
import { GET_products } from "../routes";

export async function GET(req: NextRequest) {
  return GET_products(req);
}
