/* ============================================================
   CONVITE DE CASAMENTO — Livro com virada de página
   ────────────────────────────────────────────────────────────
   EDITE APENAS O BLOCO "CONFIG" ABAIXO.
   ============================================================ */

const CONFIG = {
  // --- ESSENCIAIS ----------------------------------------------------------
  nomes: "Anthony & Elisa", // ex.: "Cecília & Rafael"
  dataExtenso: "Sábado, 12 de dezembro de 2026",
  horaCerimonia: "19h00",
  horaRecepcao: "20h30",
  dataEvento: "2026-12-12T19:00:00", // contagem regressiva (AAAA-MM-DDTHH:MM:SS)

  // --- HISTÓRIA (página "Nossa história") ----------------------------------
  historia:
    "Foi numa tarde comum que tudo começou: um encontro, uma conversa que não queria terminar e, aos poucos, a certeza de que éramos feitos um para o outro. Desde então, cada dia junto virou memória — e agora queremos começar nossa maior aventura, cercados de quem amamos.",

  // --- CERIMÔNIA E RECEPÇÃO ------------------------------------------------
  localCerimonia: "Igreja Matriz de São José",
  enderecoCerimonia: "Praça da Matriz, 123 — Centro",
  linkCerimonia: "https://maps.google.com/?q=Igreja+Matriz",

  localRecepcao: "Salão Nobre Vista Verde",
  enderecoRecepcao: "Avenida das Flores, 456 — Jardins",
  linkRecepcao: "https://maps.google.com/?q=Salao+Vista+Verde",

  notaPresenca: "Sua presença é nosso presente maior. Conte com você!",

  // --- EXTRAS --------------------------------------------------------------
  // Lista pública de presentes (enxoval) — o convidado escolhe o item e
  // escreve o nome para reservá-lo:
  linkListaPresentes: "https://meu-enxoval-web.vercel.app/anthony-e-noiva",

  // Prazo do RSVP (chave única — usada em "Presentes" e no rodapé do formulário)
  prazoRsvpTexto: "12 de novembro de 2026",

  // --- PLANILHA DE CONFIRMADOS (formato Excel/Sheets) -----------------------
  // 1) Crie uma planilha no Google Sheets;
  // 2) Extensões → Apps Script → cole o conteúdo de google-apps-script/Code.gs;
  // 3) Implantar → Nova implantação → Aplicativo da Web → copie a URL;
  // 4) Cole a URL aqui. Cada confirmação vira uma linha na planilha
  //    (Arquivo → Baixar → Excel .xlsx a qualquer momento).
  linkPlanilha: "", // ex.: "https://script.google.com/macros/s/AKfy.../exec"

  // --- FALLBACKS caso a planilha não esteja configurada ----------------------
  // Escolha UM dos dois:
  emailRsvp: "anthonybelmon6@gmail.com",
  whatsappRsvp: "", // formato: 5511999999999 (DDD + número)

  // Ordem de envio do RSVP (definida em js/main.js, não aqui):
  //   1) POST /rsvp  (servidor local — server.js)
  //   2) linkPlanilha (Apps Script / Google Sheets)
  //   3) whatsappRsvp
  //   4) emailRsvp
};

/* ============================================================
   A partir daqui, o código aplica a CONFIG e liga as dinâmicas.
   Em geral NÃO é necessário mexer abaixo.
   ============================================================ */

