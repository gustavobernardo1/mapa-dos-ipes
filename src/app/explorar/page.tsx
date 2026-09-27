import type { Metadata } from "next";
import { Collections } from "@/components/collections";
export const metadata: Metadata = { title: "Explorar" };
export default function Page() {
  return <Collections />;
}
