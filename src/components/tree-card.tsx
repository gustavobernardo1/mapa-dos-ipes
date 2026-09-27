import Link from "next/link";
import Image from "next/image";
import { MapPin, ArrowUpRight, Flower2, ShieldCheck } from "lucide-react";
import {
  latest,
  labels,
  photoUrl,
  formatDate,
  municipalUnverified,
  type Tree,
} from "@/lib/domain";
import { MunicipalBadge } from "./municipal-badge";
export function TreeCard({ tree: t }: { tree: Tree }) {
  const o = latest(t),
    p = o?.fotos[0];
  return (
    <article className="tree-card">
      {p ? (
        <Image
          src={photoUrl(p, true)}
          alt={`Registro de ${t.nome_popular}`}
          width={480}
          height={360}
          unoptimized
          className="tree-photo"
        />
      ) : (
        <div className="tree-photo placeholder">
          <Flower2 size={40} />
        </div>
      )}
      <div className="tree-card-body">
        <MunicipalBadge tree={t} />
        <span className={`color-label ${t.cor_principal}`}>
          {labels[t.cor_principal]}
          {municipalUnverified(t) ? " · tipo cadastral" : ""}
        </span>
        {municipalUnverified(t) && (
          <Link className="text-link" href={`/registrar?arvore=${t.id}`}>
            Confirmar esta árvore
          </Link>
        )}
        <h3>
          <Link href={`/arvore/${t.id}`}>
            {t.nome_popular}
            <ArrowUpRight size={20} />
          </Link>
        </h3>
        <p className="muted inline">
          <MapPin size={15} />
          {t.bairro || "Goiânia — região não informada"}
        </p>
        <p className="bloom-badge">
          <Flower2 size={15} />
          {o ? labels[o.status_floracao] : "Sem observações"}
        </p>
        <div className="card-meta">
          <span>{o && formatDate(o.data_observacao)}</span>
          <span>
            {t.observacoes.length}{" "}
            {t.observacoes.length === 1 ? "observação" : "observações"}
          </span>
        </div>
        <span className="confidence">
          <ShieldCheck size={14} />
          {labels[t.confianca]}
        </span>
      </div>
    </article>
  );
}
