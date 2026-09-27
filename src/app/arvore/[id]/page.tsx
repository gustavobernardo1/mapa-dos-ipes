import { TreeDetail } from "@/components/tree-detail";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TreeDetail id={id} />;
}