(function () {
  "use strict";

  // ---------- 1. Aplicar CONFIG no HTML ------------------------------------
  const todos = (dataAttr) => [
    ...document.querySelectorAll(`[data-config="${dataAttr}"]`),
  ];

  const textosSimples = {
    nomes: CONFIG.nomes,
    historia: CONFIG.historia,
    localCerimonia: CONFIG.localCerimonia,
    enderecoCerimonia: CONFIG.enderecoCerimonia,
    localRecepcao: CONFIG.localRecepcao,
    enderecoRecepcao: CONFIG.enderecoRecepcao,
    horaCerimonia: CONFIG.horaCerimonia,
    horaRecepcao: CONFIG.horaRecepcao,
    notaPresenca: CONFIG.notaPresenca,
  };
  for (const [chave, valor] of Object.entries(textosSimples)) {
    for (const alvo of todos(chave)) alvo.textContent = valor;
  }

  // Prazo do RSVP: "<strong>" montado via DOM (nada de innerHTML)
  for (const alvo of todos("prazoRsvp")) {
    const forte = document.createElement("strong");
    forte.textContent = CONFIG.prazoRsvpTexto;
    alvo.replaceChildren(
      document.createTextNode("Por favor, confirme até "),
      forte,
      document.createTextNode(".")
    );
  }

  // Data do evento: <strong>data</strong><span>às hora</span>
  for (const alvo of todos("dataExtenso")) {
    const forte = document.createElement("strong");
    forte.textContent = CONFIG.dataExtenso;
    const hora = document.createElement("span");
    hora.textContent = `às ${CONFIG.horaCerimonia}`;
    alvo.replaceChildren(forte, hora);
  }

  for (const [chave, valor] of Object.entries({
    linkCerimonia: CONFIG.linkCerimonia,
    linkRecepcao: CONFIG.linkRecepcao,
    linkListaPresentes: CONFIG.linkListaPresentes,
  })) {
    const alvo = document.querySelector(`[data-config-link="${chave}"]`);
    if (alvo && valor) alvo.href = valor;
  }

  document.title = `Convite de Casamento — ${CONFIG.nomes}`;

  // ---------- 1.1 Lista de presentes (dados em js/lista-presentes.js) ------
  const containerLista = document.getElementById("lista-presentes");
  if (
    containerLista &&
    typeof LISTA_PRESENTES !== "undefined" &&
    Array.isArray(LISTA_PRESENTES)
  ) {
    const total = LISTA_PRESENTES.reduce((t, s) => t + s.itens.length, 0);
    const frag = document.createDocumentFragment();

    for (const secao of LISTA_PRESENTES) {
      const bloco = document.createElement("section");
      bloco.className = "lista-presentes__secao";

      const cabecalho = document.createElement("div");
      cabecalho.className = "lista-presentes__cabecalho";

      const titulo = document.createElement("h3");
      titulo.className = "lista-presentes__titulo";
      titulo.textContent = `${secao.icone} ${secao.titulo}`;

      const contagem = document.createElement("span");
      contagem.className = "lista-presentes__contagem";
      contagem.textContent = `${secao.itens.length} ${secao.itens.length === 1 ? "item" : "itens"}`;

      cabecalho.append(titulo, contagem);

      const lista = document.createElement("ul");
      lista.className = "lista-presentes__itens";
      for (const item of secao.itens) {
        const li = document.createElement("li");
        li.className = "lista-presentes__item";
        li.textContent = item;
        lista.append(li);
      }

      bloco.append(cabecalho, lista);
      frag.append(bloco);
    }

    containerLista.replaceChildren(frag);
    containerLista.setAttribute("aria-label", `Lista de presentes: ${total} itens`);
  }

  // ---------- 2. Inicialização do livro -----------------------------------
  const paginas = [...document.querySelectorAll(".pagina")];
  const total = paginas.length;
  const livro = document.getElementById("livro");
  const nav = document.querySelector(".livro__nav");
  const btnAnt = document.getElementById("btn-anterior");
  const btnProx = document.getElementById("btn-proximo");
  const rotulo = document.getElementById("paginacao");
  const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

  const ANIM_FRENTE = "folha-vira-frente"; // 0deg → -180deg (avanço)
  const ANIM_VOLTA = "folha-volta-para-frente"; // -180deg → 0deg (recuo)
  const CLASSE_FOLHA = { frente: "folha-frente", volta: "folha-volta" };

  // Duração lida do CSS: mantém JS e CSS em sincronia sem duplicar o valor.
  const duracaoVirada = (() => {
    const ms = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--duracao-virada")
    );
    return Number.isFinite(ms) && ms > 0 ? ms : 900;
  })();

  let atual = 0; // página em repouso (a que está visível)
  let alvo = 0; // página pedida — pode estar no meio de uma virada
  let giro = null; // virada em curso: { folha, tipo, origem, destino, ... }

  /**
   * Estado de repouso: as páginas anteriores ficam viradas para a esquerda
   * (invisíveis pelo backface), a atual fica no lugar e as seguintes somem.
   *
   * `inert` tira da cena as páginas fora do foco: elas saem da árvore de
   * acessibilidade e do tab order, então um leitor de tela não anuncia
   * conteúdo de uma página que o visitante não está vendo.
   */
  function estadoRepouso(indice) {
    paginas.forEach((pg, i) => {
      pg.classList.remove("ativa", "virada", "sob", "folha-frente", "folha-volta");
      pg.inert = i !== indice;
      if (i < indice) pg.classList.add("virada");
      else if (i === indice) pg.classList.add("ativa");
    });
  }

  function finalizarGiro(g) {
    if (!g) return;
    if (g.ouvinte) {
      g.folha.removeEventListener("animationend", g.ouvinte);
      g.folha.removeEventListener("animationcancel", g.ouvinte);
    }
    if (g.tempoLimite) clearTimeout(g.tempoLimite);
    if (giro === g) giro = null;

    // O estado final é SEMPRE a página pedida — a navegação nunca fica travada.
    estadoRepouso(g.destino);
    atual = g.destino;
    alvo = g.destino;
    syncNav();
    ajustarAltura();

    // Devolve o foco ao conteúdo novo quando ele estava na folha que saiu.
    const foco = g.foco;
    if (
      foco &&
      foco !== document.body &&
      (paginas[g.origem].contains(foco) || paginas[g.destino].contains(foco))
    ) {
      const titulo = paginas[g.destino].querySelector("h1, h2");
      if (titulo) {
        titulo.setAttribute("tabindex", "-1");
        titulo.focus({ preventScroll: true });
      }
    }
  }

  /** Interrompe uma virada em curso: a página pedida nela fica visível na hora. */
  function encerrarGiro() {
    if (!giro) return;
    const g = giro;
    giro = null; // trava reentrância antes de finalizar
    finalizarGiro(g);
  }

  function iniciarGiro({ folha, tipo, origem, destino, foco }) {
    const g = { folha, tipo, origem, destino, foco };
    giro = g;

    const nomeAnimacao = tipo === "frente" ? ANIM_FRENTE : ANIM_VOLTA;

    const aoTerminar = (evento) => {
      if (evento.target !== folha || evento.pseudoElement) return;
      if (evento.animationName !== nomeAnimacao) return;
      if (giro !== g) return; // giro substituído por outro
      finalizarGiro(g);
    };
    g.ouvinte = aoTerminar;

    // Rede de segurança: se `animationend` não vier (aba em segundo plano,
    // GPU ocupada, preferência de movimento mudada no meio do giro), o livro
    // ainda chega ao destino — a navegação nunca trava.
    g.tempoLimite = setTimeout(() => {
      if (giro === g) finalizarGiro(g);
    }, duracaoVirada + 250);

    folha.addEventListener("animationend", aoTerminar);
    folha.addEventListener("animationcancel", aoTerminar);
    folha.classList.add(CLASSE_FOLHA[tipo]);
  }

  function goto(indice) {
    const destino = Math.max(0, Math.min(total - 1, indice));

    // Já estamos nesta página (ou já estamos indo para ela): nada a fazer.
    if (destino === alvo) {
      syncNav();
      return;
    }

    // Uma virada anterior é finalizada instantaneamente — nada fica travado.
    encerrarGiro();

    const origem = atual;
    const avancando = destino > origem;

    alvo = destino;
    syncNav();

    if (origem === destino) {
      estadoRepouso(origem);
      return;
    }

    if (movimentoReduzido.matches) {
      // Sem rotação: troca instantânea entre as páginas.
      estadoRepouso(destino);
      atual = destino;
      syncNav();
      return;
    }

    // Foco capturado ANTES de aplicar `inert` (inert tira o foco do elemento).
    const foco = document.activeElement;

    paginas.forEach((pg, i) => {
      pg.classList.remove("ativa", "virada", "sob", "folha-frente", "folha-volta");
      pg.inert = true; // durante a virada nada fora de cena recebe foco/ponteiro
      if (avancando) {
        if (i < origem) pg.classList.add("virada"); // folhas já viradas
        else if (i === destino) pg.classList.add("sob"); // página revelada por baixo
        // i === origem → a folha que sai (classe aplicada em iniciarGiro)
      } else {
        if (i < destino) pg.classList.add("virada");
        else if (i === origem) pg.classList.add("sob"); // página que fica coberta
        // i === destino → a folha que volta (classe aplicada em iniciarGiro)
      }
    });

    const folha = avancando ? paginas[origem] : paginas[destino];
    iniciarGiro({
      folha,
      tipo: avancando ? "frente" : "volta",
      origem,
      destino,
      foco,
    });
  }

  function syncNav() {
    const texto = `Página ${alvo + 1} de ${total}`;
    if (rotulo.textContent !== texto) rotulo.textContent = texto;
    btnAnt.disabled = alvo === 0;
    btnProx.disabled = alvo === total - 1;
  }

  // ---------- 2.1 Altura do livro (conteúdo nunca é cortado) ---------------
  /**
   * Altura natural de cada página (só o conteúdo, sem a altura fixa do livro).
   * As páginas são medidas em lote: um único reflow para as seis.
   */
  function medirPaginas() {
    const salvo = paginas.map((pg) => ({
      bottom: pg.style.bottom,
      height: pg.style.height,
    }));
    paginas.forEach((pg) => {
      pg.style.bottom = "auto";
      pg.style.height = "auto";
    });
    const alturas = paginas.map((pg) => pg.scrollHeight);
    paginas.forEach((pg, i) => {
      pg.style.bottom = salvo[i].bottom;
      pg.style.height = salvo[i].height;
    });
    return alturas;
  }

  function ajustarAltura() {
    const maior = Math.max(...medirPaginas());

    // A página é `position:absolute; inset:0` dentro da CAIXA DE PADDING do
    // livro: para a folha caber inteira, a altura do livro precisa do conteúdo
    // + o cromo do quadro (padding + borda) + a folga da virada.
    const estiloLivro = getComputedStyle(livro);
    const cromo =
      parseFloat(estiloLivro.paddingTop) +
      parseFloat(estiloLivro.paddingBottom) +
      parseFloat(estiloLivro.borderTopWidth) +
      parseFloat(estiloLivro.borderBottomWidth);
    const folga =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--folga-virada")
      ) || 0;

    const estiloBody = getComputedStyle(document.body);
    const padding =
      parseFloat(estiloBody.paddingTop) + parseFloat(estiloBody.paddingBottom);

    const alturaNav = nav
      ? nav.getBoundingClientRect().height +
        parseFloat(getComputedStyle(nav).marginTop)
      : 0;

    const gap = parseFloat(getComputedStyle(livro.parentElement).rowGap) || 0;
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const disponivel = Math.max(
      320,
      viewport - padding - alturaNav - gap - 8
    );

    // O livro assume a altura natural do conteúdo (a mais alta das páginas).
    // Se não couber na tela (celular), ele cresce e o DOCUMENTO rola: nada
    // fica cortado nem preso dentro da folha. O corpo passa a alinhar no topo
    // para o começo do livro não sair do alcance da rolagem.
    const alturaNecessaria = Math.round(maior + cromo + folga);
    document.body.classList.toggle("livro-alto", alturaNecessaria > disponivel);
    livro.style.height = `${alturaNecessaria}px`;
  }

  btnAnt.addEventListener("click", () => goto(alvo - 1));
  btnProx.addEventListener("click", () => goto(alvo + 1));

  document.addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const elemento = e.target;
    const emCampo =
      elemento instanceof HTMLElement &&
      (elemento.isContentEditable ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(elemento.tagName));
    if (emCampo) return; // não vira página enquanto se escreve no formulário

    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goto(alvo + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goto(alvo - 1);
    }
  });

  // Se a preferência de movimento reduzido for ligada no meio de uma virada,
  // a folha para na hora e o livro fica no destino.
  if (movimentoReduzido.addEventListener) {
    movimentoReduzido.addEventListener("change", () => {
      if (movimentoReduzido.matches) encerrarGiro();
    });
  }

  // botões "data-virar" (Abrir envelope / Abrir o convite / Confirmar presença)
  document.querySelectorAll("[data-virar]").forEach((b) =>
    b.addEventListener("click", () => goto(parseInt(b.dataset.virar, 10)))
  );

  estadoRepouso(atual);
  syncNav();
  ajustarAltura();

  // Estado do livro exposto para inspeção/testes automatizados.
  window.__convite = {
    get paginaAtual() {
      return atual;
    },
    get paginaAlvo() {
      return alvo;
    },
    get totalPaginas() {
      return total;
    },
    get girando() {
      return Boolean(giro);
    },
    irPara: goto,
  };

  window.addEventListener("resize", ajustarAltura);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(ajustarAltura);
  }

  // ---------- 2.2 Foto da capa: estado de erro (offline / imagem fora) ------
  /**
   * A foto vem de um CDN externo. Se ela não carregar, a capa continua
   * elegante (o quadro tem fundo dourado próprio) e o aviso abaixo dela diz
   * honestamente o que não carregou — sem quebrar a virada de página.
   */
  const fotoCapa = document.querySelector(".capa__foto");
  const avisoCapa = document.getElementById("capa-aviso");
  if (fotoCapa && avisoCapa) {
    const semFoto = () => {
      fotoCapa.classList.add("capa__foto--erro");
      avisoCapa.hidden = false;
      ajustarAltura();
    };
    // `complete` + `naturalWidth === 0` = a falha já aconteceu antes do JS
    if (fotoCapa.complete && fotoCapa.naturalWidth === 0) semFoto();
    else fotoCapa.addEventListener("error", semFoto, { once: true });
  }

  // ---------- 3. Contagem regressiva ----------------------------------------
  const alvoData = new Date(CONFIG.dataEvento);
  const campos = ["cd-dias", "cd-horas", "cd-minutos", "cd-segundos"].map((id) =>
    document.getElementById(id)
  );

  if (campos.every(Boolean) && !Number.isNaN(alvoData.getTime())) {
    const [dias, horas, min, seg] = campos;
    const atualizarContagem = () => {
      const diff = Math.max(0, alvoData.getTime() - Date.now());
      dias.textContent = String(Math.floor(diff / 86400000));
      horas.textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, "0");
      min.textContent = String(Math.floor(diff / 60000) % 60).padStart(2, "0");
      seg.textContent = String(Math.floor(diff / 1000) % 60).padStart(2, "0");
    };
    atualizarContagem();
    setInterval(atualizarContagem, 1000);
  }

  // ---------- 4. RSVP → servidor local / planilha / WhatsApp / e-mail -------
  const form = document.getElementById("form-rsvp");
  const feedback = document.getElementById("rsvp-feedback");
  const btnEnviar = document.getElementById("rsvp-enviar");
  const inputNome = document.getElementById("rsvp-nome");
  const erroNome = document.getElementById("rsvp-nome-erro");
  const campo = (nome) => form.elements.namedItem(nome);

  const fbOk = (m) => {
    feedback.classList.remove("rsvp__feedback--erro");
    feedback.textContent = m;
    ajustarAltura();
  };
  const fbErro = (m) => {
    feedback.classList.add("rsvp__feedback--erro");
    feedback.textContent = m;
    ajustarAltura();
  };

  /* Erro de validação mostrado JUNTO ao campo (não só no rodapé do form). */
  const mostrarErroNome = (mensagem) => {
    if (erroNome) {
      erroNome.textContent = mensagem;
      erroNome.hidden = false;
    }
    inputNome.setAttribute("aria-invalid", "true");
  };
  const limparErroNome = () => {
    if (erroNome) {
      erroNome.textContent = "";
      erroNome.hidden = true;
    }
    inputNome.removeAttribute("aria-invalid");
  };
  inputNome.addEventListener("input", limparErroNome);

  function montarDados() {
    return {
      nome: campo("nome").value.trim(),
      presenca: campo("presenca").value,
      acompanhantes: Math.max(0, parseInt(campo("acompanhantes").value, 10) || 0),
      recado: campo("recado").value.trim(),
      enviadoEm: new Date().toISOString(),
    };
  }

  function textoConfirmacao(d) {
    return [
      `Olá! Confirmação para o casamento de ${CONFIG.nomes}:`,
      `Nome: ${d.nome}`,
      `Presença: ${d.presenca}`,
      d.presenca === "Sim" ? `Acompanhantes: ${d.acompanhantes}` : null,
      d.recado ? `Recado: ${d.recado}` : null,
    ]
      .filter(Boolean)
      .join("\n");
  }

  /**
   * (a) Endpoint do server.js local. Só responde OK quando o site está sendo
   * servido por ele; em hospedagem estática (Vercel) a resposta não é OK e o
   * fluxo segue para o próximo destino em silêncio — sem mensagem de erro.
   */
  async function enviarServidor(d) {
    try {
      const resposta = await fetch("/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(d),
      });
      if (!resposta.ok) return false;
      const json = await resposta.json();
      return Boolean(json && json.ok);
    } catch {
      return false;
    }
  }

  /** (b) Google Apps Script: resposta opaca (no-cors) — sucesso da rede = OK. */
  function enviarPlanilha(d) {
    return fetch(CONFIG.linkPlanilha, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(d),
    })
      .then(() => true)
      .catch(() => false);
  }

  /** (c) WhatsApp — monta o link de conversa. */
  function urlWhatsapp(d) {
    const t = encodeURIComponent(
      [
        "Olá! Confirmação para o casamento de ",
        CONFIG.nomes,
        ":",
        "\nNome: ",
        d.nome,
        "\nPresença: ",
        d.presenca,
        d.presenca === "Sim" ? `\nAcompanhantes: ${d.acompanhantes}` : "",
        d.recado ? `\nRecado: ${d.recado}` : "",
      ].join("")
    );
    return `https://wa.me/${CONFIG.whatsappRsvp}?text=${t}`;
  }

  /**
   * Abre o WhatsApp. Devolve false quando o bloqueador de pop-up impede a
   * abertura (o `await` do servidor já consumiu o gesto do usuário) — nesse
   * caso o link é mostrado no feedback para o visitante tocar.
   */
  function enviarWhatsapp(d) {
    return Boolean(window.open(urlWhatsapp(d), "_blank", "noopener"));
  }

  /** (d) E-mail. */
  function enviarEmail(d) {
    window.location.href =
      "mailto:" +
      encodeURIComponent(CONFIG.emailRsvp) +
      "?subject=" +
      encodeURIComponent(`RSVP — ${d.nome}`) +
      "&body=" +
      encodeURIComponent(textoConfirmacao(d));
  }

  /** Cadeia de envio. Devolve o destino usado ou "erro"/"sem-destino". */
  async function enviar(d) {
    fbOk("Enviando sua presença…");

    if (await enviarServidor(d)) return "servidor";

    if (CONFIG.linkPlanilha && (await enviarPlanilha(d))) return "planilha";

    if (CONFIG.whatsappRsvp) {
      return enviarWhatsapp(d) ? "whatsapp" : "whatsapp-bloqueado";
    }

    if (CONFIG.emailRsvp) {
      enviarEmail(d);
      return "email";
    }

    return CONFIG.linkPlanilha ? "erro" : "sem-destino";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const d = montarDados();
    if (!d.nome) {
      mostrarErroNome("Por favor, informe seu nome.");
      fbErro("Por favor, informe seu nome.");
      campo("nome").focus();
      return;
    }
    limparErroNome();

    btnEnviar.disabled = true;
    form.setAttribute("aria-busy", "true");

    let resultado = "erro";
    try {
      resultado = await enviar(d);
    } catch {
      resultado = "erro";
    }

    btnEnviar.disabled = false;
    form.removeAttribute("aria-busy");

    if (resultado === "erro") {
      fbErro(
        "Não conseguimos enviar. Confira o link da planilha ou configure whatsappRsvp/emailRsvp."
      );
      return;
    }
    if (resultado === "sem-destino") {
      fbErro("Nenhum destino configurado (linkPlanilha, whatsappRsvp ou emailRsvp).");
      return;
    }
    if (resultado === "whatsapp-bloqueado") {
      // O navegador bloqueou a nova aba: entregamos o link para tocar.
      feedback.classList.remove("rsvp__feedback--erro");
      feedback.textContent =
        "Não conseguimos abrir o WhatsApp sozinho. Toque no link para enviar sua presença: ";
      const link = document.createElement("a");
      link.href = urlWhatsapp(d);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Abrir o WhatsApp";
      feedback.append(link);
      ajustarAltura();
      return;
    }

    fbOk(
      d.presenca === "Sim"
        ? `Obrigado, ${d.nome.split(" ")[0]}! Sua presença já está na lista. 🤍`
        : `Obrigado, ${d.nome.split(" ")[0]}, por nos avisar. Sentiremos sua falta!`
    );
    form.reset();
  });
})();
