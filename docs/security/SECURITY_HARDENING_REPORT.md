# Relatorio de hardening

## Resumo

Hardening aplicado na branch `security/hardening-excalidraw-cn`. Nao houve push, merge, deploy, alteracao de regras remotas Firebase, URL de servico ou segredos.

## Correcoes aplicadas

1. **Headers Vercel:** removido `Feature-Policy: *`; adicionados `Permissions-Policy` minimo, `X-Frame-Options: SAMEORIGIN` e `Referrer-Policy` restritivo.
2. **Dependencia direta:** `nanoid` atualizado de 3.3.3 para 3.3.18 e resolucao raiz fixada para corrigir advisories dessas versoes.
3. **Regressao multi-canvas:** seis testes para isolamento, criacao, alternancia, reload, renomeacao, exclusao e compatibilidade com quadro padrao.
4. **CI:** permissoes minimas, concorrencia por PR e Actions pinadas por SHA nos workflows mantidos.
5. **DevSecOps:** workflows de CodeQL e Dependency Review e configuracao semanal do Dependabot.
6. **Runtime:** `.nvmrc`, `engines` e CI migrados para Node 24 LTS, suportado pelo Vercel.
7. **Reducao de risco em release:** removidos workflows herdados de autorelease, publicacao de pacote/imagem e release Sentry privilegiados. Mantidos build Docker e cobertura de traducoes com Actions pinadas e permissoes explicitas.
8. **Ambiente:** `.env.example` com valores ficticios; arquivos `.env` versionados nao foram alterados.
9. **Snapshots:** atualizados para refletir o estado atual do fork; comparacoes numericas de geometria usam tolerancia.

## Validacao

Em Node 24.22.2: Jest completo aprovado (41 suites, 473 testes, 11 ignorados, 492 snapshots); `yarn test:code`, `yarn test:typecheck`, `yarn test:other` e `yarn build` aprovados. A varredura local por padroes comuns de tokens/chaves privadas nao encontrou ocorrencias; nao examina o historico Git. Veja [REGRESSION_TEST_REPORT.md](REGRESSION_TEST_REPORT.md).

## Risco residual

O lockfile ainda contem muitos avisos de auditoria, inclusive na arvore de producao. As regras Firebase upstream permitem leitura por ID conhecido e escrita anonima; ficaram intactas por serem servico remoto usado pela colaboracao. Google Analytics, Sentry e iframe de estatistica herdados continuam integrados. Revisar credenciais/configuracoes da conta GitHub e Vercel separadamente. Os workflows de publicacao removidos precisam de substituto seguro antes de retomar releases automatizadas.
