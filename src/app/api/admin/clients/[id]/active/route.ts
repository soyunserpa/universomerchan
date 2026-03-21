import { NextRequest } from "next/server";
import { PUT_clientActive } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_clientActive(req);
}
