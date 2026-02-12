# Ágora Signage - Sistema de Sinalização Digital

Sistema de gerenciamento de eventos e sinalização digital para o Ágora Tech Park, utilizando Firebase/Firestore como banco de dados NoSQL.

## 🚀 Tecnologias

- React + TypeScript
- Vite
- Firebase/Firestore (NoSQL Database)
- Firebase Authentication
- Tailwind CSS + shadcn/ui
- date-fns para manipulação de datas

## 📋 Pré-requisitos

- Node.js 18+ ou Bun
- Conta no Firebase (gratuita)

## ⚙️ Configuração

### 1. Configurar Projeto Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto ou use um existente
3. Ative o **Firestore Database**:
   - No menu lateral, vá em "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha "Iniciar no modo de produção" (ou teste)
   - Escolha a localização (ex: southamerica-east1)

4. Ative o **Authentication**:
   - No menu lateral, vá em "Authentication"
   - Clique em "Começar"
   - Ative o provedor "Email/Password"
   - Crie um usuário de teste na aba "Users"

5. Configure as **Regras do Firestore**:
   - Vá em "Firestore Database" > "Regras"
   - Cole as regras abaixo:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Função auxiliar para verificar autenticação
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Coleção de TVs - apenas usuários autenticados podem ler/escrever
    match /tvs/{tvId} {
      allow read: if true; // TVs podem ser lidas publicamente (para exibição)
      allow write: if isAuthenticated();
    }
    
    // Coleção de Eventos - apenas usuários autenticados podem escrever
    match /events/{eventId} {
      allow read: if true; // Eventos podem ser lidos publicamente (para exibição)
      allow write: if isAuthenticated();
    }
    
    // Coleção de Usuários - apenas o próprio usuário pode ler/escrever
    match /users/{userId} {
      allow read, write: if isAuthenticated() && request.auth.uid == userId;
    }
  }
}
```

6. Obtenha as credenciais do projeto:
   - Vá em Configurações do Projeto (ícone de engrenagem)
   - Na aba "Geral", role até "Seus apps"
   - Clique no ícone "</>" para adicionar um app web
   - Registre o app e copie as credenciais do Firebase

### 2. Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` e preencha com suas credenciais do Firebase:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto-id
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_FIREBASE_MEASUREMENT_ID=seu_measurement_id
   ```

### 3. Instalar Dependências e Executar

```bash
# Com Bun (recomendado)
bun install
bun dev

# Ou com npm
npm install
npm run dev
```

O aplicativo estará disponível em `http://localhost:5173`

## 📱 Como Usar

### Painel Administrativo

1. Acesse `http://localhost:5173/login`
2. Faça login com o email/senha criado no Firebase Authentication
3. No painel admin você pode:
   - **Gerenciar TVs**: Criar, editar e remover telas de exibição
   - **Gerenciar Eventos**: Criar, editar e remover eventos
   - Cada TV tem um slug único usado na URL de exibição

### Exibição em TV

1. Para exibir a agenda em uma TV, acesse:
   ```
   http://localhost:5173/tv/[slug-da-tv]
   ```
   
2. Exemplos:
   - `http://localhost:5173/tv/recepcao`
   - `http://localhost:5173/tv/auditorio`
   - `http://localhost:5173/tv/coworking`

3. As atualizações são em **tempo real** via Firestore listeners

## 🗂️ Estrutura do Banco de Dados

### Coleção `tvs`
```typescript
{
  id: string,              // ID único (gerado automaticamente)
  name: string,            // Nome da TV
  slug: string,            // Slug único para URL
  orientation: string,     // "horizontal" | "vertical"
  activeImage?: string,    // Imagem base64 (opcional)
  createdAt: timestamp     // Data de criação
}
```

### Coleção `events`
```typescript
{
  id: string,              // ID único (gerado automaticamente)
  name: string,            // Nome do evento
  location: string,        // Local do evento
  startDateTime: string,   // Data/hora de início (ISO)
  endDateTime: string,     // Data/hora de término (ISO)
  tvIds: string[],         // IDs das TVs onde será exibido
  createdAt: timestamp     // Data de criação
}
```

## 🔒 Segurança

- Autenticação via Firebase Authentication
- Regras de segurança do Firestore impedem escrita não autorizada
- Leitura pública permite que as TVs funcionem sem autenticação
- Credenciais devem ser mantidas seguras no arquivo `.env`
- **Nunca commite o arquivo `.env` no git**

## 🚀 Deploy

### Opção 1: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar projeto
firebase init hosting

# Build e deploy
bun run build
firebase deploy
```

### Opção 2: Vercel/Netlify

1. Conecte seu repositório Git
2. Configure as variáveis de ambiente no painel
3. Deploy automático a cada push

## 📝 Notas Importantes

- O plano Spark (gratuito) do Firebase tem limites:
  - 50.000 leituras/dia
  - 20.000 escritas/dia
  - 1GB de armazenamento
  
- Para uso intensivo, considere upgrade para o plano Blaze (pay-as-you-go)

- As TVs atualizam em tempo real usando Firestore listeners (sem polling)

- O tema claro é forçado nas páginas de TV para melhor visibilidade

## 🐛 Troubleshooting

### Erro: "Firebase: Error (auth/configuration-not-found)"
- Verifique se o Firebase Authentication está habilitado
- Confirme se o provedor Email/Password está ativo

### Erro: "Missing or insufficient permissions"
- Verifique as regras do Firestore
- Confirme que está autenticado para operações de escrita

### Dados não aparecem em tempo real
- Verifique a conexão com internet
- Confirme que as regras de leitura do Firestore estão corretas
- Veja o console do navegador para erros

## 📄 Licença

Desenvolvido para o Ágora Tech Park.
