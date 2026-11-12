import type { Metadata } from "next";
import "./globals.css";
// ✅ آپدیت شد به حروف کوچک
import Navbar from "./components/navbar";

export const metadata: Metadata = {
  title: "بازار شهر",
  description: "مارکت‌پلیس چند فروشندگی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="font-sans antialiased bg-gray-50">
        <Navbar />
        {children}
      </body>
    </html>
  );
}