import type { Metadata } from "next";
import { Collections } from "@/components/collections";
export const metadata: Metadata = { title: "Galeria" };
export default function Page() {
  return <Collections gallery />;
}
