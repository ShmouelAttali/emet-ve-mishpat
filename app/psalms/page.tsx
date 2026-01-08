// app/psalms/page.tsx (Server Component)

import PsalmsPageClient from "./PsalmsPageClient";

export default function PsalmsPage({
                                       searchParams,
                                   }: {
    searchParams?: Record<string, string | string[] | undefined>;
}) {
    const chapter = Number(searchParams?.chapter ?? 1);
    const verse = Number(searchParams?.verse ?? 1);
    const version = typeof searchParams?.version === "string" ? searchParams?.version : "";

    return (
        <PsalmsPageClient
            initialChapter={Number.isFinite(chapter) ? chapter : 1}
            initialVerse={Number.isFinite(verse) ? verse : 1}
            initialVersion={version}
        />
    );
}
