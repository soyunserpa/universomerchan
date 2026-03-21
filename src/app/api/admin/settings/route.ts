import { NextRequest } from "next/server";
import { GET_settings } from "../routes";

export async function GET(req: NextRequest) {
  return GET_settings(req);
}
