# Deploy Preview PowerFit

## Deploy publico aprovado

URL publica: https://powerfit-app.vercel.app

Status: aprovado para teste do Marcio como demo publica controlada.

Credenciais demo:

- Personal: `marcio.demo@powerfit.local` / `demo123`
- Aluno: `aluno.pro@powerfit.local` / `demo123`

Aviso obrigatorio: nao usar dados reais. O app mostra `Ambiente demo/preview - nao use dados reais.` no fluxo interno e na tela de login.

O que testar no celular:

- Abrir a URL publica no navegador.
- Verificar se a landing carrega.
- Entrar como personal demo e abrir dashboard, alunos, treinos e agenda.
- Sair e entrar como aluno demo.
- Abrir painel do aluno, treino, avaliacao inicial, progresso e recursos PRO demo.
- Conferir se `manifest.json` abre sem 401 e se o PWA oferece instalacao quando o navegador permitir.
- Abrir rota direta, por exemplo `/workouts`, para confirmar fallback SPA.

Limitacoes:

- Demo publica controlada, nao producao final.
- Auth/RLS/Supabase de producao ainda nao estao prontos.
- Pagamento real nao esta conectado.
- Dados demo sao ficticios e locais no navegador.
- Marketplace, lojas e Tinder do personal ficam fora desta entrega.

Proximos passos:

- Enviar URL para Marcio testar no celular.
- Coletar feedback sobre clareza, fluxo, valor percebido e bugs.
- Corrigir pontos pequenos antes de nova rodada.
- Manter producao real bloqueada ate Auth/RLS/pagamento ficarem seguros.

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
