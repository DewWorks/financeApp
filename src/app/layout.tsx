import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthPopup } from "@/components/ui/molecules/AuthPopup";
import { ThemeProvider } from "@/components/ui/organisms/ThemeContext"
import { UserProvider } from "@/context/UserContext";
import { PlanGateProvider } from "@/context/PlanGateContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FinancePro",
  description: "Desenvolvido por JoaoIto DevWorks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <UserProvider>
            <PlanGateProvider>
              {children}
            </PlanGateProvider>
          </UserProvider>
        </ThemeProvider>
        <AuthPopup />
      </body>
    </html>
  );
}