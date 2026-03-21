import { NextRequest } from "next/server";
import { GET_kpis } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_kpis(req);
}
