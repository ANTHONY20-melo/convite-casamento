/* ============================================================
   CONVITE — servidor local (Node puro, ZERO dependências)
   ────────────────────────────────────────────────────────────
   Serve o site do convite e recebe confirmações de presença,
   gravando cada uma como linha em planilha-confirmados.xlsx
   (OOXML gerado à mão — sem Excel nem bibliotecas instaladas).

   Uso:  node server.js     (porta 4173)
   http://localhost:4173

   Endpoints:
     GET  /                     → site (index.html, css, js…)
     POST /rsvp                 → {nome, presenca, acompanhantes, recado}
     GET  /rsvp.json            → lista de confirmados (debug)
     GET  /planilha-confirmados.xlsx → baixar a planilha atual
   ============================================================ */

"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4173;
const RAIZ = __dirname;
const ARQ_DADOS = path.join(RAIZ, "confirmados.json");
const ARQ_PLANILHA = path.join(RAIZ, "planilha-confirmados.xlsx");

/* ---------------- utilidades ---------------- */

const escXML = (t) =>
  String(t ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const agoraISO = () => new Date().toISOString();

/* Dados/hora no formato pt-BR p/ a linha de Data */
function dataBR(iso) {
  const d = new Date(iso);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return (
    `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}

/* ---------------- ZIP (apenas "stored", CRC32 implementado) ---------------- */

const TABELA_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABELA_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function horaDos() {
  const d = new Date();
  const p = (n) => Math.max(0, Math.min(0xffff, n));
  const horario = p((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1));
  const data = p(((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
  return { horario, data };
}

/** Monta um ZIP válido com entradas "stored" (sem compressão). */
function writeZip(arquivos) {
  const { horario, data } = horaDos();
  const nomes = Object.keys(arquivos);
  const pedacos = [];
  const centrais = [];
  let deslocamento = 0;

  for (const nome of nomes) {
    const conteudo = arquivos[nome];
    const nomeBuf = Buffer.from(nome, "ascii");
    const crc = crc32(conteudo);

    const local = Buffer.alloc(30 + nomeBuf.length);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(horario, 10);
    local.writeUInt16LE(data, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(conteudo.length, 18);
    local.writeUInt32LE(conteudo.length, 22);
    local.writeUInt16LE(nomeBuf.length, 26);
    local.writeUInt16LE(0, 28);
    nomeBuf.copy(local, 30);

    pedacos.push(local, conteudo);

    const central = Buffer.alloc(46 + nomeBuf.length);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(horario, 12);
    central.writeUInt16LE(data, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(conteudo.length, 20);
    central.writeUInt32LE(conteudo.length, 24);
    central.writeUInt16LE(nomeBuf.length, 28);
    central.writeUInt32LE(0, 38); // attrs externos
    central.writeUInt32LE(deslocamento, 42);
    nomeBuf.copy(central, 46);

    centrais.push(central);
    deslocamento += local.length + conteudo.length;
  }

  const cd = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(nomes.length, 8);
  fim.writeUInt16LE(nomes.length, 10);
  fim.writeUInt32LE(cd.length, 12);
  fim.writeUInt32LE(deslocamento, 16);

  return Buffer.concat([...pedacos, cd, fim]);
}

/* ---------------- OOXML (xlsx mínimo válido) ---------------- */

const NS = "http://schemas.openxmlformats.org";

function gerarXlsx(linhas) {
  const col1 = "Data", col2 = "Nome", col3 = "Presenca", col4 = "Acompanhantes", col5 = "Recado";

  const cTexto = (ref, texto, estilo = 0) =>
    `<c r="${ref}" t="inlineStr"${estilo ? ` s="${estilo}"` : ""}><is><t>${escXML(texto)}</t></is></c>`;
  const cNum = (ref, num) => `<c r="${ref}"><v>${num}</v></c>`;

  // cabeçalho (estilo 1 = negrito + fundo marfim)
  const cab =
    `<row r="1">${cTexto("A1", col1, 1)}${cTexto("B1", col2, 1)}` +
    `${cTexto("C1", col3, 1)}${cTexto("D1", col4, 1)}${cTexto("E1", col5, 1)}</row>`;

  const linhasXML = linhas
    .map((l, i) => {
      const r = i + 2;
      return (
        `<row r="${r}">${cTexto(`A${r}`, dataBR(l.enviadoEm))}${cTexto(`B${r}`, l.nome)}` +
        `${cTexto(`C${r}`, l.presenca)}${cNum(`D${r}`, Number(l.acompanhantes) || 0)}` +
        `${cTexto(`E${r}`, l.recado || "")}</row>`
      );
    })
    .join("");

  const sheet1 =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="${NS}/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0">` +
    `<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>` +
    `</sheetView></sheetViews>` +
    `<cols>` +
    `<col min="1" max="1" width="19" customWidth="1"/>` +
    `<col min="2" max="2" width="34" customWidth="1"/>` +
    `<col min="3" max="3" width="12" customWidth="1"/>` +
    `<col min="4" max="4" width="16" customWidth="1"/>` +
    `<col min="5" max="5" width="58" customWidth="1"/>` +
    `</cols>` +
    `<sheetData>${cab}${linhasXML}</sheetData>` +
    `<autoFilter ref="A1:E${linhas.length + 1}"/>` +
    `</worksheet>`;

  const workbook =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<workbook xmlns="${NS}/spreadsheetml/2006/main" ` +
    `xmlns:r="${NS}/officeDocument/2006/relationships">` +
    `<sheets><sheet name="Confirmados" sheetId="1" r:id="rId1"/></sheets>` +
    `</workbook>`;

  const wbRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="${NS}/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
    `<Relationship Id="rId2" Type="${NS}/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `</Relationships>`;

  const raizRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="${NS}/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="${NS}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
    `</Relationships>`;
  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<styleSheet xmlns="${NS}/spreadsheetml/2006/main">` +
    `<fonts count="2">` +
    `<font><sz val="11"/><name val="Calibri"/></font>` +
    `<font><b/><sz val="12"/><name val="Calibri"/><color rgb="FF2E2A26"/></font>` +
    `</fonts>` +
    `<fills count="3">` +
    `<fill><patternFill patternType="none"/></fill>` +
    `<fill><patternFill patternType="gray125"/></fill>` +
    `<fill><patternFill patternType="solid"><fgColor rgb="FFEFE9DC"/><bgColor indexed="64"/></patternFill></fill>` +
    `</fills>` +
    `<borders count="1"><border/></borders>` +
    `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
    `<cellXfs count="2">` +
    `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
    `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
    `</cellXfs>` +
    `</styleSheet>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="${NS}/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
    `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
    `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
    `</Types>`;

  return writeZip({
    "[Content_Types].xml": Buffer.from(contentTypes, "utf8"),
    "_rels/.rels": Buffer.from(raizRels, "utf8"),
    "xl/workbook.xml": Buffer.from(workbook, "utf8"),
    "xl/_rels/workbook.xml.rels": Buffer.from(wbRels, "utf8"),
    "xl/styles.xml": Buffer.from(styles, "utf8"),
    "xl/worksheets/sheet1.xml": Buffer.from(sheet1, "utf8"),
  });
}

/* ---------------- gravação da planilha ---------------- */

function lerDados() {
  try {
    return JSON.parse(fs.readFileSync(ARQ_DADOS, "utf8"));
  } catch {
    return [];
  }
}

function gravarDados(lista) {
  fs.writeFileSync(ARQ_DADOS, JSON.stringify(lista, null, 2), "utf8");
}

function salvarPlanilha(linhas) {
  fs.writeFileSync(ARQ_PLANILHA, gerarXlsx(linhas));
  return linhas.length;
}

/* ---------------- servidor HTTP ---------------- */

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv; charset=utf-8",
  ".gs": "text/plain; charset=utf-8",
  ".bat": "text/plain; charset=utf-8",
};

function enviar(res, codigo, corpo, tipo, extra = {}) {
  res.writeHead(codigo, {
    "Content-Type": tipo,
    "Access-Control-Allow-Origin": "*",
    ...extra,
  });
  res.end(corpo);
}

function caminhoSeguro(urlPath) {
  const caminho = path.normalize(path.join(RAIZ, decodeURIComponent(urlPath)));
  if (!caminho.startsWith(RAIZ)) return null; // bloqueia path traversal
  return caminho;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const rota = url.pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    });
    return res.end();
  }

  // ---- API: RSVP ----
  if (req.method === "POST" && rota === "/rsvp") {
    let corpo = "";
    req.on("data", (c) => (corpo += c));
    req.on("end", () => {
      try {
        const d = JSON.parse(corpo);
        const nome = String(d.nome || "").trim();
        if (!nome) return enviar(res, 400, JSON.stringify({ ok: false, erro: "nome obrigatório" }), "application/json");

        const registro = {
          enviadoEm: agoraISO(),
          nome: nome.slice(0, 120),
          presenca: String(d.presenca || "").slice(0, 20),
          acompanhantes: Math.max(0, parseInt(d.acompanhantes, 10) || 0),
          recado: String(d.recado || "").slice(0, 400),
        };

        const lista = lerDados();
        lista.push(registro);
        gravarDados(lista);

        let total;
        try {
          total = salvarPlanilha(lista);
          console.log(`[rsvp] ${nome} — ${registro.presenca} (${lista.length} no total) → planilha atualizada`);
        } catch (e) {
          console.error("[rsvp] falha ao regenerar xlsx (JSON continua salvo):", e.message);
          total = lista.length;
        }

        enviar(res, 200, JSON.stringify({ ok: true, total }), "application/json");
      } catch (e) {
        enviar(res, 400, JSON.stringify({ ok: false, erro: "JSON inválido" }), "application/json");
      }
    });
    return;
  }

  // ---- API: lista (debug) ----
  if (req.method === "GET" && rota === "/rsvp.json") {
    return enviar(res, 200, JSON.stringify(lerDados(), null, 2), "application/json");
  }

  // ---- arquivos estáticos ----
  if (req.method === "GET") {
    const rel = rota === "/" ? "index.html" : rota.slice(1);
    const caminho = caminhoSeguro(rel);
    if (!caminho || !fs.existsSync(caminho) || fs.statSync(caminho).isDirectory()) {
      return enviar(res, 404, "404 — não encontrado", "text/plain; charset=utf-8");
    }
    const tipo = MIME[path.extname(caminho).toLowerCase()] || "application/octet-stream";
    return enviar(res, 200, fs.readFileSync(caminho), tipo);
  }

  enviar(res, 405, "método não permitido", "text/plain; charset=utf-8");
});

/* Na inicialização: garante a planilha em dia com o acervo salvo. */
(function inicializar() {
  const lista = lerDados();
  try {
    salvarPlanilha(lista);
    console.log(`[convite] planilha em dia: ${lista.length} confirmação(ões).`);
  } catch (e) {
    console.error("[convite] não consegui gerar o xlsx inicial:", e.message);
  }
})();

server.listen(PORT, () => console.log(`[convite] no ar em http://localhost:${PORT}`));
