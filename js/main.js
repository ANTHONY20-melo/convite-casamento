/* ============================================================
   CONVITE DE CASAMENTO — Livro com virada de página
   ────────────────────────────────────────────────────────────
   EDITE APENAS O BLOCO "CONFIG" ABAIXO.
   ============================================================ */

const CONFIG = {
  // --- ESSENCIAIS ----------------------------------------------------------
  nomes: "Nome do Noivo & Nome da Noiva", // ex.: "Cecília & Rafael"
  dataExtenso: "Domingo, 15 de agosto de 2027",
  horaCerimonia: "19h00",
  dataEvento: "2027-08-15T19:00:00", // contagem regressiva (AAAA-MM-DDTHH:MM:SS)

  // --- HISTÓRIA (página 2) ---------------------------------------------------
  historia:
    "Foi numa tarde comum que tudo começou: um encontro, uma conversa que não queria terminar e, aos poucos, a certeza de que éramos feitos um para o outro. Desde então, cada dia juntos virou memória — e agora queremos começar nossa maior aventura, cercados de quem amamos.",

  // --- CERIMÔNIA E RECEPÇÃO ------------------------------------------------
  localCerimonia: "Igreja Matriz de São José",
  enderecoCerimonia: "Praça da Matriz, 123 — Centro",
  linkCerimonia: "https://maps.google.com/?q=Igreja+Matriz",

  localRecepcao: "Salão Nobre Vista Verde",
  enderecoRecepcao: "Avenida das Flores, 456 — Jardins",
  linkRecepcao: "https://maps.google.com/?q=Salao+Vista+Verde",

  notaPresenca: "Sua presença é nosso presente maior. Conte com você!",

  // --- EXTRAS --------------------------------------------------------------
  linkListaPresentes: "https://site-da-lista.com",
  prazoRsvpTexto: "15 de julho de 2027",

  // --- PLANILHA DE CONFIRMADOS (formato Excel/Sheets) -----------------------
  // 1) Crie uma planilha no Google Sheets;
  // 2) Extensões → Apps Script → cole o conteúdo de google-apps-script/Code.gs;
  // 3) Implantar → Nova implantação → Aplicativo da Web → copie a URL;
  // 4) Cole a URL aqui. Cada confirmação vira uma linha na planilha
  //    (Arquivo → Baixar → Excel .xlsx a qualquer momento).
  linkPlanilha: "", // ex.: "https://script.google.com/macros/s/AKfy.../exec"

  // --- FALLBACKS caso a planilha não esteja configurada ----------------------
  // Escolha UM dos dois:
  emailRsvp: "noivos@email.com",
  whatsappRsvp: "", // formato: 5511999999999 (DDD + número)

  // --- FALLBACK DE NAVEGAÇÃO (online) ----------------------------------------
  // Se linkPlanilha não estiver configurado, o RSVP usa estes fallbacks:
  // Prioridade: WhatsApp (se preenchido) → E-mail
  prazoRsvpTexto: "15 de julho de 2027",
};

/* ============================================================
   A partir daqui, o código aplica a CONFIG e liga as dinâmicas.
   Em geral NÃO é necessário mexer abaixo.
   ============================================================ */

