# PowerFit

Aplicação web para personal trainers e alunos, com gestão de alunos, treinos, agenda, evolução física e assistente de IA.

## Desenvolvimento

Requisitos: Node.js 20.19+ (ou 22.12+) e um projeto Supabase.

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` e informe as credenciais públicas do Supabase. `GROQ_API_KEY` é segredo do servidor e deve ser configurado apenas no ambiente de deploy.

O modo de demonstração é opcional e só deve ser habilitado em preview ou desenvolvimento:

```env
VITE_ENABLE_DEMO_MODE=true
```

Nunca habilite essa variável no domínio de produção.

## Banco e autenticação

Antes do primeiro deploy desta versão, execute `supabase_auth_rls_migration.sql` no SQL Editor do Supabase. A migração:

- vincula perfis ao Supabase Auth;
- remove senhas em texto puro das tabelas de perfil;
- ativa RLS com acesso por usuário e por personal responsável;
- cria o fluxo de perfil após cadastro;
- preserva os dados existentes sempre que houver e-mail correspondente.

Depois da migração, usuários antigos que ainda não tenham uma conta no Supabase Auth devem cadastrar a mesma conta de e-mail ou usar “Esqueci minha senha”.

## Verificação de entrega

```bash
npm run check
npm audit
```

O pagamento automático está desabilitado de forma segura nesta versão. Os planos são apresentados como piloto e a ativação deve ser feita pelo responsável até existir uma integração de pagamento validada no servidor.

## Deploy

Configure no provedor:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GROQ_API_KEY` (somente servidor)

Revise também no Supabase Auth a URL pública e as URLs permitidas de redirecionamento, incluindo `/reset-password`.
