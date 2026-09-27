import Link from "next/link";
import { TreeDeciduous, Flower2, Leaf, ScanLine, Sprout } from "lucide-react";
const steps = [
  {
    title: "Árvore inteira",
    text: "Mostre a copa, o tronco e o contexto do local; uma imagem da base também ajuda.",
    icon: TreeDeciduous,
  },
  {
    title: "Flores de perto",
    text: "Inclua a flor de frente, de lado e o conjunto em que ela aparece.",
    icon: Flower2,
  },
  {
    title: "Folha inteira",
    text: "Mostre como os folíolos se organizam, não apenas um pedaço verde.",
    icon: Leaf,
  },
  {
    title: "Casca",
    text: "Registre a textura do tronco, sem retirar casca ou danificar a árvore.",
    icon: ScanLine,
  },
  {
    title: "Fruto, se houver",
    text: "Fotografe o formato e como fica preso ao ramo, sem precisar coletá-lo.",
    icon: Sprout,
  },
];
export function GuidePhotography({ summary = false }: { summary?: boolean }) {
  const Heading = summary ? "h2" : "h1";
  return (
    <section
      className="fg-photography"
      id="fotografar"
      aria-labelledby="fotos-titulo"
    >
      <div className="fg-section-heading">
        <span className="eyebrow">UM REGISTRO MAIS ÚTIL</span>
        <Heading id="fotos-titulo">
          Como fotografar para ajudar na identificação
        </Heading>
        <p>
          Não precisa fotografar tudo para cadastrar. Quando possível, estas
          imagens ajudam a revisão.
        </p>
      </div>
      <ol>
        {steps.map(({ title, text, icon: Icon }) => (
          <li key={title}>
            <Icon size={30} strokeWidth={1.5} aria-hidden="true" />
            <strong>{title}</strong>
            {!summary && <p>{text}</p>}
          </li>
        ))}
      </ol>
      {summary ? (
        <Link className="fg-text-link" href="/guia/como-fotografar">
          Ver dicas para fotografar
        </Link>
      ) : (
        <>
          <p className="fg-caption-note">
            Sugestões editoriais de documentação, orientadas pelos caracteres
            descritos nas fichas. Na dúvida, escolha “Não sei” no cadastro. Não
            acrescente uma identificação que você não consegue sustentar.
          </p>
          <Link href="/registrar" className="btn btn-primary">
            Registrar uma árvore
          </Link>
        </>
      )}
    </section>
  );
}
