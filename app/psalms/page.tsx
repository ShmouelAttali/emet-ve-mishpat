// app/psalms/page.tsx  (Server Component)
import { Suspense } from "react";
import PsalmsPageClient from "./PsalmsPageClient";

export default async function PsalmsPage(props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = (await props.searchParams) ?? {};

    const chapter = Number(sp.chapter ?? 1);
    const verse = Number(sp.verse ?? 1);
    const version = typeof sp.version === "string" ? sp.version : "";

    return (
        <Suspense fallback={null}>
            <PsalmsPageClient
                initialChapter={Number.isFinite(chapter) ? chapter : 1}
                initialVerse={Number.isFinite(verse) ? verse : 1}
                initialVersion={version}
            />
        </Suspense>
    );
}
