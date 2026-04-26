# TROPA RANK

Site React/Vite com login real usando Supabase Auth, banco no Supabase e ranking atualizado rapidamente com Supabase Realtime.

## Como configurar

1. Crie um projeto em https://supabase.com
2. Vá em **SQL Editor** e rode o arquivo `supabase-schema.sql`.
3. Vá em **Project Settings > API** e copie:
   - Project URL
   - anon public key
4. Crie um arquivo `.env` na raiz baseado no `.env.example`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_AQUI
```

5. Instale e rode:

```bash
npm install
npm run dev
```

## Deploy

Pode subir no Lovable, Vercel ou Netlify. Configure as mesmas variáveis de ambiente no painel do deploy.

## O que já tem

- Login/cadastro por usuário com Supabase Auth
- Perfil de usuário
- Cadastro de bets com valor, odd, mercado, resultado e tipo de bilhete
- Ranking por score, lucro, ROI, green/red e winrate
- Atualização em tempo real via Supabase Realtime
- Animação da bola de futebol na home
