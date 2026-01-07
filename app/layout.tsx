import type {Metadata} from "next";
import {Heebo} from "next/font/google";
import "./globals.css";
import localFont from "next/font/local";


const sblHebrew = localFont({
    src: [{path: "../public/fonts/SBL_Hbrw.woff2", weight: "400", style: "normal"}],
    display: "swap",
    variable: "--font-biblical",
});

const uiFont = Heebo({
    subsets: ["hebrew", "latin"],
    weight: ["400", "500", "700"],
    display: "swap",
    variable: "--font-ui",
});

export const metadata: Metadata = {
    title: "אמת ומשפט",
    description: "עיון בפסוקי אמת. למען שמו באהבה.",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="he" className={`${uiFont.variable} ${sblHebrew.variable}`}>
        <body>{children}</body>
        </html>
    );
}
