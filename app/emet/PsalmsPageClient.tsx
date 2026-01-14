"use client";

import {useEffect, useState} from "react";
import {MultiLayerTimeline} from "../tools/ui/MultiLayerTimeline";
import {SelectedTokenPanel} from "../tools/ui/SelectedTokenPanel";
import {PsalmsNavBar} from "./PsalmsNavBar";
import styles from "../tools/ToolsPage.module.css";
import {toHebrewNumeral} from "@/lib/gematria";
import {usePathname, useRouter, useSearchParams} from "next/navigation";
import {AnalyzeResult, EmetBook} from "@/lib/taamim/types";
import {bookToHebName} from "@/lib/bookMetaData";


type ApiPsalmsResponse = {
    verse: { chapter: number; verse: number; text: string };
    analysisVersion: string | null;
    analysisCreatedAt?: string;
    analysis: AnalyzeResult | null;
    message?: string;
};

type VersionsRow = {
    analysis_version: string;
    last_seen: string;
    count_rows: number;
};

export default function PsalmsPage(_props: {
    initialBook: EmetBook;
    initialChapter: number;
    initialVerse: number;
    initialVersion: string;
}) {
    const [book, setBook] = useState<EmetBook>(_props.initialBook);
    const [chapter, setChapter] = useState(_props.initialChapter);
    const [verse, setVerse] = useState(_props.initialVerse);
    const [version, setVersion] = useState<string>(_props.initialVersion);

    const [versions, setVersions] = useState<VersionsRow[]>([]);

    const [result, setResult] = useState<AnalyzeResult | null>(null);
    const [verseText, setVerseText] = useState<string>("");
    const [selectedSourceIndex, setSelectedSourceIndex] = useState<number | null>(null);

    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    function pushUrl(next: { book?: EmetBook, chapter?: number; verse?: number; version?: string }) {
        const sp = new URLSearchParams(searchParams?.toString() ?? "");

        if (next.book != null) sp.set("book", String(next.book));
        if (next.chapter != null) sp.set("chapter", String(next.chapter));
        if (next.verse != null) sp.set("verse", String(next.verse));
        if (next.version != null) sp.set("version", next.version);

        router.push(`${pathname}?${sp.toString()}`, {scroll: false});
    }

    function onChangeBook(b: EmetBook) {
        setBook(b);
        // נבחר בינתיים פסוק 1; ה-NavBar שלך כבר מתקן לפסוק ראשון זמין אחרי fetch

        setChapter(1);
        setVerse(1);
        pushUrl({book: b, chapter: 1, verse: 1, version});
    }

    function onChangeChapter(c: number) {
        setChapter(c);
        // נבחר בינתיים פסוק 1; ה-NavBar שלך כבר מתקן לפסוק ראשון זמין אחרי fetch
        setVerse(1);
        pushUrl({chapter: c, verse: 1});
    }

    function onChangeVerse(v: number) {
        setVerse(v);
        pushUrl({verse: v});
    }

    function onChangeVersion(v: string) {
        setVersion(v);
        pushUrl({version: v});
    }

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/analysis-versions", {cache: "no-store"});
            if (!res.ok) throw new Error(await res.text());
            const rows: VersionsRow[] = await res.json();
            setVersions(rows);

            const urlVersion = searchParams.get("version");
            if (urlVersion) {
                setVersion(urlVersion);
                return;
            }

            if (rows.length > 0) {
                setVersion(rows[0].analysis_version);
                pushUrl({version: rows[0].analysis_version});
            }
        })().catch((e) => setErr(String(e)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const b = (searchParams.get("book") ?? "Psalms") as EmetBook;
        const c = Number(searchParams.get("chapter") ?? 1);
        const v = Number(searchParams.get("verse") ?? 1);
        const ver = searchParams.get("version") ?? "";

        setBook(b);

        if (Number.isFinite(c) && c >= 1) setChapter(c);
        if (Number.isFinite(v) && v >= 1) setVerse(v);
        if (ver) setVersion(ver);
    }, [searchParams]);

    async function load() {
        if (!version) return;

        setLoading(true);
        setErr(null);
        setSelectedSourceIndex(null);

        try {
            const res = await fetch(`/api/${book}/${chapter}/${verse}?version=${encodeURIComponent(version)}`, {
                cache: "no-store",
            });
            if (!res.ok) throw new Error(await res.text());

            const j = (await res.json()) as ApiPsalmsResponse;
            setVerseText(j.verse?.text ?? "");
            setResult(j.analysis ?? null);

            if (!j.analysis) setErr(j.message ?? "No analysis found for this verse/version.");
        } catch (e: any) {
            setErr(e?.message ?? String(e));
            setResult(null);
            setVerseText("");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!version) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book, chapter, verse, version]);

    return (
        <main className={styles.main}>
            <div className={styles.card}>
                <h1 className={styles.title}>טעמי אמ&quot;ת</h1>

                <PsalmsNavBar
                    book={book}
                    chapter={chapter}
                    verse={verse}
                    version={version}
                    versions={versions}
                    loading={loading}
                    onChangeBook={onChangeBook}
                    onChangeChapter={onChangeChapter}
                    onChangeVerse={onChangeVerse}
                    onChangeVersion={onChangeVersion}
                />

                {verseText && (
                    <div className={styles.verseCard}>
                        <div className="biblical" style={{direction: "rtl", fontSize: 24, lineHeight: 2.2}}>
                            {verseText}
                        </div>
                        <div className={styles.verseMeta}>
                            {bookToHebName[book]} פרק {toHebrewNumeral(chapter)} פסוק {toHebrewNumeral(verse)} · version: {version}
                        </div>
                    </div>
                )}

                {err && (
                    <div className={styles.errorBox}>
                        <b>שגיאה:</b> {err}
                    </div>
                )}

                {result && (
                    <>
                        <h2 className={styles.sectionTitle}>Domains (Roles)</h2>

                        <div className={styles.panel}>
                            <MultiLayerTimeline
                                tokens={result.tokens}
                                layers={result.layers}
                                selectedSourceIndex={selectedSourceIndex}
                                onSelectSourceIndex={setSelectedSourceIndex}
                                debug={result.debug}
                                taamim={result.taamim}
                            />
                        </div>

                        <h2 className={styles.sectionTitle}>Selected token</h2>

                        {selectedSourceIndex != null ? (
                            <div className={styles.panel}>
                                <SelectedTokenPanel result={result} sourceIndex={selectedSourceIndex}/>
                            </div>
                        ) : (
                            <div className={styles.hint}>לחץ על מילה למעלה כדי לראות פרטים.</div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
