import { NextRequest } from "next/server";
import { GET_chart } from "../../routes";

export async function GET(req: NextRequest) {
  return GET_chart(req);
}
