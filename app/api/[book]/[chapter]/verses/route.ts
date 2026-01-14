import { sql } from "@/lib/db/db";
export const dynamic = "force-dynamic";

type Params = { chapter: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
    const { chapter: chStr } = await ctx.params;
    const chapter = Number(chStr);
    if (!Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
        return new Response("Bad chapter", { status: 400 });
    }

    const rows = await sql`
    select verse
    from verses
    where book = 'Psalms' and chapter = ${chapter}
    order by verse asc
  `;

    return Response.json({
        chapter,
        verses: rows.map((r: any) => r.verse),
    });
}
