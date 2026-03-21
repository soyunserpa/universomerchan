import { NextRequest } from "next/server";
import { GET_quotes } from "../routes";

export async function GET(req: NextRequest) {
    return GET_quotes(req);
}
