# Deploy Preview PowerFit

## Objetivo

Publicar um preview testavel do PowerFit em Vercel sem transformar a demo em producao.

## Antes do deploy

- Manter dados reais fora do preview.
- Confirmar que `npm run build` passa localmente.
- Confirmar que `vercel.json` preserva `/api/*` e aplica fallback SPA para rotas React.
- Usar variaveis server-side somente no painel da Vercel, sem prefixo `VITE_`, para segredos como `GROQ_API_KEY`.
- Nao configurar pagamento real, Auth/RLS de producao ou marketplace nesta fase.

## Depois do deploy

- Abrir a URL `*.vercel.app` em desktop e celular.
- Testar rota direta, por exemplo `/workouts`, para validar fallback SPA.
- Conferir `manifest.json`, icone PWA e instalacao no Android Chrome.
- Importar backup demo somente se necessario para apresentacao.
- Validar login personal/aluno demo, treino, avaliacao inicial e rascunho de treino.
- Confirmar que o aviso `Ambiente demo/preview - nao use dados reais.` aparece no app interno.

## Limites do preview

- Ambiente demonstrativo, nao producao.
- Dados locais e backup demo continuam sendo parte do fluxo.
- Pagamento real, lojas, Tinder do personal e Auth/RLS de producao ficam fora da Fase 2.1.
