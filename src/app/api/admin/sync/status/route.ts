import { NextRequest } from "next/server";
import { GET_syncStatus } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_syncStatus(req);
}
