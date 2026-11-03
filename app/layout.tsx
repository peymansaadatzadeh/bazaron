import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata: Metadata = {
  title: "بازار متل قو",
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