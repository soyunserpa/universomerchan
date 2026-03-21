import { NextRequest } from "next/server";
import { GET_clients } from "../routes";

export async function GET(req: NextRequest) {
  return GET_clients(req);
}
