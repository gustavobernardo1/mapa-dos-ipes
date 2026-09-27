"use client";
import Image from "next/image";
import { useState } from "react";
import { Leaf } from "lucide-react";
import type { GuideImage } from "@/content/guide";
export function GuidePhoto({
  photo,
  label,
  compact = false,
  eager = false,
}: {
  photo?: GuideImage;
  label: string;
  compact?: boolean;
  eager?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const unavailable = !photo || failedSrc === photo.src;
  return (
    <figure className={`fg-photo${compact ? " fg-photo-compact" : ""}`}>
      <div className="fg-photo-frame">
        {unavailable ? (
          <div
            className="fg-photo-fallback"
            role="img"
            aria-label={`${label}: fotografia indisponível`}
          >
            <Leaf size={26} aria-hidden="true" />
            <span>{label}</span>
            <small>
              {photo
                ? "Fotografia indisponível"
                : "Foto de referência pendente"}
            </small>
          </div>
        ) : (
          <Image
            src={photo.src}
            alt={`${label} de ${photo.taxon}; fotografia de referência, não é um registro de Goiânia`}
            width={photo.width}
            height={photo.height}
            sizes={
              compact
                ? "(max-width: 600px) 44vw, 240px"
                : "(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 380px"
            }
            loading={eager ? "eager" : "lazy"}
            onError={() => setFailedSrc(photo.src)}
          />
        )}
      </div>
      <figcaption>
        <strong>{label}</strong>
        {photo && (
          <>
            <span>
              Foto:{" "}
              <a href={photo.sourceUrl} target="_blank" rel="noreferrer">
                {photo.author}
              </a>{" "}
              —{" "}
              <a href={photo.licenseUrl} target="_blank" rel="noreferrer">
                {photo.license}
              </a>
            </span>
            <small>{photo.changes}</small>
          </>
        )}
      </figcaption>
    </figure>
  );
}
