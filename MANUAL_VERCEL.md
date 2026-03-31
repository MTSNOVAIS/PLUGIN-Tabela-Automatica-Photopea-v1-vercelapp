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
3. O Vercel irá detectar automaticamente o `vercel.json` com as configurações

---

### 4. Configuração do projeto no Vercel

Ao importar, o Vercel lerá o arquivo `vercel.json` automaticamente. **Não é necessário alterar nada nas configurações de build**, pois já estão definidas:

| Campo | Valor configurado |
|---|---|
| Install Command | `pnpm install` |
| Build Command | `pnpm --filter @workspace/football-table-plugin run build` |
| Output Directory | `artifacts/football-table-plugin/dist/public` |

> **Importante:** Caso o Vercel pergunte o **Framework Preset**, selecione **"Other"** (Outro).

---

### 5. Variáveis de ambiente

Este projeto **não exige nenhuma variável de ambiente obrigatória** para funcionar no Vercel.

As variáveis `PORT` e `BASE_PATH`, que eram necessárias apenas no ambiente Replit, foram tornadas opcionais — o projeto usa valores padrão automaticamente no Vercel.

---

### 6. Versão do Node.js

O Vercel usa Node.js 20 por padrão, que é compatível com este projeto. Nenhuma configuração adicional é necessária.

---

### 7. Deploy

Após importar e confirmar as configurações, clique em **"Deploy"**.

O Vercel irá:
1. Instalar as dependências com `pnpm install`
2. Fazer o build do frontend
3. Publicar as funções serverless da API
4. Disponibilizar tudo em uma URL no formato `https://seu-projeto.vercel.app`

---

## Estrutura dos arquivos de configuração

```
raiz do projeto/
├── vercel.json              ← Configuração principal do Vercel
├── api/
│   ├── sofascore.js         ← Função serverless: proxy para ESPN
│   └── healthz.js           ← Função serverless: health check
└── artifacts/
    └── football-table-plugin/
        └── vite.config.ts   ← Config do Vite (adaptada para Vercel)
```

---

## Como usar o plugin após o deploy

Depois do deploy, o plugin estará acessível na URL gerada pelo Vercel (ex: `https://seu-projeto.vercel.app`).

Para usar como plugin no **Photopea**:
1. Abra o Photopea em [photopea.com](https://www.photopea.com)
2. Vá em **Mais → Plugins → Plugin personalizado**
3. Cole a URL do seu projeto no Vercel
4. O plugin será carregado dentro do Photopea

Consulte o arquivo `artifacts/football-table-plugin/PLUGIN_INSTRUCTIONS.md` para instruções detalhadas sobre como configurar as camadas do PSD.

---

## Atualizações futuras

Toda vez que você fizer um push (enviar alterações) para o repositório Git, o Vercel irá automaticamente refazer o build e publicar a versão atualizada.

---

## Solução de problemas

| Problema | Solução |
|---|---|
| Build falhou com erro de `pnpm` | Certifique-se de que o Vercel está usando Node.js 20. Vá em **Settings → General → Node.js Version** e selecione `20.x`. |
| API retornando erro 404 | Verifique se os arquivos `api/sofascore.js` e `api/healthz.js` estão na raiz do repositório. |
| Plugin não carrega no Photopea | Certifique-se de que a URL usada no Photopea é exatamente a URL do Vercel (com `https://`). |
| Dados de classificação não aparecem | A API do ESPN pode estar temporariamente fora do ar. Aguarde alguns minutos e tente novamente. |
