# 🚀 Guia Completo de Configuração - CO2 Brasil Manager v2.0

Este é o guia definitivo para configurar o sistema CO2 Brasil Manager do zero com o novo schema otimizado.

## 📋 Pré-requisitos

- **Node.js**: Versão 18 ou superior
- **Conta Supabase**: Gratuita em [supabase.com](https://supabase.com)
- **Editor de código**: VS Code ou similar

---

## 🔧 1. Configuração do Projeto Supabase

### 1.1. Criar Novo Projeto

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New project"**
3. Escolha sua organização
4. Configure:
   - **Name**: `co2-brasil-manager` (ou nome de sua preferência)
   - **Database Password**: Gere uma senha forte e **SALVE-A**
   - **Region**: Escolha a região mais próxima (South America para Brasil)
5. Clique em **"Create new project"**
6. Aguarde a criação (pode levar 2-3 minutos)

### 1.2. Executar o Schema Otimizado

1. No painel do Supabase, vá em **SQL Editor** (no menu lateral)
2. Clique em **"+ New query"**
3. **Copie TODO o conteúdo** do arquivo `schema.sql` da raiz do projeto
4. **Cole no editor SQL**
5. Clique em **"RUN"** (Ctrl/Cmd + Enter)
6. ✅ Aguarde a execução - deve mostrar "Success. No rows returned"

> **🎉 Pronto!** O schema foi criado com:
> - ✅ Todas as tabelas e relações
> - ✅ Índices de performance
> - ✅ Funções utilitárias
> - ✅ Triggers automáticos
> - ✅ Políticas de segurança (RLS)
> - ✅ Buckets de storage configurados
> - ✅ Dados iniciais (categorias e configurações)

---

## 🔑 2. Obter Chaves de API

1. No menu lateral, vá em **Settings** → **API**
2. Na seção **Project URL**, copie a URL
3. Na seção **Project API Keys**, você precisa de:
   - **`anon` `public`**: Clique em "Copy" (chave pública)
   - **`service_role` `secret`**: Clique em "Reveal" e depois "Copy" (chave privada)

> ⚠️ **IMPORTANTE**: A chave `service_role` é **SECRETA** - nunca a exponha publicamente!

---

## 🌍 3. Configuração do Ambiente Local

### 3.1. Clonar/Configurar o Projeto

```bash
# Se ainda não tem o projeto
git clone [seu-repositorio]
cd co2-brasil-manager

# Instalar dependências
npm install
```

### 3.2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ[SUA-CHAVE-ANON-AQUI]
SUPABASE_SERVICE_ROLE_KEY=eyJ[SUA-CHAVE-SERVICE-ROLE-AQUI]

# Google AI (opcional - para funcionalidade de IA)
GOOGLE_GENERATIVE_AI_API_KEY=AIza[SUA-CHAVE-GOOGLE-AI]
```

### 3.3. Testar a Conexão

```bash
# Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:9002](http://localhost:9002)

---

## 👤 4. Criar o Primeiro Usuário Administrador

### 4.1. Registrar via Interface de Autenticação

**Método 1: Via Painel Supabase (Recomendado)**
1. No Supabase, vá em **Authentication** → **Users**
2. Clique em **"Add user"**
3. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: senha-forte
   - **Email Confirm**: ✅ marque esta opção
4. Clique em **"Create user"**

**Método 2: Via Aplicação**
1. Acesse a aplicação em [http://localhost:9002](http://localhost:9002)
2. Será redirecionado para `/login`
3. Use a interface de registro (se disponível)

### 4.2. Promover para Administrador

1. No Supabase, vá em **Table Editor**
2. Selecione a tabela **`users`**
3. Encontre o usuário recém-criado
4. Clique duas vezes no campo **`role`**
5. Mude de `CONSULTANT` para `ADMIN`
6. Pressione **Enter** para salvar

> ✅ **Pronto!** Agora você tem acesso total ao sistema.

---

## 🗂️ 5. Verificar Configuração de Storage

Os buckets já foram criados automaticamente pelo schema, mas vamos verificar:

### 5.1. Verificar Buckets

1. No Supabase, vá em **Storage**
2. Você deve ver 3 buckets:
   - 📁 **products** (público)
   - 📁 **orders** (público)  
   - 📁 **invoices** (privado)

### 5.2. Configurações dos Buckets

| Bucket | Público | Tamanho Max | Tipos Permitidos |
|--------|---------|-------------|------------------|
| `products` | ✅ Sim | 50MB | Imagens (JPEG, PNG, WebP, GIF) |
| `orders` | ✅ Sim | 50MB | Imagens (JPEG, PNG, WebP, GIF) |
| `invoices` | ❌ Não | 50MB | Imagens + PDFs |

> **Nota**: As políticas de acesso já foram configuradas automaticamente!

---

## 🎯 6. Funcionalidades Incluídas no Novo Schema

### ✨ **Melhorias Implementadas**

1. **📊 Performance Otimizada**
   - Índices estratégicos em todas as consultas frequentes
   - Campos calculados automáticos (total_price)
   - Triggers para atualização automática de timestamps

2. **🔒 Segurança Avançada**
   - Políticas RLS mais granulares e seguras
   - Logs de atividade detalhados
   - Verificações de integridade de dados

3. **📈 Recursos Adicionais**
   - Sistema de configurações globais
   - Controle de estoque básico
   - Priorização de pedidos
   - Campos de endereço expandidos
   - Rastreamento de entrega

4. **🤖 Automações**
   - Cálculo automático de totais
   - Snapshots de nomes de produtos
   - Logs automáticos de atividades
   - Atualização de timestamps

### 🗃️ **Novas Tabelas**

- **`system_settings`**: Configurações globais do sistema
- **`activity_logs`**: Log detalhado de todas as atividades

### 🔧 **Campos Adicionais**

**Products:**
- `sku`, `weight`, `dimensions`
- `stock_quantity`, `min_stock_level`
- `created_at`, `updated_at`

**Orders:**
- `customer_city`, `customer_state`
- `total_amount` (calculado automaticamente)
- `estimated_delivery_date`, `actual_delivery_date`
- `priority` (1-5), `assembler_id`
- `internal_notes`, `shipping_tracking_code`

**Users:**
- `phone`, `is_active`, `last_login`
- `created_at`, `updated_at`

---

## 🧪 7. Testar o Sistema

### 7.1. Login como Admin
1. Acesse [http://localhost:9002](http://localhost:9002)
2. Faça login com as credenciais criadas
3. Você deve ver o dashboard de administrador

### 7.2. Verificar Funcionalidades
- ✅ **Dashboard**: Estatísticas e gráficos
- ✅ **Usuários**: Criar/editar usuários
- ✅ **Catálogo**: Gerenciar produtos e categorias
- ✅ **Pedidos**: Criar e gerenciar pedidos
- ✅ **Upload de Imagens**: Testar upload em produtos

### 7.3. Testar Diferentes Papéis
1. Crie usuários com roles diferentes (CONSULTANT, ASSEMBLER)
2. Teste as permissões específicas de cada papel
3. Verifique se as políticas RLS estão funcionando

---

## 🐛 8. Solução de Problemas

### Erro: "relation does not exist"
- ✅ Execute novamente o schema.sql completo
- ✅ Verifique se não há erros na execução do SQL

### Erro: "Invalid API key"
- ✅ Confirme as variáveis de ambiente no `.env`
- ✅ Verifique se as chaves foram copiadas corretamente

### Erro: "User not found"
- ✅ Verifique se o usuário foi criado na tabela `auth.users`
- ✅ Confirme se o perfil foi criado na tabela `public.users`

### Uploads não funcionam
- ✅ Verifique se os buckets existem
- ✅ Confirme as políticas de storage
- ✅ Teste com arquivos menores que 50MB

### Performance lenta
- ✅ Os índices foram criados? Verifique no Table Editor
- ✅ Execute `ANALYZE` nas tabelas principais se necessário

---

## 📞 9. Próximos Passos

### 9.1. Personalizar Configurações
1. Vá em **Table Editor** → **system_settings**
2. Ajuste valores como:
   - `company_name`, `company_phone`
   - `admin_email`
   - `order_id_prefix`

### 9.2. Adicionar Dados Iniciais
- Crie categorias adicionais
- Adicione produtos ao catálogo
- Configure usuários da equipe

### 9.3. Configurar IA (Opcional)
1. Obtenha uma chave da Google AI API
2. Adicione ao `.env`: `GOOGLE_GENERATIVE_AI_API_KEY`
3. Teste a geração de descrições de produtos

---

## 🎉 Configuração Concluída!

Seu sistema CO2 Brasil Manager v2.0 está pronto para uso com:

- ✅ **Schema otimizado** com performance superior
- ✅ **Segurança robusta** com RLS avançado
- ✅ **Storage configurado** com políticas apropriadas
- ✅ **Automações inteligentes** para produtividade
- ✅ **Dados iniciais** para começar imediatamente

**🚀 Agora é só usar e aproveitar!**

---

## 📱 Suporte

Se encontrar problemas:
1. Verifique este guia novamente
2. Consulte os logs do Supabase
3. Teste em ambiente limpo se necessário

**Boa sorte com seu projeto! 🎯**
