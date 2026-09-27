import { municipalBadge, type Tree } from "@/lib/domain";
export function MunicipalBadge({ tree }: { tree: Tree }) {
  if (!tree.origem_municipal) return null;
  return <span className="municipal-badge">{municipalBadge(tree)}</span>;
}
