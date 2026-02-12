# 🚀 Guia de Início Rápido

## Passos para colocar o sistema no ar

### 1️⃣ Instalar Dependências
```bash
bun install
# ou
npm install
```

### 2️⃣ Configurar Firebase

1. **Criar projeto no Firebase:**
   - Acesse: https://console.firebase.google.com/
   - Clique em "Adicionar projeto"
   - Siga o wizard de criação

2. **Ativar Firestore Database:**
   - Menu lateral → "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha "Iniciar no modo de produção"
   - Selecione a localização: `southamerica-east1` (São Paulo)

3. **Ativar Authentication:**
   - Menu lateral → "Authentication"
   - Clique em "Começar"
   - Ative o provedor "Email/Password"
   - Na aba "Users", clique em "Add user"
   - Crie um usuário de teste (ex: admin@agora.com / senha123)

4. **Obter credenciais:**
   - Ícone de engrenagem → "Configurações do projeto"
   - Role até "Seus apps"
   - Clique em "</>" (Web)
   - Copie as credenciais Firebase

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar .env com suas credenciais Firebase
# Use seu editor preferido:
nano .env
# ou
code .env
```

Preencha com as credenciais obtidas no passo anterior.

### 4️⃣ Configurar Regras do Firestore

**Opção A - Via Console (mais fácil):**
1. Vá em "Firestore Database" → "Regras"
2. Copie e cole o conteúdo de `firestore.rules`
3. Clique em "Publicar"

**Opção B - Via CLI:**
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Fazer login
firebase login

# Inicializar projeto
firebase init firestore

# Deploy das regras e índices
firebase deploy --only firestore:rules,firestore:indexes
```

### 5️⃣ Executar o Projeto

```bash
bun dev
# ou
npm run dev
```

O sistema estará disponível em: **http://localhost:5173**

### 6️⃣ Primeiro Acesso

1. Acesse: http://localhost:5173/login
2. Faça login com o email/senha criado no Firebase
3. Você será redirecionado para o painel admin

### 7️⃣ Criar sua primeira TV

1. No painel admin, vá em "TVs"
2. Clique em "Nova TV"
3. Preencha:
   - Nome: "Recepção"
   - Slug: `recepcao` (gerado automaticamente)
   - Orientação: Horizontal
4. Salve

### 8️⃣ Criar seu primeiro Evento

1. No painel admin, vá em "Eventos"
2. Clique em "Novo Evento"
3. Preencha os dados do evento
4. Selecione em quais TVs ele deve aparecer
5. Salve

### 9️⃣ Visualizar em uma TV

Acesse: **http://localhost:5173/tv/recepcao**

A tela mostrará os eventos da semana para a TV "Recepção"!

## ✅ Checklist Rápido

- [ ] Dependências instaladas
- [ ] Projeto Firebase criado
- [ ] Firestore Database ativado
- [ ] Authentication ativado
- [ ] Usuário criado no Firebase
- [ ] Arquivo .env configurado
- [ ] Regras do Firestore publicadas
- [ ] Projeto rodando localmente
- [ ] Login funcionando
- [ ] TV criada
- [ ] Evento criado
- [ ] Visualização na TV funcionando

## 🆘 Problemas Comuns

### Erro ao fazer login
- ✅ Verifique se o Authentication está ativado
- ✅ Confirme que o provedor Email/Password está habilitado
- ✅ Verifique se o usuário foi criado corretamente

### Dados não aparecem
- ✅ Verifique se as regras do Firestore foram publicadas
- ✅ Confirme que está logado no painel admin
- ✅ Veja o console do navegador (F12) para erros

### Erro de permissão no Firestore
- ✅ Verifique as regras em "Firestore Database" → "Regras"
- ✅ Confirme que está autenticado para escrever dados

## 📚 Documentação Completa

Para mais detalhes, consulte:
- **FIREBASE_SETUP.md** - Guia completo de configuração do Firebase
- **README.md** - Documentação geral do projeto

## 🎉 Pronto!

Seu sistema de sinalização digital está no ar!

Para deploy em produção, consulte a seção de Deploy no README.md
