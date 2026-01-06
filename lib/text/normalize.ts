import { PASEK, SOF_PASUQ } from "./unicode";

export function normalizeHebrewText(input: string) {
    let s = input.normalize("NFC");
    s = s.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();

    // accept ASCII alternates from copied texts
    s = s.replaceAll("|", PASEK);
    s = s.replaceAll(":", SOF_PASUQ);

    s = s
        .replaceAll(PASEK, ` ${PASEK} `)
        .replaceAll(SOF_PASUQ, ` ${SOF_PASUQ} `);

    s = s.replace(/\s+/g, " ").trim();
    return s;
}
