import Link from "next/link";
export default function NotFound() {
  return (
    <main id="conteudo" className="page narrow">
      <h1>Esse caminho ainda não floresceu.</h1>
      <p>Página não encontrada.</p>
      <Link className="btn btn-primary" href="/">
        Voltar ao mapa
      </Link>
    </main>
  );
}
