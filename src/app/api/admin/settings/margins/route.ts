import { NextRequest } from "next/server";
import { PUT_margins } from "../../routes";

export async function PUT(req: NextRequest) {
  return PUT_margins(req);
}
