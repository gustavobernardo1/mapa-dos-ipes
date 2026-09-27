import type { Metadata } from "next";
export const metadata: Metadata = { title: "Privacidade" };
export default function Page() {
  return (
    <main id="conteudo" className="page narrow prose">
      <span className="eyebrow">TRANSPARÊNCIA NO REGISTRO</span>
      <h1>Privacidade</h1>
      <div className="notice editorial">
        <strong>Minuta para revisão final antes da publicação.</strong>
        <p>
          O responsável pelo projeto deve revisar este texto, definir o contato
          e as regras de retenção e uso antes de receber contribuições em
          produção.
        </p>
      </div>
      <h2>O que coletamos</h2>
      <p>
        Fotografia da árvore, data informada, localização da árvore, cor, estado
        da floração, identificação provável e comentário opcional. O nome
        público é opcional. Não é necessário criar conta para contribuir.
      </p>
      <h2>Localização e fotografias</h2>
      <p>
        O navegador solicita sua permissão para usar o GPS. Você também pode
        indicar um ponto manual. Confira se o ponto representa a árvore e evite
        compartilhar dados pessoais, rostos, placas ou detalhes de locais
        privados.
      </p>
      <p>
        Quando presentes, guardamos apenas data e coordenadas relevantes do EXIF
        para revisão privada. As imagens publicadas são redimensionadas e têm
        seus metadados removidos. A foto original não é armazenada.
      </p>
      <h2>O que fica público</h2>
      <p>
        Após moderação: foto, ponto da árvore, data, cor, floração, confiança,
        comentário e nome público informado. Registros pendentes e rejeitados
        não aparecem na galeria nem no mapa público. O projeto não publica seu
        IP nem os metadados EXIF privados.
      </p>
      <h2>Ciência cidadã e pesquisa</h2>
      <p>
        Registros poderão ser avaliados para uso acadêmico futuro, inclusive
        estudos de séries temporais de satélite. Publicação comunitária não
        significa validação científica. A política de licenciamento e
        compartilhamento do dataset precisa ser definida antes de sua
        distribuição.
      </p>
      <h2>Segurança e retenção</h2>
      <p>
        O servidor aplica limites de envio. Em produção, uma chave derivada do
        endereço de rede é mantida por até uma hora para esse controle. A
        infraestrutura de hospedagem pode manter logs segundo suas próprias
        configurações. As contas administrativas usam autenticação e acesso
        restrito.
      </p>
      <p>
        Os registros são mantidos para compor o histórico. Prazos de retenção e
        procedimentos de remoção devem ser definidos e documentados pelo
        responsável antes do lançamento.
      </p>
      <h2>Contato e pedidos de remoção</h2>
      <p>
        Canal de contato ainda não configurado. O lançamento público depende de
        definir um responsável e publicar aqui um contato funcional para
        dúvidas, correções e pedidos sobre dados e fotografias.
      </p>
    </main>
  );
}
