# Ágora Signage - Sistema de Sinalização Digital

Sistema de gerenciamento de eventos e sinalização digital para o Ágora Tech Park.

## 🎯 Funcionalidades

- 📺 Gerenciamento de TVs/Telas de exibição
- 📅 Gestão de eventos e cronogramas
- 🔄 Atualizações em tempo real via Firebase
- 🔐 Autenticação segura
- 📱 Layout responsivo com orientação horizontal/vertical
- 🎨 Tema claro/escuro (admin) e tema claro fixo (TVs)

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Banco de Dados**: Firebase Firestore (NoSQL)
- **Autenticação**: Firebase Authentication
- **UI**: Tailwind CSS + shadcn/ui
- **Gerenciamento de Estado**: React Hooks + Context
- **Datas**: date-fns

## 📋 Configuração Rápida

### 1. Clone e instale dependências

```sh
# Clone o repositório
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Instale dependências (com Bun ou npm)
bun install
# ou
npm install
```

### 2. Configure o Firebase

**📖 Para instruções detalhadas, consulte [FIREBASE_SETUP.md](FIREBASE_SETUP.md)**

Resumo rápido:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative Firestore Database e Authentication (Email/Password)
3. Copie `.env.example` para `.env` e preencha com suas credenciais
4. (Opcional) Deploy das regras: `firebase deploy --only firestore:rules,firestore:indexes`

### 3. Execute o projeto

```sh
# Desenvolvimento
bun dev
# ou
npm run dev

# Build para produção
bun run build
# ou
npm run build
```

## 🎮 Como Usar

### Painel Administrativo

1. Acesse `/login` e faça login com suas credenciais do Firebase
2. Gerencie TVs em `/admin/tvs`
3. Gerencie eventos em `/admin/events`

### Visualização em TVs

Acesse `/tv/[slug-da-tv]` em um navegador para exibir a agenda na TV.

Exemplo: `/tv/recepcao`, `/tv/auditorio`

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes React
│   ├── admin/       # Componentes do painel admin
│   ├── tv/          # Componentes de exibição TV
│   └── ui/          # Componentes UI (shadcn)
├── hooks/           # Custom React Hooks
├── layouts/         # Layouts (AdminLayout)
├── lib/             # Utilitários e serviços
│   ├── firebase.ts  # Configuração Firebase
│   └── db.ts        # Operações do Firestore
├── pages/           # Páginas da aplicação
├── types/           # TypeScript types
└── main.tsx         # Entry point
```

## 🔒 Segurança

- Autenticação via Firebase Authentication
- Regras de segurança do Firestore protegem escrita não autorizada
- Variáveis de ambiente não são commitadas (`.env` no `.gitignore`)
- Leitura pública permite funcionamento das TVs sem autenticação

## 📦 Deploy

### Firebase Hosting (Recomendado)

```sh
npm install -g firebase-tools
firebase login
firebase init hosting
bun run build
firebase deploy
```

### Vercel/Netlify

1. Conecte seu repositório
2. Configure as variáveis de ambiente
3. Deploy automático

## 📄 Arquivos de Configuração

- `firestore.rules` - Regras de segurança do Firestore
- `firestore.indexes.json` - Índices para queries otimizadas
- `.env.example` - Template de variáveis de ambiente
- `FIREBASE_SETUP.md` - Guia completo de configuração

## 🛠️ Tecnologias Utilizadas

- **Vite** - Build tool e dev server
- **TypeScript** - Type safety
- **React 18** - UI framework
- **Firebase** - Backend as a Service
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling
- **React Router** - Navegação
- **date-fns** - Manipulação de datas
- **Sonner** - Toast notifications

## 📝 Licença

Desenvolvido para o Ágora Tech Park.

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
