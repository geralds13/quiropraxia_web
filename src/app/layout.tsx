import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiropraxia Bienestar | Alivio del dolor, alineación vertebral y bienestar integral",
  description:
    "Centro de quiropraxia clínica y bienestar: ajustes vertebrales, terapia manual y programas personalizados para recuperar tu biomecánica sin fármacos invasivos.",
  keywords: [
    "quiropraxia",
    "bienestar",
    "terapia manual",
    "alineación vertebral",
    "alivio del dolor",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-wellness-darkBg text-wellness-text">
        {children}
      </body>
    </html>
  );
}