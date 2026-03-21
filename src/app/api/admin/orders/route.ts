import { NextRequest } from "next/server";
import { GET_orders } from "../routes";

export async function GET(req: NextRequest) {
  return GET_orders(req);
}
