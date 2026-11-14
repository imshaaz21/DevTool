import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/cron-explainer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
