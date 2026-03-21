import { NextRequest } from "next/server";
import { POST_triggerSync } from "../../routes";

export async function POST(req: NextRequest) {
  return POST_triggerSync(req);
}
