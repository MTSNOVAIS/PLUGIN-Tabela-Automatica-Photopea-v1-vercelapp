01
# Manual de Deploy no Vercel

Este guia explica como hospedar o **Plugin Tabela de Futebol** no Vercel.

---

## O que será hospedado

- **Frontend** (o plugin em si): uma aplicação React/Vite estática
- **API** (proxy para a ESPN): duas funções serverless do Vercel
  - `/api/sofascore` — proxy que busca dados de classificação
  - `/api/healthz` — verificação de saúde da API

---

## Passo a Passo

### 1. Criar conta no Vercel

Acesse [vercel.com](https://vercel.com) e crie uma conta gratuita (pode usar GitHub, GitLab ou Bitbucket).

---

### 2. Enviar o projeto para um repositório Git

O Vercel precisa que o código esteja no GitHub, GitLab ou Bitbucket.

Se ainda não tem um repositório:
1. Crie um repositório no GitHub (pode ser privado)
2. Faça upload de todo o projeto para ele

---

### 3. Importar o projeto no Vercel

1. No painel do Vercel, clique em **"Add New… → Project"**
2. Selecione o repositório onde o projeto está
3. **IMPORTANTE — antes de clicar em Deploy**, configure o **Root Directory** (veja o próximo passo)

---

### 4. Configurar o Root Directory ⚠️ Passo obrigatório

Este é o passo mais importante. Como o projeto é um monorepo com vários pacotes, você precisa dizer ao Vercel **qual pasta é o plugin que deve ser publicado**.

Na tela de configuração do projeto (antes do primeiro Deploy):

1. Clique em **"Edit"** ao lado de **Root Directory**
2. Digite ou selecione: `artifacts/football-table-plugin`
3. Clique em **"Continue"**

> **Por que isso é necessário?** O Vercel tenta construir o projeto inteiro (com Express, banco de dados, etc.) quando não tem um diretório raiz definido. Com o Root Directory, ele foca apenas na pasta do plugin, que é um site estático simples.

Após definir o Root Directory, o Vercel irá detectar automaticamente as configurações do arquivo `artifacts/football-table-plugin/vercel.json`:

| Campo | Valor |
|---|---|
| Framework | None |
| Install Command | `pnpm install` |
| Build Command | `pnpm run build` |
| Output Directory | `dist/public` |

**Não altere nenhum desses valores.**

---

### 5. Variáveis de ambiente

Este projeto **não exige nenhuma variável de ambiente** para funcionar no Vercel.

---

### 6. Deploy

Clique em **"Deploy"**. O Vercel irá:
1. Instalar as dependências com `pnpm install`
2. Fazer o build do plugin com Vite
3. Publicar as funções da API (`/api/sofascore` e `/api/healthz`)
4. Disponibilizar tudo em uma URL no formato `https://seu-projeto.vercel.app`

---

## Estrutura dos arquivos de configuração

```
artifacts/football-table-plugin/   ← Root Directory no Vercel
├── vercel.json                    ← Configuração do Vercel
├── api/
│   ├── sofascore.js               ← Função serverless: proxy para ESPN
│   └── healthz.js                 ← Função serverless: health check
├── vite.config.ts                 ← Config do Vite
└── src/                           ← Código-fonte do plugin
```

---

## Como usar o plugin após o deploy

Depois do deploy, o plugin estará acessível na URL gerada pelo Vercel (ex: `https://seu-projeto.vercel.app`).

Para usar como plugin no **Photopea**:
1. Abra o Photopea em [photopea.com](https://www.photopea.com)
2. Vá em **Mais → Plugins → Plugin personalizado**
3. Cole a URL do seu projeto no Vercel
4. O plugin será carregado dentro do Photopea

Consulte o arquivo `PLUGIN_INSTRUCTIONS.md` (dentro da pasta `artifacts/football-table-plugin/`) para instruções detalhadas sobre como configurar as camadas do PSD.

---

## Atualizações futuras

Toda vez que você fizer um push (enviar alterações) para o repositório Git, o Vercel irá automaticamente refazer o build e publicar a versão atualizada.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| Qualquer erro de "Output Directory" ou "No entrypoint found" | Verifique se o **Root Directory** está configurado como `artifacts/football-table-plugin` em **Settings → General → Root Directory**. Este é o passo mais comum de ser esquecido. |
| Build falhou com erro de `pnpm` | Certifique-se de que o Vercel está usando Node.js 20. Vá em **Settings → General → Node.js Version** e selecione `20.x`. |
| API retornando erro 404 | Verifique se os arquivos `api/sofascore.js` e `api/healthz.js` estão dentro da pasta `artifacts/football-table-plugin/api/`. |
| Plugin não carrega no Photopea | Certifique-se de que a URL usada no Photopea é exatamente a URL do Vercel (com `https://`). |
| Dados de classificação não aparecem | A API do ESPN pode estar temporariamente fora do ar. Aguarde alguns minutos e tente novamente. |
