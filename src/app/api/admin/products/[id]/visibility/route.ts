import { NextRequest } from "next/server";
import { PUT_productVisibility } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_productVisibility(req);
}
