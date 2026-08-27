# Belook

Gestor de estoque, custos, produção e vendas para pequenas marcas de roupa. PWA mobile-first construído com React + TypeScript + Vite + Firebase.

## Setup

```bash
npm install
cp .env.example .env   # preencha com as credenciais do seu projeto Firebase
npm run dev
```

## Scripts

- `npm run dev` — servidor de desenvolvimento
- `npm run build` — typecheck + build de produção (`dist/`)
- `npm run preview` — serve o build de produção localmente
- `node scripts/generate-icons.mjs` — regera os ícones PWA a partir de `scripts/logo-source.svg`

## Firebase

O app usa Authentication (e-mail/senha), Firestore e Storage diretamente do frontend — sem backend próprio.

Para publicar as regras de segurança do Firestore:

```bash
npx firebase-tools deploy --only firestore:rules
```

Veja `firestore.rules` para o modelo de segurança (isolamento por `businessId`).

## Estrutura

```
src/
  components/   componentes visuais reutilizáveis
  pages/        telas
  layouts/      esqueleto de navegação (bottom nav, etc.)
  services/     acesso ao Firestore/Storage
  hooks/        hooks compartilhados
  contexts/     contexto de autenticação
  types/        tipos de domínio
  utils/        formatação, cálculos
  firebase/     inicialização do Firebase e tratamento de erros
```
