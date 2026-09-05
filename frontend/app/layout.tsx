import type { Metadata, Viewport } from "next";
import { Martian_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

/* Mono states the record; the serif explains it. */
const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  weight: ["400", "600", "700"],
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Injection Court",
  description:
    "A public record of who is at fault when an AI agent is hijacked by prompt injection. Cases are filed with evidence, investigated by GenLayer validators, and answered with one of four verdicts.",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
};

export const viewport: Viewport = {
  themeColor: "#080a10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${martian.variable} ${newsreader.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
