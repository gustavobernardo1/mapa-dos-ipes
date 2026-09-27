"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="conteudo" className="page narrow">
      <h1>Não foi possível carregar esta página.</h1>
      <p>Tente novamente em alguns instantes.</p>
      <button className="btn btn-primary" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
