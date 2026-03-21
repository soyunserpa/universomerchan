import { NextRequest } from "next/server";
import { PUT_resolveError } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_resolveError(req);
}
