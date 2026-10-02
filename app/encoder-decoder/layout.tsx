import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/encoder-decoder");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
