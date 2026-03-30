# Como usar o Plugin no Photopea

## Instalação no Photopea

1. Abra o Photopea em https://www.photopea.com
2. Vá em **Extras** → **Plugins** → **Abrir Plugin**
3. Cole a URL do seu plugin (a URL publicada desta aplicação)
4. O plugin abrirá como um painel lateral

## Como funciona

### 1. Selecionar Liga
- Escolha a liga no menu suspenso (Brasileirão, Premier League, etc.)
- Selecione a temporada
- Os dados serão carregados automaticamente do Sofascore

### 2. Estrutura de Layers no PSD
Para que o plugin consiga atualizar os textos, seu arquivo PSD deve ter layers de texto organizados por posição.

**Exemplo de estrutura sugerida:**
```
Tabela/
  Linha_1/
    Pos_1       (texto: "1")
    Time_1      (texto: "Flamengo")
    Pts_1       (texto: "72")
    PJ_1        (texto: "38")
    ...
  Linha_2/
    Pos_2
    Time_2
    Pts_2
    ...
```

### 3. Mapear Layers (aba "Layers")
- Clique em **Ler Layers do PSD** para importar a estrutura do seu documento
- Ou use **Auto-mapear** se seguir a nomenclatura padrão acima
- Configure qual layer recebe qual dado (posição, nome, pontos, etc.)

### 4. Adicionar à Fila (aba "Tabela")
- Ajuste o tamanho do lote (1, 2, 3, 5 ou 10 posições)
- Clique em **Lote X de Y** para adicionar um grupo
- Ou clique no **+** em cada linha para adicionar individualmente
- Use **Todos** para adicionar todas as posições de uma vez

### 5. Aplicar atualizações (aba "Fila")
- Revise as posições que serão atualizadas
- Clique em **Aplicar no Photopea**
- O plugin atualizará os layers e salvará o documento automaticamente

## Campos disponíveis
| Campo | Descrição |
|-------|-----------|
| Posição | Número da posição na tabela |
| Nome do Time | Nome completo |
| Nome Curto | Sigla (3 letras) |
| Pontos | Total de pontos |
| Jogos | Partidas realizadas |
| Vitórias | Total de vitórias |
| Empates | Total de empates |
| Derrotas | Total de derrotas |
| Gols Pró | Gols marcados |
| Gols Contra | Gols sofridos |
| Saldo | Diferença de gols |

## Script Photopea (uso avançado)
O plugin comunica com o Photopea via `window.photopea.runScript()` ou via `window.parent.postMessage`. 
Para testar fora do Photopea, use o modo de prévia — os dados são mostrados mas sem alteração no PSD.
