# Relatorio de testes de regressao

**Data:** 2026-11-09  
**Runtime validado:** Node `v24.22.2` LTS e Yarn Classic `1.22.22`; baseline original observado em Node `v26.13.0`.

## Resultados finais

| Verificacao | Resultado |
| --- | --- |
| Instalacao congelada | `yarn install --frozen-lockfile --ignore-scripts` concluida |
| Jest completo | 41 suites aprovadas; 473 testes aprovados, 11 ignorados; 492 snapshots aprovados |
| Testes multi-canvas | 6 casos aprovados: criacao/isolamento, alternancia, reload, quadro padrao, renomeacao e exclusao |
| Typecheck | `yarn test:typecheck` aprovado em Node 24.22.2 |
| ESLint | `yarn test:code` aprovado em Node 24.22.2; aviso nao fatal: caniuse-lite desatualizado |
| Prettier | `yarn test:other` aprovado em Node 24.22.2 |
| Build | `yarn build` aprovado em Node 24.22.2 |
| Auditoria Yarn | Arvore raiz: 576 ocorrencias/189 IDs (26 criticas, 307 altas, 195 moderadas, 48 baixas); producao: 550 ocorrencias. Nanoid raiz corrigido; demais advisories aguardam remediacao incremental. |

Quatro suites apresentavam snapshots divergentes no baseline. Os snapshots foram atualizados para refletir o fork (canvas padrao, textos e fontes), e quatro comparacoes frageis de ponto flutuante passaram a usar tolerancia numerica. A suite completa passou apos a atualizacao.

## Limites e proximos passos

Os numeros do audit incluem multiplos avisos por dependencia e nao representam vulnerabilidades exploraveis confirmadas. Avaliar dependencias de forma incremental, priorizando producao. Validar integracoes Firebase e telemetria em contas de teste antes de reativar fluxos removidos ou alterar endpoints.
