
import "@/src/styles/globals.css";
import type { ReactNode } from "react";
import { Vazirmatn } from "next/font/google";

import { cn } from "@/src/lib/utils";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
});

export const metadata = {
  title: "Exam UI",
  description: "University Exam Scheduling",
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>

      <body
        className={cn(
          vazirmatn.variable,
          "bg-background text-foreground font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );

}
