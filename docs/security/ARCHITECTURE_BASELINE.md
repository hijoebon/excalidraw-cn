# Baseline de arquitetura e fluxos de dados

**Data:** 2026-11-09  
**Repositório:** `marcovanbrain/excalidraw-cn` (fork público)  
**Branch de trabalho:** `security/hardening-excalidraw-cn`

## Visão geral

- Aplicação React 18 e TypeScript 4.9 construída com Create React App / `react-scripts` 5.0.1.
- Build estático (`yarn build`) servido pela Vercel; `vercel.json` define cabeçalhos e redirecionamentos.
- Gerenciador travado em Yarn Classic 1 (`yarn.lock`, formato v1); `.nvmrc`, `package.json` e CI selecionam Node 24 LTS.
- Persistência principal local: `src/excalidraw-app/data/localStorage.ts`, IndexedDB para arquivos binários em `LocalData.ts` e `FileManager.ts`.
- Colaboração em tempo real: Socket.IO Client 2.3.1 e Firestore/Storage (Firebase 8.3.3), com criptografia client-side das cenas e arquivos.

## Multi-canvas e compatibilidade de dados

O quadro ativo é selecionado por `excalidraw_container_name`; a lista fica em `excalidraw_container_list`. Cada quadro armazena elementos em LocalStorage usando o próprio nome como chave. Se a lista ainda não existir, `getContainerListFromStorage()` retorna `default_canvas`. App state, biblioteca, usuário de colaboração e versões de sincronização usam chaves separadas.

Criar um quadro atualiza nome/lista e inicializa sua chave de elementos vazia. Alternar muda o nome ativo e recarrega a aplicação. Renomear transfere os elementos da chave ativa para o novo nome; excluir remove a chave/lista. Os testes acrescentados cobrem isolamento, criação, alternância, persistência, renomeação, exclusão e a chave do quadro padrão sem lista legada.

## Dependências e integrações

| Área | Implementação observada | Exposição |
| --- | --- | --- |
| Interface | React, TypeScript, Ant Design, Canvas/SVG | Importação e renderização de dados controlados pelo usuário |
| Build/testes | CRA 5, Webpack 5, Jest, ESLint, Prettier | Cadeia extensa de dependências transitivas |
| Compartilhamento | endpoints `json.excalidraw.com` e `json-dev.excalidraw.com` | Upload/download de dados cifrados por link |
| Colaboração | `portal.excalidraw.com`, Socket.IO, Firestore e Firebase Storage | Dados cifrados, presença, gravação/leitura anônima por IDs de sala |
| Bibliotecas | `libraries.excalidraw.com` e função Cloud Functions `excalidraw-room-persistence` | Busca/publicação de bibliotecas e arquivos |
| Telemetria | ID do Google Analytics presente no `.env.production`; DSN Sentry fixo no código para domínios `excalidraw.com` e `vercel.app` | Tráfego de analytics/erros para serviços herdados do upstream |
| Estatística externa | iframe oculto para `handraw-server.deno.dev/stastic` em `public/index.html` | Requisição externa em cada carregamento; finalidade/retensão não verificadas |
| Deploy | Vercel, diretório raiz e headers/redirects em `vercel.json` | Segurança HTTP depende também da configuração da conta/domínio |

Os `.env.development` e `.env.production` estão versionados. Foram encontrados endpoints e identificadores públicos de serviço; os nomes das variáveis não indicam credenciais privadas. Os valores reais não são reproduzidos aqui. Foi criado `.env.example` com valores fictícios.

## Persistência remota e confiança

`firebase-project/.firebaserc` aponta para o projeto `excalidraw-room-persistence`. As regras locais permitem `get` e `write` sem autenticação para documentos Firestore e arquivos de salas/share links, mas bloqueiam `list`. O cliente gera IDs de sala aleatórios de 10 bytes e a chave de decifração fica no fragmento da URL. A criptografia reduz exposição do conteúdo, mas não impede escrita/corrupção, abuso de recursos ou acesso se o ID da sala for conhecido.

As regras apontam para serviço upstream e não foram alteradas. Também não foi possível confirmar se a configuração do deploy Vercel usa exatamente o mesmo projeto dos arquivos versionados. A colaboração publicada continua dependente dos serviços do fork original.

## Workflows

Os workflows de PR existentes executam testes, lint e typecheck. Foi acrescentado CodeQL para JavaScript/TypeScript, revisão das mudanças de dependências e Dependabot para Yarn/npm e GitHub Actions. CI de leitura tem `contents: read`; o workflow semântico usa somente `pull-requests: read` e não faz checkout do código do PR.

Foram removidos os workflows herdados `autorelease-preview.yml`, `autorelease-excalidraw.yml`, `publish-docker.yml` e `sentry-production.yml`, que executavam publicacao privilegiada ou codigo de PR com token. Tambem foi removido `cancel.yml`. `build-docker.yml` e `locales-coverage.yml` foram mantidos e atualizados com Actions pinadas por SHA e permissoes explicitas. A remocao foi autorizada pelo mantenedor.

## Baseline de execução

- Runtime: Node `v24.22.2` LTS validado em CI local, suportado pelo Vercel; runtime local original era `v26.13.0`.
- Yarn Classic: `1.22.22`; a instalação com `--frozen-lockfile` concluiu.
- Peer dependency warnings existentes incluem Testing Library 12 com peer React `<18`, embora o projeto use React 18.
- A auditoria completa do lockfile está registrada em [SECURITY_AUDIT.md](SECURITY_AUDIT.md).

## Arquivos de referência

`package.json`, `yarn.lock`, `.nvmrc`, `.env.development`, `.env.production`, `.gitignore`, `vercel.json`, `firebase-project/{.firebaserc,firestore.rules,storage.rules}`, `src/excalidraw-app/data/{index.ts,localStorage.ts,firebase.ts,LocalData.ts}`, `src/excalidraw-app/collab/{Collab.tsx,Portal.tsx}`, `public/index.html` e `.github/workflows/`.
