# Importação municipal — plano anterior à produção

Lote aprovado: **1.914 candidatos**, apenas camada **Árvore (3)** e códigos **16, 36, 118, 119, 166, 175, 176, 306**. Plantio (4) e ipê-de-jardim (3) não entram.

**Execução concluída:** os 1.914 candidatos foram importados após apresentação da simulação. Ver [resultado e verificações em produção](EXECUCAO_IMPORTACAO.md). A reexecução do mesmo lote retornou **0 inserts, 0 updates**, sem gravações.

O script [prefeitura-goiania.mjs](../../scripts/importacao/prefeitura-goiania.mjs) possui três etapas, executadas na raiz do projeto com Node 22:

```powershell
node scripts/importacao/prefeitura-goiania.mjs --prepare
node scripts/importacao/prefeitura-goiania.mjs --plan
```

`--prepare` consulta somente os candidatos autorizados, em páginas de 500 e intervalo mínimo de 500ms. Preserva respostas originais, horários, hashes, atributos e geometria ArcGIS em EPSG:31982; solicita separadamente a transformação EPSG:4326 ao mesmo serviço. Revalida total e contagens por código contra o relatório aprovado. Divergências interrompem a preparação. Não há consulta à camada Plantio.

`--plan` consulta o Supabase em transação **READ ONLY**, sem aplicar migration ou inserir dados. O plano fica em `.local-data/importacao-prefeitura/plano.json`, com inserts, updates, registros sem alteração, conflitos de chave, pontos fora do limite original e proximidades até 10m. O snapshot e atributos brutos ficam nessa pasta ignorada pelo Git. Nenhuma chave ou senha aparece nos artefatos. A simulação inclui o hash da migration, do lote e do estado atual do banco.

Após revisão e aprovação explícita do plano apresentado, a execução é:

```powershell
node scripts/importacao/prefeitura-goiania.mjs --apply --approved-plan HASH_DO_PLANO_APROVADO
```

O hash é obrigatório. Antes de escrever, o script recalcula a simulação; alterações no lote, migration ou estado do banco exigem novo plano. Conflitos de chave ou pontos fora do município bloqueiam a execução. Proximidade é alerta, não deduplicação automática: dois pontos próximos podem representar árvores distintas. A operação é transacional, com lock e isolamento SERIALIZABLE; aplica a migration nova e o lote juntos, registrando checksum no ledger. Não modifica migrations já aplicadas. Falhas causam rollback.

Se o lote já estiver integralmente importado com o mesmo conteúdo e a mesma versão do importador/migration, repetir `--apply` com a aprovação original retorna **0 inserts, 0 updates**, sem gravar no banco. Mudanças comunitárias posteriores são preservadas. A aprovação também vincula o código do importador e seu SQL ao plano.

## Identidade e preservação histórica

A chave única é **fonte + dataset + layer + OBJECTID**, com `PREFEITURA_GOIANIA`, `MAPA_MEIO_AMBIENTE`, `ARVORE`. Cada candidato tem UUID determinístico e código público `GYN-MUN-OBJECTID`. A chave autoritativa permanece a proveniência, não a distância nem o nome da espécie.

`privado.cadastros_municipais` guarda o vínculo à árvore, código, descrições municipais sem modernização botânica, geometria Point/EPSG:31982, JSON ArcGIS original, todos os atributos brutos, hash e data de consulta. `privado.cadastros_municipais_versoes` guarda snapshots imutáveis de cada conteúdo diferente. Triggers impedem apagar ou trocar a origem; o vínculo tem foreign key com DELETE RESTRICT. O frontend recebe uma proveniência resumida, sem os atributos brutos completos ou identificadores técnicos de funcionários.

Reexecuções sem mudança de conteúdo não alteram registros nem criam novas versões. Mudança de fonte exige um plano novo e cria uma versão histórica. Atualizações municipais preservam cor, localização, status e histórico comunitários já verificados. Nunca substituem fotos ou observações existentes.

## Cadastro e verificação são separados

Na importação: `status=PENDENTE`, `confianca=D`, `status_validacao=CADASTRO_PUBLICO`, `status_verificacao_comunitaria=NAO_VERIFICADA`. A visibilidade pública específica do cadastro permite mostrar o candidato sem observações aprovadas; não equivale a aprovação comunitária. Nenhuma observação, fotografia ou estado de floração é criado.

`cor_cadastral` conserva o tipo cadastral: amarelo; rosa/roxo agrupados para os filtros existentes; branco; ou não informado para caraíba. O nome/código municipal e o nome científico original preservam as categorias específicas. Essa cor não é floração atual. `cor_principal` começa com a classificação cadastral e pode receber a classificação de uma observação moderada; `cor_cadastral` e a origem histórica permanecem.

Uma associação municipal exige **até 10m**, tanto no envio quanto na moderação no servidor. O participante escolhe entre candidatos próximos; não existe associação automática por proximidade. Observações novas exigem foto e permanecem pendentes. Ao aprovar uma observação com fotografia, adiciona-se `VERIFICADA_FOTOGRAFICAMENTE` e o horário da verificação comunitária, mantendo `CADASTRO_PUBLICO` e toda a proveniência. Foto histórica aprovada não prova existência atual; confiança, data e origem da observação continuam explícitas. Floração recente depende exclusivamente de observação aprovada dos últimos sete dias.

A interface mostra marcador menor, translúcido e com contorno escuro para candidatos municipais ainda não verificados, legenda, selo **“Cadastro municipal — existência atual não verificada”** e CTA **“Confirmar esta árvore”**. Após aprovação fotográfica, o selo informa a verificação comunitária e mantém a identificação da origem municipal. A ficha conserva fonte, dataset, layer e OBJECTID, além de explicar a cor cadastral.

O mapa pagina o viewport em lotes de 500, até 5.000 pontos, para incluir todos os 1.914 candidatos na visão ampla. A ordenação do servidor inclui o UUID como desempate. Nenhuma alteração foi necessária no limite de cada resposta.

## Validação e execução

Testes cobrem publicação sem foto fictícia, ausência de floração, distância de associação, conservação da origem/cor após aprovação, criação de árvore diferente sem clonagem de origem municipal, rejeição de código não autorizado, chave determinística e reexecução sem inserts/updates. As migrations passam pelo parser PostgreSQL e as funções pelo parser PL/pgSQL. Nesta execução, a migration e o lote também foram aplicados transacionalmente no Supabase com PostGIS, com verificação READ ONLY posterior e validação pela API anônima.

Antes de executar novos lotes: conferir o plano concreto apresentado, revisar alertas de proximidade e guardar o snapshot/relatório de forma segura. O script de aplicação não é executado automaticamente pela preparação ou pela simulação. Na aplicação autorizada, todos os comandos rodam em uma única transação, com verificações anteriores ao commit e rollback se algum passo falhar.
