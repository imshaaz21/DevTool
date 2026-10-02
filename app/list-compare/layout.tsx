import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/list-compare");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
