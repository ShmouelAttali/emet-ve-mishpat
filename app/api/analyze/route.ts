import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeHebrewTaamim } from "@/lib/analyze";

const BodySchema = z.object({
  text: z.string().min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body. Expected { text: string }" }, { status: 400 });
  }

  const result = analyzeHebrewTaamim(parsed.data.text);
  return NextResponse.json(result);
}