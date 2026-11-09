# Baseline de regressão

**Data:** 2026-11-09

## Ambiente

- Node local: `v26.13.0`; o projeto fixa `14` em `.nvmrc` e declara `>=14` em `package.json`.
- Yarn Classic usado: `1.22.22`, compatível com `yarn.lock` v1.
- Dependências instaladas com `yarn install --frozen-lockfile`; instalação concluída em aproximadamente 209 s.
- `node_modules` não existia antes da instalação.

## Verificações na árvore antes do hardening funcional

| Verificação | Resultado |
| --- | --- |
| `yarn test:app --watchAll=false` | 37/41 suites passaram; 4 suites falharam; 395 testes passaram, 75 falharam, 11 ignorados; 146 snapshots falharam e 350 passaram |
| Suites com falha | `linearElementEditor.test.tsx`, `contextmenu.test.tsx`, `regressionTests.test.tsx`, `packages/excalidraw.test.tsx` |
| `yarn test:typecheck` | Passou |
| `yarn test:code` | Falhou apenas por warning Prettier no novo teste; corrigido depois |
| `yarn test:other` | Falhou em `README.md` sem alteração local |
| `yarn build` | Build de produção compilou; aviso de `caniuse-lite` desatualizado |
| `yarn audit --groups dependencies` | 1489 dependências na árvore; 558 ocorrências de vulnerabilidade em 191 IDs únicos de advisory antes de resolver o nanoid transitivo |

As falhas de snapshot incluem divergências de textos de interface (`Open`/`Open File`) e valores de estado. Não foi executada uma cópia limpa do commit base em outro worktree; portanto, são falhas observadas na baseline local, sem atribuição causal definitiva.

## Cobertura crítica multi-canvas

O projeto não tinha testes para as funções de persistência multi-canvas. Foi acrescentada cobertura de unidade em `src/excalidraw-app/data/localStorage.test.ts` para criação/isolamento, alternância, retomada após recarga, dados do quadro padrão, renomeação e exclusão. Os testes passaram na execução completa anterior à expansão desses casos; a validação final dos casos expandidos está registrada em [REGRESSION_TEST_REPORT.md](REGRESSION_TEST_REPORT.md).

## Limitações da baseline

- Este registro descreve o baseline inicial em Node 26, antes da migração. A compatibilidade final foi validada em Node 24 LTS; consulte [REGRESSION_TEST_REPORT.md](REGRESSION_TEST_REPORT.md).
- Os testes completos emitem muitos avisos antigos de `ReactDOM.render` com React 18.
- Nenhum teste end-to-end de navegador ou Firebase Emulator existia/foi executado.
