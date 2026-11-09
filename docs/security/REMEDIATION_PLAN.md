# Plano de remediação

| Prioridade | Ação | Estado | Dependência/risco |
| --- | --- | --- | --- |
| P0 | Remover workflow de preview que executa codigo do PR com `NPM_TOKEN` e PAT | Concluido nesta branch (workflow removido) | Requer substituto seguro se previews automatizados forem retomados |
| P0 | Remover workflows privilegiados de publicacao npm, Docker oficial e Sentry herdados | Concluido nesta branch (workflows removidos) | Requer substituto seguro antes de retomar releases automatizadas |
| P1 | Criar projeto Firebase próprio, regras com autorização/limites e validar via Emulator | Pendente de desenho/aprovação | Serviço externo; pode afetar colaboração e salas existentes |
| P1 | Triar e atualizar dependências por advisory, começando por caminhos usados em produção | Em andamento; nanoid 3.3.18 aplicado | Atualizações restantes podem exigir compatibilidade/breaking changes |
| P1 | Migrar Node 14 para runtime suportado em `.nvmrc`, `engines`, CI e Vercel | Concluido na branch: Node 24 LTS; testes locais aprovados | Confirmar configuracao da conta Vercel no proximo deploy |
| P1 | Ativar/verificar Secret Scanning e push protection no GitHub e revisar histórico | Configuração pendente de mantenedor | Revisão de settings não foi exposta pela conexão GitHub |
| P2 | Confirmar propriedade/necessidade de Analytics, Sentry, iframe de estatística e endpoints upstream | Pendente | Alteração de destinos externos exige autorização e projeto/config próprios |
| P2 | Implementar CSP em modo report-only, inventariar domínios e depois aplicar política | Pendente | Inline scripts/styles e colaboração podem regredir sem nonce/hash |
| P2 | Verificar HSTS e headers efetivamente servidos por preview Vercel | Pendente | Requer validação read-only do deployment escolhido pelo mantenedor |
| P2 | Adicionar testes de UI/E2E para fluxos completos de canvas e import/export | Parcial | Cobertura adicionada às funções LocalStorage; fluxos visuais ainda não cobertos |

## Decisão para dependências

Não aplicar `yarn audit fix` indiscriminadamente. Primeiro classificar cada advisory por pacote, cadeia de dependência, inclusão no bundle de produção, entrada controlável pelo usuário e versão corrigida. Atualizar patch/minor compatível em commit isolado; para majors, preparar migração e repetir testes de canvas, colaboração e importação/exportação.
