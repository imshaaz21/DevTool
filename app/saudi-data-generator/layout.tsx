import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/saudi-data-generator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
