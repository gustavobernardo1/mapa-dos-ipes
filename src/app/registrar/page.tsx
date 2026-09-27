import type { Metadata } from "next";
import { Registration } from "@/components/registration";
export const metadata: Metadata = { title: "Registrar uma árvore" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ origem?: string; arvore?: string; novo?: string }>;
}) {
  const q = await searchParams;
  return (
    <Registration
      key={JSON.stringify(q)}
      historical={q.origem === "historica"}
      attachedId={q.arvore}
    />
  );
}
