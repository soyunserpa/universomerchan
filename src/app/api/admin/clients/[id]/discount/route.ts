import { NextRequest } from "next/server";
import { PUT_clientDiscount } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_clientDiscount(req);
}
