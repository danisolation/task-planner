import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Task Planner",
  description: "Created by danisolation",
  generator: "danisolation",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
