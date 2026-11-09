# Quando lança? · Xbox

Site para descobrir quanto tempo falta para um jogo da loja Xbox ser lançado.

## Fluxo

1. **Home** – um único campo de busca inteligente.
   - Ao digitar o nome, aparece uma caixa de sugestões (autosuggest da Microsoft Store) com capa e título.
   - Navegação por teclado (↑ ↓ Enter Esc) ou mouse.
   - Também aceita colar a **URL do jogo** (xbox.com, microsoft.com, apps.microsoft.com) ou o **ID** (ex.: `9PLKVSWR299F`).
2. **Página do jogo** (`#/jogo/<ID>`)
   - Capa, título, publicadora, desenvolvedora, gênero, plataformas, classificação indicativa, preço, avaliação, recursos, descrição e imagens.
   - **Canto superior direito:** contador em **horas** até o lançamento (com minutos/segundos ao vivo).
   - Se o jogo já foi lançado, mostra “Já disponível – disponível desde <data>”.
   - Se não houver data, mostra “A anunciar”.

## APIs (públicas, sem autenticação, com CORS)

- Sugestões: `GET https://displaycatalog.mp.microsoft.com/v7.0/productFamilies/autosuggest?market=BR&languages=pt-br&productFamilyNames=Games&query=<texto>`
- Produto: `GET https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=<ID>&market=BR&languages=pt-br`
- Data de lançamento: `MarketProperties[0].OriginalReleaseDate` (fallbacks nas SKUs).

## Estrutura

```
src/
  lib/xbox.js                  # chamadas à Microsoft Store + mapeamento dos dados
  lib/router.js                # roteador por hash
  components/SmartSearch.jsx   # campo de busca inteligente
  components/ReleaseCountdown.jsx
  pages/HomePage.jsx
  pages/GamePage.jsx
```

## Rodar

```
npm install
npm run dev
```
