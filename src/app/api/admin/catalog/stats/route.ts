import { NextRequest } from "next/server";
import { GET_catalogStats } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_catalogStats(req);
}
