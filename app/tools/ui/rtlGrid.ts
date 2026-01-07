/**
 * Converts a logical LTR range [from..to] into CSS grid columns for RTL layout.
 *
 * Assumptions:
 * - Grid has `n` columns
 * - Logical indices are 0-based
 * - CSS Grid columns are 1-based
 * - `grid-column-end` is exclusive
 */
export function rtlRangeToGridColumns(
    n: number,
    from: number,
    to: number
): { colStart: number; colEnd: number } {
    // flip logical indices to visual RTL indices
    const vf = n - 1 - from;
    const vt = n - 1 - to;

    // normalize order
    const start = Math.min(vf, vt);
    const end = Math.max(vf, vt);

    return {
        colStart: start + 1,
        colEnd: end + 2, // end is exclusive
    };
}
