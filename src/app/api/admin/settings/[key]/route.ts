import { NextRequest } from "next/server";
import { PUT_setting } from "../../routes";

export async function PUT(req: NextRequest) {
  return PUT_setting(req);
}
