// app/psalms/page.tsx  (Server Component)
import {Suspense} from "react";
import PsalmsPageClient from "./PsalmsPageClient";
import {EmetBook} from "@/lib/taamim/types";

export default async function PsalmsPage(props: {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
    const sp = (await props.searchParams) ?? {};

    const book = sp.book as EmetBook ?? 'Psalms';
    const chapter = Number(sp.chapter ?? 1);
    const verse = Number(sp.verse ?? 1);
    const version = typeof sp.version === "string" ? sp.version : "";

    return (
        <Suspense fallback={null}>
            <PsalmsPageClient
                initialBook={book}
                initialChapter={Number.isFinite(chapter) ? chapter : 1}
                initialVerse={Number.isFinite(verse) ? verse : 1}
                initialVersion={version}
            />
        </Suspense>
    );
}
