"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Plus, MapPin, ShieldCheck, Flower2 } from "lucide-react";
import { api } from "@/lib/client";
import {
  type Tree,
  latest,
  labels,
  photoUrl,
  formatDate,
  municipalUnverified,
} from "@/lib/domain";
import { MunicipalBadge } from "./municipal-badge";
import { CityMap } from "./map";
export function TreeDetail({ id }: { id: string }) {
  const [tree, setTree] = useState<Tree | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    api<Tree | null>(`/api/trees/${id}`)
      .then(setTree)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading)
    return (
      <main id="conteudo" className="page">
        <p role="status">Carregando o histórico…</p>
      </main>
    );
  if (!tree)
    return (
      <main id="conteudo" className="page">
        <h1>{error ? "Ficha indisponível" : "Árvore não encontrada"}</h1>
        <p>
          {error ||
            "Esta árvore não existe ou ainda não tem observações aprovadas."}
        </p>
        <Link href="/" className="btn btn-primary">
          Voltar ao mapa
        </Link>
      </main>
    );
  const o = latest(tree),
    photo = o?.fotos[0];
  return (
    <main id="conteudo" className="page">
      <Link href="/" className="text-link">
        <ArrowLeft size={16} />
        Voltar ao mapa
      </Link>
      <div className="detail-heading">
        <div>
          <span className="eyebrow">ÁRVORE {tree.codigo_publico}</span>
          <h1>{tree.nome_popular}</h1>
          <MunicipalBadge tree={tree} />
          <p className="inline muted">
            <MapPin size={17} />
            {tree.bairro || "Goiânia — GO"}
          </p>
        </div>
        <Link className="btn btn-primary" href={`/registrar?arvore=${tree.id}`}>
          <Plus size={18} />
          {municipalUnverified(tree)
            ? "Confirmar esta árvore"
            : "Adicionar observação"}
        </Link>
      </div>
      <div className="detail-grid">
        {photo ? (
          <Image
            className="detail-photo"
            src={photoUrl(photo)}
            alt={`Fotografia de ${tree.nome_popular}`}
            width={1200}
            height={900}
            unoptimized
            priority
          />
        ) : (
          <div className="detail-photo placeholder">
            <Flower2 size={50} />
          </div>
        )}
        <div className="detail-summary">
          <span className={`color-label ${tree.cor_principal}`}>
            {labels[tree.cor_principal]}
          </span>
          <h2>{o ? labels[o.status_floracao] : "Sem registro"}</h2>
          <p>
            {o
              ? `Última observação: ${formatDate(o.data_observacao)}`
              : "Sem observação fotográfica aprovada. Floração atual desconhecida."}
          </p>
          {tree.origem_municipal && (
            <p className="notice">
              Cor cadastral do tipo de ipê:{" "}
              {labels[tree.cor_cadastral || "NAO_SEI"]}. Essa classificação não
              indica floração atual. Origem histórica: Prefeitura de Goiânia,{" "}
              {tree.proveniencia_municipal?.dataset}, camada{" "}
              {tree.proveniencia_municipal?.layer}, OBJECTID{" "}
              {tree.proveniencia_municipal?.OBJECTID}.
            </p>
          )}
          <p className="inline">
            <ShieldCheck size={18} />
            {labels[tree.confianca]}
          </p>
          <p>
            <strong>{tree.observacoes.length}</strong> observações aprovadas
          </p>
          <small className="muted">
            A identificação é provável. A confiança descreve a verificação dos
            dados; não representa uma identificação botânica automática.
          </small>
          <div className="detail-map">
            <CityMap
              compact
              trees={[tree]}
              point={{ lat: tree.latitude, lng: tree.longitude }}
            />
          </div>
          <p className="coordinate">
            {tree.latitude.toFixed(6)}, {tree.longitude.toFixed(6)}
          </p>
        </div>
      </div>
      <section className="timeline-section">
        <span className="eyebrow">UMA ÁRVORE, MUITOS INSTANTES</span>
        <h2>Histórico da floração</h2>
        <div className="timeline">
          {tree.observacoes.map((obs) => (
            <article key={obs.id}>
              <span className="timeline-dot" />
              <div>
                <span className="eyebrow">
                  {formatDate(obs.data_observacao)} · {labels[obs.origem]}
                </span>
                <h3>{labels[obs.status_floracao]}</h3>
                <p className="muted">
                  {labels[obs.cor_observada]} · {labels[obs.confianca_dados]}
                </p>
                {obs.comentario && <p>{obs.comentario}</p>}
                {obs.nome_publico && (
                  <p className="muted">Registro de {obs.nome_publico}</p>
                )}
                <div className="timeline-photos">
                  {obs.fotos.map((p) => (
                    <a
                      href={photoUrl(p)}
                      key={p.id}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Image
                        src={photoUrl(p, true)}
                        width={320}
                        height={240}
                        unoptimized
                        loading="lazy"
                        alt={`Registro de ${formatDate(obs.data_observacao)}`}
                      />
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
