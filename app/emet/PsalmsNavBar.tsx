"use client";

import {useEffect, useMemo, useState} from "react";
import styles from "../tools/ToolsPage.module.css";
import {toHebrewNumeral} from "@/lib/gematria";
import {bookToHebName, bookToNumOfChapters} from "@/lib/bookMetaData";
import {EmetBook} from "@/lib/taamim/types";

type VersionsRow = {
    analysis_version: string;
    last_seen: string;
    count_rows: number;
};

export function PsalmsNavBar(props: {
    book: EmetBook;
    chapter: number;
    verse: number;
    version: string;
    versions: VersionsRow[];
    loading: boolean;

    onChangeBook: (b: EmetBook) => void;
    onChangeChapter: (c: number) => void;
    onChangeVerse: (v: number) => void;
    onChangeVersion: (v: string) => void;
}) {
    const {
        book,
        chapter,
        verse,
        version,
        versions,
        loading,
        onChangeBook,
        onChangeChapter,
        onChangeVerse,
        onChangeVersion,
    } = props;

    const numOfChapters = bookToNumOfChapters[book] ?? 0;
    const chapters = useMemo(
        () => Array.from({length: numOfChapters}, (_, i) => i + 1),
        [numOfChapters]
    );

    const [availableVerses, setAvailableVerses] = useState<number[]>([]);
    const [versesErr, setVersesErr] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            setVersesErr(null);
            const res = await fetch(`/api/${book}/${chapter}/verses`, {cache: "no-store"});
            if (!res.ok) throw new Error(await res.text());
            const j = await res.json();
            const list: number[] = j.verses ?? [];
            setAvailableVerses(list);

            if (list.length > 0 && !list.includes(verse)) {
                onChangeVerse(list[0]);
            }
        })().catch((e) => setVersesErr(String(e)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [book, chapter]);

    function prev() {
        const idx = availableVerses.indexOf(verse);
        if (idx > 0) return onChangeVerse(availableVerses[idx - 1]);
        if (chapter > 1) onChangeChapter(chapter - 1);
    }

    function next() {
        const idx = availableVerses.indexOf(verse);
        if (idx >= 0 && idx < availableVerses.length - 1) return onChangeVerse(availableVerses[idx + 1]);
        if (chapter < chapters.length) onChangeChapter(chapter + 1);
    }

    return (
        <div className={styles.navbar}>
            <div className={styles.navGroup}>
                <label className={styles.field}>
                    <div className={styles.fieldLabel}>פסוק</div>
                    <select className={styles.select}
                            value={verse}
                            onChange={(e) => onChangeVerse(Number(e.target.value))}
                            disabled={availableVerses.length === 0}
                    >
                        {availableVerses.map((v) => (
                            <option key={v} value={v}>
                                {toHebrewNumeral(v)}
                            </option>
                        ))}
                    </select>

                    {versesErr && <div style={{fontSize: 12, marginTop: 6, color: "crimson"}}>{versesErr}</div>}
                </label>

                <label className={styles.field}>
                    <div className={styles.fieldLabel}>פרק</div>
                    <select className={styles.select} value={chapter}
                            onChange={(e) => onChangeChapter(Number(e.target.value))}>
                        {chapters.map((c) => (
                            <option key={c} value={c}>
                                {toHebrewNumeral(c)}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <label className={styles.field}>
                <div className={styles.fieldLabel}>ספר</div>
                <select className={styles.select}
                        value={book}
                        onChange={(e) => onChangeBook((e.target.value as unknown) as EmetBook)}
                >
                    {Object.keys(bookToHebName).map((key) => (
                        <option key={key} value={key}>
                            {bookToHebName[key as EmetBook] ?? key}
                        </option>
                    ))}
                </select>

                {versesErr && <div style={{fontSize: 12, marginTop: 6, color: "crimson"}}>{versesErr}</div>}
            </label>
            <div className={styles.navGroup}>
                <label className={styles.field} style={{minWidth: 220}}>
                    <div className={styles.fieldLabel}>גרסת ניתוח</div>
                    <select className={styles.select}
                            value={version}
                            onChange={(e) => onChangeVersion(e.target.value)}
                            disabled={versions.length === 0}
                    >
                        {versions.map((r) => (
                            <option key={r.analysis_version} value={r.analysis_version}>
                                {r.analysis_version}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className={styles.navActions}>
                <div className={styles.loading}>{loading ? "…טוען" : "       "}</div>
                <button className={styles.iconBtn} onClick={next} disabled={loading} title="פסוק הבא">
                    ◀
                </button>
                <button className={styles.iconBtn} onClick={prev} disabled={loading} title="פסוק קודם">
                    ▶
                </button>
            </div>
        </div>
    );
}
