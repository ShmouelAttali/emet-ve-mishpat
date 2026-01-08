import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";

export async function GET() {
    const rows = await sql`
    select analysis_version,
           max(created_at) as last_seen,
           count(*) as count_rows
    from verse_analyses
    group by analysis_version
    order by last_seen desc
  `;
    return Response.json(rows);
}
