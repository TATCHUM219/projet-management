import type { Metadata } from "next";
import { InitUserSync } from "@/app/components/init-user-sync";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";


export const metadata: Metadata = {
  title: "Gestion de projet TATDJI",
  description: "Application de gestion de projet par TATCHUM DJIKAMBABI FOUEDJEU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider >
      <html lang="en" data-theme="light">
        <body
        >
          <InitUserSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
