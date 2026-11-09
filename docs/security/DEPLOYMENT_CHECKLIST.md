# Checklist de deploy seguro

## Antes de publicar

- [x] Workflows herdados de release/publicacao privilegiada removidos; usar substituto seguro antes de retomar publicacoes automatizadas.
- [ ] Confirmar que o projeto Firebase/Socket.IO/JSON/library configurado para Vercel pertence ao mantenedor; definir regras e quotas próprias antes de migrar.
- [ ] Configurar Analytics/Sentry apenas com IDs e DSNs pertencentes ao deploy. Confirmar a finalidade do iframe de estatística em `public/index.html`.
- [x] Definir Node 24 LTS em `.nvmrc`, `engines` e CI; build e testes locais passaram no runtime escolhido.
- [ ] Verificar no GitHub Secret Scanning, push protection, Dependabot alerts e CodeQL para o repositório público. O estado das opções não foi confirmado nesta auditoria.
- [ ] Revisar todos os alerts de dependência, priorizando pacote, caminho de produção e versão corrigida; não usar atualização em massa.
- [ ] Executar instalação frozen, lint, typecheck, testes, audit e build no commit candidato.
- [ ] Validar em preview Vercel os cabeçalhos, fontes, PWA, import/export, colaboração, WebSocket e duas ou mais canvases com dados persistidos.
- [ ] Confirmar políticas de retenção e privacidade dos serviços externos e atualizar documentação pública.

## Publicação e pós-deploy

- [ ] Fazer deploy primeiro em preview; conferir logs sem expor valores de ambiente.
- [ ] Confirmar nos DevTools os headers de segurança e requisições externas esperadas.
- [ ] Confirmar que desenhos antigos e a lista de canvases permanecem disponíveis.
- [ ] Só promover a produção após revisão humana; esta alteração não fez deploy.

## Rollback

1. Reverter o commit de hardening ou aplicar `git revert` na branch publicada.
2. Para headers, restaurar a versão anterior de `vercel.json` e redeployar a revisão conhecida.
3. Para `nanoid`, reverter manifest e lockfile juntos; mantenha a versão corrigida recomendada quando possível.
4. Restaurar workflows removidos apenas após revisar a exposição dos tokens; não reativar fluxo que execute código não confiável com secrets.
5. Nenhuma migração de LocalStorage/Firebase foi feita; não há rollback de dados necessário.
