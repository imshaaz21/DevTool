import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/video-trimmer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
