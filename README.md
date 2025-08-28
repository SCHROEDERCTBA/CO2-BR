# CO2 Brasil - Sistema de Gerenciamento

Este é um projeto Next.js que funciona como um sistema de gerenciamento de pedidos, produtos e usuários, utilizando Supabase como backend.

## Guia de Configuração do Projeto

Siga estes passos para configurar e executar o projeto localmente.

### 1. Pré-requisitos

- **Node.js:** Versão 18 ou superior.
- **Conta no Supabase:** Você pode criar uma conta gratuita em [supabase.com](https://supabase.com).

---

### 2. Configuração do Backend no Supabase

#### 2.1. Crie um Novo Projeto

1.  Acesse o [painel do Supabase](https://app.supabase.com).
2.  Clique em **"New project"**.
3.  Escolha uma organização, dê um nome ao seu projeto, gere uma senha segura para o banco de dados (e salve-a) e selecione a região do servidor.
4.  Aguarde a criação do projeto.

#### 2.2. Execute o Schema do Banco de Dados

1.  No menu lateral do seu projeto Supabase, vá para **SQL Editor**.
2.  Clique em **"+ New query"**.
3.  Copie **TODO** o conteúdo do arquivo `schema.sql` que está na raiz deste projeto.
4.  Cole o conteúdo na janela do SQL Editor.
5.  Clique em **"RUN"** para executar o script. Isso criará todas as tabelas, funções, políticas de segurança (RLS) e gatilhos necessários.

#### 2.3. Configure o Armazenamento (Storage)

O sistema precisa de três "buckets" para armazenar imagens.

1.  No menu lateral, vá para **Storage**.
2.  Crie os três buckets a seguir:
    *   `products`
    *   `orders`
    *   `invoices`
3.  Para **cada um** dos buckets criados, você precisa torná-los públicos:
    *   Clique no bucket.
    *   Vá para a aba **"Policies"**.
    *   Clique em **"New policy"**.
    *   Selecione o template **"Enable read access to public buckets"**. Isso criará 4 políticas. A única que nos interessa é a de **leitura (SELECT)** para acesso público.
    *   Edite a política de **SELECT** (geralmente a segunda da lista). Mude o nome dela para `Public Select` e em **Allowed operation** marque apenas a opção `select`. Salve a política.
    *   Exclua as outras 3 políticas (insert, update, delete) que foram criadas pelo template. Ao final, você deve ter apenas a política de `select` pública.

---

### 3. Configuração do Ambiente Local

#### 3.1. Obtenha as Chaves de API do Supabase

1.  No menu lateral do Supabase, vá para **Project Settings** (ícone de engrenagem).
2.  Clique em **API**.
3.  Você precisará de três informações desta página:
    *   **Project URL**: Encontre na seção "Configuration".
    *   **Project API Keys** -> `anon` `public`: Encontre a chave na tabela de chaves.
    *   **Project API Keys** -> `service_role` `secret`: Clique em "Show" para revelar esta chave. **TRATE ESTA CHAVE COMO UMA SENHA, NUNCA A EXPONHA PUBLICAMENTE.**

#### 3.2. Crie o Arquivo de Ambiente

1.  Na raiz do projeto, crie um arquivo chamado `.env`.
2.  Copie e cole o seguinte conteúdo, substituindo os valores pelas chaves que você obteve no passo anterior:

```env
# Supabase Project URL
NEXT_PUBLIC_SUPABASE_URL=SUA_URL_DO_PROJETO_AQUI

# Supabase Anon Key (pública e segura para o frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_AQUI

# Supabase Service Role Key (secreta, apenas para o backend)
SUPABASE_SERVICE_ROLE_KEY=SUA_CHAVE_SERVICE_ROLE_AQUI
```

---

### 4. Executando a Aplicação

1.  Abra um terminal na raiz do projeto.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Inicie o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
4.  A aplicação estará disponível em [http://localhost:9002](http://localhost:9002).

---

### 5. Criando o Primeiro Usuário Administrador

O sistema é projetado para que o primeiro administrador seja criado manualmente para garantir a segurança.

#### 5.1. Crie o Usuário na Autenticação

1.  No painel do Supabase, vá para a seção **Authentication**.
2.  Na aba **"Users"**, clique em **"Add user"**.
3.  Preencha o email e a senha do seu usuário administrador. **Não é necessário** marcar "Auto Confirm User", pois o nosso schema já desabilitou a confirmação de email.

#### 5.2. Promova o Usuário para Administrador

1.  No menu lateral, vá para **Table Editor**.
2.  Selecione a tabela `users` na lista de tabelas.
3.  Você verá uma linha correspondente ao usuário que você acabou de criar. O `role` padrão será `CONSULTANT`.
4.  Dê um duplo clique no campo `role` desta linha e mude o valor de `CONSULTANT` para `ADMIN`.
5.  Clique no botão **"Save"** no canto superior direito para confirmar a alteração.

**Pronto!** Agora você pode acessar a aplicação com o email e senha que você criou, e sua conta terá permissões de administrador para gerenciar todo o sistema.
