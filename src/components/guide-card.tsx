import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type GuideProfile } from "@/content/guide";
import { profileHref, treePhoto, cardClue } from "@/content/guide-navigation";
import { GuidePhoto } from "./guide-photo";
export function GuideCard({
  profile: p,
  small = false,
}: {
  profile: GuideProfile;
  small?: boolean;
}) {
  return (
    <article
      className={`fg-card fg-${p.color}${small ? " fg-card-small" : ""}`}
      id={`ficha-${p.id}`}
    >
      <GuidePhoto photo={treePhoto(p.id)} label={`Árvore / copa — ${p.name}`} />
      <div className="fg-card-content">
        <h3>{p.name}</h3>
        {!small && (
          <p className="fg-taxon">
            <i>{p.taxon}</i>
          </p>
        )}
        <p className="fg-card-clue">{cardClue(p).text}</p>
        <Link
          className="fg-card-link"
          href={profileHref(p.id)}
          aria-label={`Conhecer ${p.name.toLowerCase()}`}
        >
          Conhecer <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
