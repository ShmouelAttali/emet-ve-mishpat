import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
    await sql`create table if not exists verses (
                                                    id bigserial primary key,
                                                    book text not null,
                                                    chapter int not null,
                                                    verse int not null,
                                                    text text not null,
                                                    unique (book, chapter, verse)
        )`;

    await sql`create table if not exists verse_analyses (
                                                            id bigserial primary key,
                                                            verse_id bigint not null references verses(id) on delete cascade,
        analysis_version text not null,
        created_at timestamptz not null default now(),
        result_json jsonb not null,
        unique (verse_id, analysis_version)
        )`;

    await sql`create index if not exists idx_verses_book_chapter
        on verses (book, chapter, verse)`;

    await sql`create index if not exists idx_analyses_version
        on verse_analyses (analysis_version)`;

    await sql`create index if not exists idx_analyses_json_gin
    on verse_analyses using gin (result_json)`;

    console.log("✅ Migration completed");
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
