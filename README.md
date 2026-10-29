# Convite de Casamento — Livro

Convite digital de casamento em formato de **livro de 6 páginas**: introdução
(envelope com selo dourado), capa com os nomes, história + contagem,
cerimônia/recepção, dress code/presentes e a página final de **confirmação de
presença**. Sem build, sem dependências — abrir o `index.html` já funciona.

Navegação: botões `‹ ›`, teclado (`←` `→`, `PageUp/Down`) e os botões
"Abrir o envelope" (introdução → capa), "Abrir o convite" (capa → história) e
"Confirmar presença". A virada é 3D de verdade: a folha sai da lombada para a
esquerda ao avançar e volta girando ao recuar — com `prefers-reduced-motion` a
troca é instantânea.

## Como editar os dados do casal

Abra **`js/main.js`** e edite o bloco `CONFIG` no topo:

```js
const CONFIG = {
  nomes: "Cecília & Rafael",
  dataExtenso: "Domingo, 15 de agosto de 2027",
  horaCerimonia: "19h00",
  dataEvento: "2027-08-15T19:00:00", // contagem regressiva
  historia: "…",
  // locais + links de mapa:
  localCerimonia / enderecoCerimonia / linkCerimonia,
  localRecepcao / enderecoRecepcao / linkRecepcao,
  linkListaPresentes: "https://...",
  linkPlanilha: "https://script.google.com/.../exec", // planilha de confirmados
  emailRsvp / whatsappRsvp, // fallbacks enquanto a planilha não está no ar
  prazoRsvpTexto: "15 de julho de 2027",
};
```

Nome, data, história, locais, links de mapa, lista de presentes e o destino das
confirmações são atualizados automaticamente no livro.

**Ordem de envio do RSVP:** `POST /rsvp` (servidor local do `server.js`, grava
no Excel) → `linkPlanilha` (Google Sheets) → `whatsappRsvp` → `emailRsvp`.
Em hospedagem estática (Vercel, GitHub Pages) o `/rsvp` não existe: o site
detecta isso e segue a cadeia em silêncio, sem mostrar erro ao visitante.

## Planilha de confirmados (Excel)

**Arquivo pronto: `planilha-confirmados.xlsx`** (gerada pelo próprio Excel,
formatada com cabeçalho congelado, autofiltro e bordas douradas).
Colunas: Data | Nome | Presença | Acompanhantes | Recado — contém uma linha de
exemplo para apagar ao iniciar o uso real.

### Opção 1 — automática (recomendada quando o convite estiver no ar)

Cada confirmação vira uma linha na planilha do Google Sheets, que você baixa
como `.xlsx` quando quiser. Setup (uma vez, ~5 min):

1. Crie a planilha em <https://sheets.google.com>;
2. **Extensões → Apps Script** e cole o conteúdo de `google-apps-script/Code.gs`;
3. **Implantar → Nova implantação → Aplicativo da Web**,
   "Quem tem acesso: **Qualquer pessoa**", autorize e copie a URL (`…/exec`);
4. Cole a URL em `CONFIG.linkPlanilha` (no `js/main.js`);
5. (Opcional) rode `inicializarAba()` no editor do Apps Script para gerar a aba
   de teste com cabeçalho já formatado.

Enquanto a planilha online não estiver no ar, o RSVP usa os fallbacks
(`whatsappRsvp` tem prioridade, depois `emailRsvp`).

### Opção 2 — manual

Abra `planilha-confirmados.xlsx` e anote (ou cole) as confirmações. Para
importação em lote, use `modelo-planilha-confirmados.csv`
(Dados → De Texto/CSV).

## Estrutura

```
convite-casamento/
├── index.html                      # livro: 6 páginas + navegação
├── css/style.css                   # estilo, virada 3D de página
├── js/main.js                      # CONFIG + navegação + contagem + RSVP
├── server.js                       # (Node puro) site + RSVP → .xlsx local
├── start.bat                       # atalho: node server.js
├── confirmados.json                # acervo das confirmações (dados brutos)
├── google-apps-script/Code.gs      # script do Google Sheets (planilha)
├── planilha-confirmados.xlsx       # planilha Excel pronta (cabeçalho formatado)
├── modelo-planilha-confirmados.csv # modelo manual p/ Excel
└── README.md
```

## Servidor local (confirmações direto no Excel)

Rode **`start.bat`** (ou `node server.js`). O site abre em
<http://localhost:4173> e **cada confirmação é gravada como linha em
`planilha-confirmados.xlsx`** — sem Excel, sem bibliotecas extras (Node puro,
incluído no projeto por `server.js` + `start.bat`).

- `planilha-confirmados.xlsx` continua abrível no Excel normalmente;
- backup automático dos dados em `confirmados.json`;
- abrindo pela 1ª vez, o servidor regenera o `.xlsx` com o acervo já salvo.

## Publicação (grátis)

Hospede `index.html`, `css/` e `js/` em GitHub Pages, Netlify Drop ou Vercel —
arraste a pasta e publique. Nenhum servidor é necessário.

## Acessibilidade

- Contraste garantido entre tinta e papel (AA também dentro dos blocos);
- Navegação completa por teclado; foco visível em botões e campos;
- Alvos de toque de no mínimo 44×44px nas telas pequenas;
- Formulário com labels associados e feedback por `aria-live`;
- Animação de virada desativada em `prefers-reduced-motion`;
- Páginas com conteúdo longo nunca são cortadas: em telas que não comportam
  o livro inteiro, o livro cresce e a própria página do documento rola;
- A foto da capa, se não carregar, mostra um aviso honesto em vez de quebrar.
