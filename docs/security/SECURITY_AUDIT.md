# Auditoria de segurança

**Data:** 2026-11-09  
**Escopo:** revisão estática do fork local, dependências pelo registry npm, workflows, configuração Vercel e persistência. Não houve teste contra a aplicação pública nem infraestrutura externa.

## Achados confirmados

### S1 — Workflow de comentário executava código não confiável com token npm (mitigado na branch)

**Severidade:** Crítica.  
O fluxo perigoso em `.github/workflows/autorelease-preview.yml` executava codigo do PR com `NPM_TOKEN` disponivel e PAT para comentar, permitindo exfiltracao por um PR malicioso. A mitigacao na branch removeu esse workflow e os demais workflows herdados de publicacao/release privilegiada. Credenciais e configuracoes externas da conta permanecem fora do escopo deste repositorio.

### S2 — Regras Firebase permitem leitura/escrita anônima

**Severidade:** Alta, probabilidade dependente de exposição do ID de sala.  
`firebase-project/firestore.rules` permite `get`/`write` para qualquer documento, e `storage.rules` permite `get`/`write` em arquivos de salas/share links. Listagem está bloqueada. A aplicação cifra cenas/arquivos e usa IDs aleatórios, mas isso não impede corrupção de conteúdo ou abuso de quota se IDs forem conhecidos. Os arquivos apontam para um projeto Firebase upstream; nenhuma regra remota/local foi alterada.

### S3 — Dependências com advisories conhecidos

**Severidade:** Alta/crítica no inventário; explorabilidade depende do caminho/runtime.  
Depois de resolver `nanoid` em todas as dependências da árvore raiz, `yarn audit` reportou 576 ocorrências em 1582 dependências e 189 IDs únicos: 26 críticas, 307 altas, 195 moderadas e 48 baixas. O grupo de dependências de produção sozinho reportou 550 ocorrências em 1488 dependências. Os lockfiles isolados também foram auditados: `src/packages/excalidraw` reportou 155 ocorrências/110 IDs; `src/packages/utils`, 63/38; `dev-docs`, 1109/173. Esses números contam pacotes/caminhos em árvores antigas, não vulnerabilidades exploráveis distintas. Pacotes representativos incluem `xmlhttprequest-ssl`, `protobufjs`, `@babel/traverse`, `form-data`, `proxy-addr`, `shell-quote`, `ws`, `node-forge`, `brace-expansion` e `nanoid` nos lockfiles auxiliares.

`nanoid` direto estava em 3.3.3 e uma resolução transitiva em 3.3.6; o registry indica correções de advisories a partir de 3.3.18. Manifest e lockfile da árvore principal foram atualizados e o audit raiz não reporta mais advisories de nanoid. Os restantes advisories não foram atualizados em massa: muitos pertencem a ferramentas de build/dev ou podem exigir mudanças semver maiores e compatibilidade com serviços externos. Precisam de triagem por caminho, alcance no bundle de produção e versão corrigida.

### S4 — Runtime legado e Actions antigas (mitigado na branch)

**Severidade:** Média/alta para manutenção e supply chain.  
O baseline usava Node 14 e Actions referenciadas por tags antigas. `.nvmrc`, `engines` e CI agora usam Node 24 LTS, compativel com Vercel; workflows remanescentes usam Actions pinadas por SHA. Lint, typecheck, Prettier, build e Jest completo foram validados em Node 24.22.2.

### S5 — Headers Vercel insuficientes

**Severidade:** Média.  
`vercel.json` definia `Feature-Policy: *` (legado) e não tinha proteção contra framing. `Referrer-Policy: origin` já evitava enviar o path em cross-origin e foi atualizado para `strict-origin-when-cross-origin`. A configuração passou a restringir câmera/microfone/geolocalização/pagamentos/USB e permitir framing somente same-origin.

### S6 — Dados e telemetria ainda apontam ao upstream

**Severidade:** Média, impacto de privacidade/configuração.  
Os `.env` versionados apontam para endpoints Excalidraw de JSON, portal, bibliotecas e Cloud Functions; `.env.production` configura Google Analytics. `src/excalidraw-app/sentry.ts` usa DSN fixo upstream para hosts `excalidraw.com` e `vercel.app`. `public/index.html` carrega iframe oculto de `handraw-server.deno.dev/stastic`. A propriedade/retensão desses serviços e o projeto Firebase usado pelo deploy não foram confirmados. As integrações não foram trocadas sem autorização do mantenedor.

### S7 — CORS amplo em assets estáticos

`Access-Control-Allow-Origin: *` é aplicado a todas as respostas Vercel. Não foi classificado isoladamente como vulnerabilidade: os assets são públicos e não foi encontrada API autenticada servida pelo mesmo deployment. A regra foi preservada.

## Riscos não confirmados

- Uma CSP estrita não foi aplicada: `public/index.html` contém scripts/estilos inline, Analytics condicional, iframe externo, fontes e a aplicação conecta a múltiplos endpoints, Firebase e WebSocket. É necessário inventário/nonce/hash e teste de produção antes de endurecer.
- Não foram observadas inserções de HTML arbitrário de dados importados; `innerHTML` recebe SVG produzido pelo renderizador local. Importação de SVG e desserialização merecem fuzzing/testes direcionados em etapa própria.
- Não foi confirmado que o deployment público usa o mesmo Firebase project ID das regras locais.
- Segredos não foram identificados por nomes de variáveis nos `.env`; Firebase web config/Analytics IDs são identificadores públicos, não credenciais administrativas. A varredura local é limitada a padrões conhecidos e não analisa histórico Git.

## Validação externa

Não foram consultados headers do site público, executados testes ativos no Firebase/Socket.IO, nem acessados dados de alertas do GitHub. Nenhuma credencial ou valor de `.env` é reproduzido neste relatório.
