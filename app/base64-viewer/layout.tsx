import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/base64-viewer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
