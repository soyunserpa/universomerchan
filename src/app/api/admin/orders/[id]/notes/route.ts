import { NextRequest } from "next/server";
import { PUT_orderNotes } from "../../../routes";

export async function PUT(req: NextRequest) {
  return PUT_orderNotes(req);
}
