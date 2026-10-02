import type { Metadata } from "next";
import { createToolMetadata } from "@/lib/seo";

export const metadata: Metadata = createToolMetadata("/screen-permission-decode");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
