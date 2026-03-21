import { NextRequest } from "next/server";
import { GET_errors } from "../routes";

export async function GET(req: NextRequest) {
  return GET_errors(req);
}
