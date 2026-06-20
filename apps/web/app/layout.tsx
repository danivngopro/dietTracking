import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/lib/query/provider";
export const metadata: Metadata = {
  title: "NourishTrack",
  description: "Daily diet and macro tracking",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
