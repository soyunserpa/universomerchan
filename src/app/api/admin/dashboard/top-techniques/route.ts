import { NextRequest } from "next/server";
import { GET_topTechniques } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_topTechniques(req);
}