(function () {
  "use strict";

  // ---------- 1. Aplicar CONFIG no HTML ------------------------------------
  const el = (dataAttr) => document.querySelector(`[data-config="${dataAttr}"]`);

  const textosSimples = {
    nomes: CONFIG.nomes,
    historia: CONFIG.historia,
    localCerimonia: CONFIG.localCerimonia,
    enderecoCerimonia: CONFIG.enderecoCerimonia,
    localRecepcao: CONFIG.localRecepcao,
    enderecoRecepcao: CONFIG.enderecoRecepcao,
    horaCerimonia: CONFIG.horaCerimonia,
    notaPresenca: CONFIG.notaPresenca,
    prazoRsvp: `Por favor, confirme até <strong>${CONFIG.prazoRsvpTexto}</strong>.`,
  };
  for (const [chave, valor] of Object.entries(textosSimples)) {
    const alvo = el(chave);
    if (alvo) alvo.innerHTML = valor;
  }

  const heroDate = el("dataExtenso");
  if (heroDate) {
    heroDate.innerHTML =
      `<strong>${CONFIG.dataExtenso}</strong><span>às ${CONFIG.horaCerimonia}</span>`;
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

  // ---------- 2. Inicialização do livro -----------------------------------
  const paginas = [...document.querySelectorAll(".pagina")];
  const total = paginas.length;
  const btnAnt = document.getElementById("btn-anterior");
  const btnProx = document.getElementById("btn-proximo");
  const rotulo = document.getElementById("paginacao");
  let atual = 0; // índice da página ativa (0 = capa)

  // Elementos de navegação do header (capa)
  const btnAbrir = document.querySelector('.pagina--capa .livro-btn-abrir');

  function goto(indice) {
    indice = Math.max(0, Math.min(total - 1, indice));
    if (indice === atual) return;

    const avancando = indice > atual;

    // 1. Adiciona classe "virando" na página atual (anima de rotação)
    for (let i = 0; i < total; i++) {
      const pg = paginas[i];
      pg.classList.remove("ativa", "virada", "voltar");
      if (avancando) {
        if (i < indice) pg.classList.add("virada");
        if (i === indice) pg.classList.add("ativa");
      } else {
        if (i < indice) pg.classList.add("virada");
        if (i === indice) pg.classList.add("ativa");
      }
    }

    // Pequeno delay para a animação completar, então remove "virada" da página anterior
    setTimeout(() => {
      // Após a virada, a página que saiu fica "virada" para trás (rotateY(-180)),
      // mas como só uma página pode ser "ativa", removemos a classe para evitar
      // conflito visual. A página que entrou ganhou "ativa" e fica com rotateY(0).
      if (avancando && atual < indice) {
        paginas[atual].classList.remove("virada");
      } else if (!avancando && atual > indice) {
        paginas[atual].classList.remove("virada");
      }
    }, 900);

    atual = indice;
    syncNav();
  }

  function syncNav() {
    rotulo.textContent = `Página ${atual + 1} de ${total}`;
    btnAnt.disabled = atual === 0;
    btnProx.disabled = atual === total - 1;
  }

  btnAnt.addEventListener("click", () => goto(atual - 1));
  btnProx.addEventListener("click", () => goto(atual + 1));
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "PageDown") goto(atual + 1);
    if (e.key === "ArrowLeft" || e.key === "PageUp") goto(atual - 1);
  });

  // botões "data-virar" (Abrir convite / Confirmar presença)
  document.querySelectorAll("[data-virar]").forEach((b) =>
    b.addEventListener("click", () => goto(parseInt(b.dataset.virar, 10)))
  );

  syncNav();

  // ---------- 3. Contagem regressiva ----------------------------------------
  const alvoData = new Date(CONFIG.dataEvento);
  const pegarId = (id) => document.getElementById(id);
  const campos = [
    pegarId("cd-dias"),
    pegarId("cd-horas"),
    pegarId("cd-minutos"),
    pegarId("cd-segundos"),
  ];
  const [dias, horas, min, seg] = campos;

  function atualizarContagem() {
    if (Number.isNaN(alvoData.getTime())) return;
    const diff = Math.max(0, alvoData.getTime() - Date.now());
    dias.textContent = String(Math.floor(diff / 86400000));
    horas.textContent = String(Math.floor(diff / 3600000) % 24).padStart(2, "0");
    min.textContent = String(Math.floor(diff / 60000) % 60).padStart(2, "0");
    seg.textContent = String(Math.floor(diff / 1000) % 60).padStart(2, "0");
  }
  atualizarContagem();
  setInterval(atualizarContagem, 1000);

  // ---------- 4. RSVP → planilha (ou fallback) -------------------------------
  const form = document.getElementById("form-rsvp");
  const feedback = document.getElementById("rsvp-feedback");

  const fbOk = (m) => {
    feedback.classList.remove("rsvp__feedback--erro");
    feedback.textContent = m;
  };
  const fbErro = (m) => {
    feedback.classList.add("rsvp__feedback--erro");
    feedback.textContent = m;
  };

  function montarDados() {
    return {
      nome: form.nome.value.trim(),
      presenca: form.presenca.value,
      acompanhantes: Math.max(0, parseInt(form.acompanhantes.value, 10) || 0),
      recado: form.recado.value.trim(),
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

  function enviarPlanilha(d, quandoPronto) {
    // Se houver link da planilha, tenta enviar por Apps Script (no-cors)
    if (CONFIG.linkPlanilha) {
      fbOk("Enviando sua presença…");
      fetch(CONFIG.linkPlanilha, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(d),
      })
        .then(() => quandoPronto())
        .catch(() =>
          // fallback: tenta WhatsApp ou e-mail
          (CONFIG.whatsappRsvp
            ? () => {
                enviarWhatsapp(d);
                quandoPronto();
              }
            : CONFIG.emailRsvp
            ? () => {
                enviarEmail(d);
                quandoPronto();
              }
            : () => {
                fbErro("Não conseguimos enviar. Confira o link da planilha ou configure whatsappRsvp/emailRsvp.");
              })()
        );
    } else if (CONFIG.whatsappRsvp) {
      enviarWhatsapp(d);
      quandoPronto();
    } else if (CONFIG.emailRsvp) {
      enviarEmail(d);
      quandoPronto();
    } else {
      fbErro("Nenhum destino configurado (linkPlanilha, whatsappRsvp ou emailRsvp).");
    }
  }

  function enviarWhatsapp(d) {
    const t = encodeURIComponent(
      ["Olá! Confirmação para o casamento de ", CONFIG.nomes, ":", "\nNome: ", d.nome, "\nPresença: ", d.presenca, d.presenca === "Sim" ? `\nAcompanhantes: ${d.acompanhantes}` : "", d.recado ? `\nRecado: ${d.recado}` : ""].join("")
    );
    window.open(`https://wa.me/${CONFIG.whatsappRsvp}?text=${t}`, "_blank", "noopener");
  }

  function enviarEmail(d) {
    window.location.href =
      "mailto:" +
      encodeURIComponent(CONFIG.emailRsvp) +
      "?subject=" +
      encodeURIComponent(`RSVP — ${d.nome}`) +
      "&body=" +
      encodeURIComponent(textoConfirmacao(d));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const d = montarDados();
    if (!d.nome) {
      fbErro("Por favor, informe seu nome.");
      form.nome.focus();
      return;
    }

    const sucesso = () => {
      fbOk(
        d.presenca === "Sim"
          ? `Obrigado, ${d.nome.split(" ")[0]}! Sua presença já está na lista. 🤍`
          : `Obrigado, ${d.nome.split(" ")[0]}, por nos avisar. Sentiremos sua falta!`
      );
      form.reset();
    };

    if (CONFIG.linkPlanilha) {
      enviarPlanilha(d, sucesso);
    } else if (CONFIG.whatsappRsvp) {
      enviarWhatsapp(d);
      sucesso();
    } else if (CONFIG.emailRsvp) {
      enviarEmail(d);
      sucesso();
    } else {
      fbErro("Nenhum destino configurado (linkPlanilha, whatsappRsvp ou emailRsvp).");
    }
  });
})();