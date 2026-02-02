import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthPopup } from "@/components/ui/molecules/AuthPopup";
import { ThemeProvider } from "@/components/ui/organisms/ThemeContext"
import { UserProvider } from "@/context/UserContext";
import { PlanGateProvider } from "@/context/PlanGateContext";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

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

export const viewport = {
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "FinancePro",
  description: "Desenvolvido por JoaoIto DevWorks",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinancePro",
  },
  formatDetection: {
    telephone: false,
  },
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
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}