import { NextRequest } from "next/server";
import { PUT_productPrice } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_productPrice(req);
}
