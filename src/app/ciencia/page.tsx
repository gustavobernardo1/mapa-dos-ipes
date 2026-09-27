import type { Metadata } from "next";
import Link from "next/link";
import {
  Camera,
  MapPin,
  Flower2,
  Satellite,
  FlaskConical,
  Search,
  Users,
  ArrowDown,
  ArrowRight,
} from "lucide-react";
export const metadata: Metadata = { title: "Por que sua foto importa?" };
const stages = [
  {
    icon: Camera,
    title: "Sua foto",
    text: "Um instante da árvore, acompanhado da data.",
  },
  {
    icon: MapPin,
    title: "Árvore localizada",
    text: "Um ponto no mapa que pode ser revisitado.",
  },
  {
    icon: Flower2,
    title: "Histórico da floração",
    text: "Novos registros contam como a árvore muda ao longo do tempo.",
  },
  {
    icon: Satellite,
    title: "Série temporal de satélite",
    text: "No futuro, registros verificados poderão ser comparados com imagens de diferentes datas.",
  },
  {
    icon: FlaskConical,
    title: "Pesquisa",
    text: "Investigar se há padrões detectáveis de floração nas imagens.",
  },
  {
    icon: Search,
    title: "Possíveis novos candidatos",
    text: "Se houver evidência suficiente, estudos poderão sugerir locais para procurar árvores.",
  },
  {
    icon: Users,
    title: "Validação pela comunidade",
    text: "Visitas e fotografias serão necessárias para conferir os candidatos.",
  },
];
export default function Page() {
  return (
    <main id="conteudo" className="page narrow">
      <div className="page-intro">
        <span className="eyebrow">CIÊNCIA QUE COMEÇA NA CALÇADA</span>
        <h1>Por que sua foto importa?</h1>
        <p>
          Cada fotografia fornece uma referência espacial e temporal. Juntas,
          elas podem ajudar a fazer novas perguntas sobre a cidade.
        </p>
      </div>
      <div className="science-flow">
        {stages.map((s, i) => (
          <div key={s.title}>
            <article>
              <span className="science-icon">
                <s.icon size={25} />
              </span>
              <div>
                <h2>{s.title}</h2>
                <p>{s.text}</p>
              </div>
            </article>
            {i < stages.length - 1 && (
              <ArrowDown className="flow-arrow" size={22} />
            )}
          </div>
        ))}
      </div>
      <div className="form-card prose">
        <h2>Uma hipótese, não uma promessa.</h2>
        <p>
          Esses registros poderão futuramente ser comparados com séries
          temporais de imagens de satélite para investigar se a floração produz
          padrões detectáveis remotamente.
        </p>
        <p>
          Ainda não existe um modelo de identificação ou detecção por satélite
          funcionando neste produto. Árvores urbanas podem ser menores que os
          pixels das imagens, e nuvens, construções e outras plantas podem
          dificultar a análise.
        </p>
        <p>
          Uma foto comunitária não é uma referência científica automaticamente.
          Data, localização e identificação precisam ser avaliadas. A galeria
          reúne registros aprovados para publicação; um futuro dataset
          científico exigirá critérios adicionais.
        </p>
        <Link href="/registrar" className="btn btn-primary">
          Contribuir com uma fotografia <ArrowRight size={17} />
        </Link>
      </div>
    </main>
  );
}
