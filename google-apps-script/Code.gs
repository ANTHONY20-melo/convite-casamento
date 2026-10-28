/**
 * CONVITE — recebe confirmações de presença e adiciona na planilha.
 *
 * COMO CONFIGURAR (5 minutos):
 * 1. Crie uma planilha nova em https://sheets.google.com com o nome que quiser;
 * 2. Menu Extensões → Apps Script; apague o conteúdo e cole TODO este arquivo;
 * 3. Clique no disquete (Salvar), de um nome ao projeto (ex.: "RSVP Casamento");
 * 4. Botão "Implantar" → "Nova implantação" → tipo: "Aplicativo da Web";
 *    - Executar como: Eu
 *    - Quem tem acesso: Qualquer pessoa  ← IMPORTANTE para os convidados
 * 5. Autorize as permissões (é a sua própria conta);
 * 6. Copie a URL da implantação (termina em /exec) e cole em
 *    CONFIG.linkPlanilha no js/main.js.
 *
 * Para exportar o Excel: na planilha, Arquivo → Baixar → Microsoft Excel (.xlsx).
 *
 * A planilha terá as colunas: Data | Nome | Presença | Acompanhantes | Recado.
 * Se precisar editar o script depois, use "Implantar → Gerenciar implantações
 * → editar → nova versão" (não crie implantação nova, senão a URL muda).
 */

var ABA = "Confirmados";

function doPost(e) {
  try {
    var planilha = SpreadsheetApp.getActiveSpreadsheet();
    var aba = planilha.getSheetByName(ABA) || planilha.insertSheet(ABA);

    // Cabeçalho na primeira escrita
    if (aba.getLastRow() === 0) {
      aba
        .getRange(1, 1, 1, 5)
        .setValues([["Data", "Nome", "Presença", "Acompanhantes", "Recado"]]);
      aba
        .getRange(1, 1, 1, 5)
        .setFontWeight("bold")
        .setBackground("#efe9dc")
        .setFontColor("#2e2a26");
      aba.setFrozenRows(1);
    }

    var dados = JSON.parse(e.postData.contents);
    aba.appendRow([
      new Date(dados.enviadoEm || Date.now()),
      String(dados.nome || "").trim(),
      String(dados.presenca || ""),
      Number(dados.acompanhantes || 0),
      String(dados.recado || "").trim(),
    ]);

    // Ajusta larguras uma única vez
    if (aba.getLastRow() === 2) aba.autoResizeColumns(1, 5);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (erro) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, erro: String(erro) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// DESCOMENTE e rode uma vez no editor (▶) para criar a aba vazia com formatação,
// conferindo sem esperar confirmação de convidado:
/*
function inicializarAba() {
  doPost({ postData: { contents: JSON.stringify({
    nome: "TESTE — apagar esta linha",
    presenca: "Sim",
    acompanhantes: 1,
    recado: "teste do aplicativo",
    enviadoEm: new Date().toISOString(),
  })}});
}
*/
