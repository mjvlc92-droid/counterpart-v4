import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Counterpart V4",
  description: "Behavioral intelligence for high-stakes negotiations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publicApiKey = process.env.NEXT_PUBLIC_COPILOTKIT_PUBLIC_API_KEY;

  return (
    <html lang="es">
      <body className={inter.variable}>
        <CopilotKit
          runtimeUrl="/copilotkit"
          publicApiKey={publicApiKey}
          agent="counterpart_agent"
        >
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
