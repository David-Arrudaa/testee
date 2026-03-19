/* =======================================================
   AUTOCAR BS - SISTEMA DE CHECKLIST
   Arquivo Principal de Lógica (JavaScript)
   ======================================================= */

// ==========================================
// 🚀 INICIALIZAÇÃO DO BANCO DE DADOS (SUPABASE)
// ==========================================
const supabaseUrl = "https://jsbnkcejgbyrkguscean.supabase.co";
const supabaseKey = "sb_publishable_uK0anINgIBzPcz5pZXuW5A_TCKjOTf2";

// 👇 MUDAMOS O NOME DE 'supabase' PARA 'supabaseClient' PARA EVITAR CONFLITO 👇
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Faz um teste rápido e silencioso só para ver se conectou
console.log("Conectando ao motor Supabase...");

// ==========================================
// 1. MARCADOR DE COMBUSTÍVEL (Gauge)
// ==========================================
const MAPA_COMBUSTIVEL = [
  { texto: "VAZIO", graus: -90 },
  { texto: "RESERVA / 1/8", graus: -67.5 },
  { texto: "1/4", graus: -45 },
  { texto: "ENTRE 1/4 E 1/2", graus: -22.5 },
  { texto: "1/2", graus: 0 },
  { texto: "ENTRE 1/2 E 3/4", graus: 22.5 },
  { texto: "3/4", graus: 45 },
  { texto: "ENTRE 3/4 E CHEIO", graus: 67.5 },
  { texto: "CHEIO", graus: 90 },
];

function atualizarMarcadorCombustivel(valor) {
  const indice = parseInt(valor);
  const dados = MAPA_COMBUSTIVEL[indice];

  document.getElementById("gauge-pointer").style.transform =
    `rotate(${dados.graus}deg)`;
  document.getElementById("fuel-text-display").innerText = dados.texto;
  document.getElementById("nivel_combustivel").value = dados.texto;
}

// ==========================================
// 2. FUNÇÕES DE DATA E HORA
// ==========================================
function preencherDataHoraAtual() {
  const agora = new Date();
  const dia = String(agora.getDate()).padStart(2, "0");
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const ano = agora.getFullYear();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");

  document.getElementById("data_entrada").value = `${dia}/${mes}/${ano}`;
  document.getElementById("horario_entrada").value = `${horas}:${minutos}`;
}

// ==========================================
// 3. REGRAS DE NEGÓCIO (Luz do Painel)
// ==========================================
function verificarLuzPainel() {
  const luzAcesa = document.querySelector(
    'input[name="luz_painel"]:checked',
  ).value;
  const radioDiagNao = document.getElementById("diag_nao");
  const labelDiagNao = document.getElementById("label_diag_nao");

  if (luzAcesa === "SIM") {
    radioDiagNao.disabled = true;
    labelDiagNao.style.opacity = "0.4";
    labelDiagNao.style.cursor = "not-allowed";
    if (radioDiagNao.checked) radioDiagNao.checked = false;
  } else {
    radioDiagNao.disabled = false;
    labelDiagNao.style.opacity = "1";
    labelDiagNao.style.cursor = "pointer";
  }
}

// ==========================================
// 4. AÇÕES DOS BOTÕES E MODAIS
// ==========================================
function abrirModalLimpar() {
  document.getElementById("modal-confirmacao").classList.remove("hidden");
}

function fecharModalLimpar() {
  document.getElementById("modal-confirmacao").classList.add("hidden");
}

function confirmarLimpeza() {
  const camposTexto = document.querySelectorAll('input[type="text"], textarea');
  camposTexto.forEach((campo) => (campo.value = ""));

  document.querySelector('input[name="guincho"][value="NÃO"]').checked = true;
  document.querySelector('input[name="auth_imagem"][value="SIM"]').checked =
    true;
  document.querySelector('input[name="luz_painel"][value="NÃO"]').checked =
    true;
  document.querySelector('input[name="diagnostico"][value="NÃO"]').checked =
    true;

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((box) => (box.checked = false));

  preencherDataHoraAtual();
  verificarLuzPainel();

  // 👇 🌟 MÁGICA NOVA: LIMPANDO A ASSINATURA DA TELA 🌟 👇
  if (canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
  document.getElementById("assinatura_base64").value = "";

  const previewImg = document.getElementById("preview-assinatura-img");
  if (previewImg) previewImg.src = "";

  document.getElementById("preview-assinatura-container").style.display =
    "none";
  document.getElementById("btn-abrir-assinatura").style.display = "flex";
  // 👆 ======================================================= 👆

  fecharModalLimpar();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================================
// ==========================================
// MÓDULO DE IMPRESSÃO (ORDEM DE SERVIÇO)
// ==========================================

// 1. A "Fábrica" de PDFs (Centraliza a criação do documento)
function gerarPDFImpressao(dados, nivelCombustivel) {
  let valorDiagnostico = "NÃO SOLICITADO";
  if (dados.diagnostico === "POPULAR") valorDiagnostico = "R$ 250,00";
  if (dados.diagnostico === "PREMIUM") valorDiagnostico = "R$ 350,00";

  // Lógica para montar a assinatura blindada (à prova de tablet)
  let imgAssinatura = `<div style="height: 60px;"></div>`;

  if (dados.assinatura_cliente && dados.assinatura_cliente.trim() !== "") {
    // Usamos position: absolute para "cravar" a foto perfeitamente na linha inferior, independente do aparelho
    imgAssinatura = `
      <div style="height: 60px; position: relative;">
        <img src="${dados.assinatura_cliente}" style="max-height: 75px; max-width: 100%; position: absolute; bottom: -8px; left: 0; right: 0; margin: auto; z-index: 10;">
      </div>
    `;
  }

  let assinaturasHtml = "";
  if (dados.guincho === "SIM") {
    assinaturasHtml = `
      <div style="width: 30%; text-align: center;">
        ${imgAssinatura}
        <div style="border-top: 1px solid #000; padding-top: 5px; position: relative; z-index: 1;">Assinatura do Cliente</div>
      </div>
      <div style="width: 30%; text-align: center;">
        <div style="height: 60px;"></div>
        <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Responsável</div>
      </div>
      <div style="width: 30%; text-align: center;">
        <div style="height: 60px;"></div>
        <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Guincho</div>
      </div>
    `;
  } else {
    assinaturasHtml = `
      <div style="width: 40%; text-align: center;">
        ${imgAssinatura}
        <div style="border-top: 1px solid #000; padding-top: 5px; position: relative; z-index: 1;">Assinatura do Cliente</div>
      </div>
      <div style="width: 40%; text-align: center;">
        <div style="height: 60px;"></div>
        <div style="border-top: 1px solid #000; padding-top: 5px;">Assinatura do Responsável Técnico</div>
      </div>
    `;
  }

  const logoUrl = new URL(
    "img/logo-preta.png",
    window.location.origin + window.location.pathname,
  ).href;

  const htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Checklist - ${dados.veiculo_placa}</title>
        <style>
          @page { size: A4 portrait; margin: 10mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; margin: 10mm; color: #000; line-height: 1.5; }
          .header { display: flex; justify-content: center; align-items: center; gap: 40px; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
          .header-title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .box { border: 1px solid #000; margin-bottom: 18px; border-radius: 4px; overflow: hidden; }
          .box-header { background: #eee; padding: 4px 8px; font-weight: bold; border-bottom: 1px solid #000; font-size: 12px; text-transform: uppercase; }
          .box-content { padding: 6px; }
          .row { display: flex; flex-wrap: wrap; }
          .col { flex: 1; padding: 2px 4px; border-right: 1px solid #ddd; min-width: 80px; }
          .col:last-child { border-right: none; }
          .label { font-weight: bold; display: block; font-size: 10px; color: #444; margin-bottom: 1px; }
          .value { display: block; font-size: 13px; text-transform: uppercase; font-weight: 600; min-height: 16px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; }
          .auth-section { font-size: 11px; margin-bottom: 15px; }
          .auth-row { margin-bottom: 6px; display: flex; align-items: center; }
          .auth-check { font-family: monospace; font-weight: bold; margin-right: 12px; min-width: 100px; }
          .auth-text { flex: 1; font-weight: bold; text-transform: uppercase; }
          @media print {
            .box-header { background: #ddd !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" style="width: 200px; height: 65px; object-fit: contain;" alt="Logo Autocar" />
          <div class="header-title">CHECKLIST DE ENTRADA</div>
        </div>

        <div class="box">
          <div class="box-header">Detalhes da Entrada</div>
          <div class="box-content row">
            <div class="col" style="max-width: 250px;"><span class="label">DATA / HORA</span><span class="value">${dados.data_entrada} às ${dados.horario_entrada}</span></div>
            <div class="col"><span class="label">MECÂNICO RESPONSÁVEL</span><span class="value">${dados.mecanico_responsavel || "-"}</span></div>
          </div>
        </div>

        <div class="box">
          <div class="box-header">Dados do Cliente</div>
          <div class="box-content row">
            <div class="col"><span class="label">NOME</span><span class="value">${dados.cliente_nome || "-"}</span></div>
            <div class="col"><span class="label">CPF</span><span class="value">${dados.cliente_cpf || "-"}</span></div>
            <div class="col"><span class="label">TELEFONE</span><span class="value">${dados.cliente_telefone || "-"}</span></div>
          </div>
        </div>

        <div class="box">
          <div class="box-header">Dados do Veículo</div>
          <div class="box-content row">
            <div class="col"><span class="label">PLACA</span><span class="value">${dados.veiculo_placa || "-"}</span></div>
            <div class="col"><span class="label">MARCA/VERSÃO</span><span class="value">${dados.veiculo_marca || "-"} ${dados.veiculo_versao || "-"}</span></div>
            <div class="col"><span class="label">COR</span><span class="value">${dados.veiculo_cor || "-"}</span></div>
            <div class="col"><span class="label">ANO</span><span class="value">${dados.veiculo_ano_modelo || "-"}</span></div>
          </div>
          <div class="box-content row" style="border-top: 1px solid #ddd;">
            <div class="col"><span class="label">CHASSI</span><span class="value">${dados.veiculo_chassi || "-"}</span></div>
            <div class="col"><span class="label">KM ATUAL</span><span class="value">${dados.veiculo_km || "-"}</span></div>
            <div class="col"><span class="label">COMBUSTÍVEL</span><span class="value">${dados.combustivel || "-"}</span></div>
            <div class="col"><span class="label">NÍVEL NO TANQUE</span><span class="value">${nivelCombustivel}</span></div>
          </div>
          <div class="box-content row" style="border-top: 1px solid #ddd;">
            <div class="col"><span class="label">CÂMBIO</span><span class="value">${dados.cambio || "-"}</span></div>
            <div class="col"><span class="label">PORTAS</span><span class="value">${dados.portas || "-"}</span></div>
            <div class="col"></div> <div class="col"></div>
          </div>
        </div>

        <div class="box">
          <div class="box-header">Serviço Solicitado (Relato do Cliente)</div>
          <div class="box-content" style="min-height: 50px;">
            <span class="value" style="font-size: 12px; text-transform: none;">${dados.servico_solicitado || "Nenhum detalhe adicional informado."}</span>
          </div>
        </div>

        <div class="box">
          <div class="box-header">Checklist / Avarias / Diagnóstico</div>
          <div class="box-content row">
            <div class="col"><span class="label">GUINCHO?</span><span class="value">${dados.guincho || "-"}</span></div>
            <div class="col"><span class="label">LUZ DE PAINEL?</span><span class="value">${dados.luz_painel || "-"}</span></div>
            <div class="col"><span class="label">DOC. NO VEÍCULO?</span><span class="value">${dados.documento_no_veiculo || "-"}</span></div>
          </div>
        </div>

        <div class="auth-section">
          <div class="auth-row">
            <div class="auth-check">[ ${dados.auth_imagem === "SIM" ? "X" : "&nbsp;"} ] SIM &nbsp;&nbsp; [ ${dados.auth_imagem === "NÃO" ? "X" : "&nbsp;"} ] NÃO</div>
            <div class="auth-text">Autoriza o uso de imagem (restrição de placa para divulgação)?</div>
          </div>
          <div class="auth-row">
            <div class="auth-check">[ ${dados.diagnostico !== "NÃO" ? "X" : "&nbsp;"} ] SIM &nbsp;&nbsp; [ ${dados.diagnostico === "NÃO" ? "X" : "&nbsp;"} ] NÃO</div>
            <div class="auth-text">Diagnóstico Técnico Solicitado: ${valorDiagnostico}</div>
          </div>
        </div>

        <div class="footer" style="margin-top: 50px; display: flex; justify-content: space-around;">
          ${assinaturasHtml}
        </div>
      </body>
      </html>
    `;

  const win = window.open("", "", "height=800,width=900");
  win.document.write(htmlContent);
  win.document.close();

  setTimeout(() => {
    win.focus();
    win.print();
  }, 2500);
}

// 2. Botão de Imprimir da Tela Principal (Lê a tela e manda pra Fábrica)
document.getElementById("btn-imprimir").addEventListener("click", () => {
  const form = document.getElementById("form-checklist");
  const formData = new FormData(form);
  const dados = Object.fromEntries(formData.entries());
  const nivelCombustivel =
    document.getElementById("nivel_combustivel").value || "VAZIO";

  gerarPDFImpressao(dados, nivelCombustivel);
});

// 3. Nova Função: Botão de Imprimir do Histórico (Lê o banco e manda pra Fábrica)
function imprimirDoHistorico(index) {
  const dados = bancoChecklists[index];
  const nivelCombustivel = dados.nivel_combustivel || "VAZIO";

  gerarPDFImpressao(dados, nivelCombustivel);
}

function abrirHistorico() {
  document.getElementById("modal-historico").classList.remove("hidden");
}

function fecharHistorico() {
  document.getElementById("modal-historico").classList.add("hidden");
}

function alternarTema() {
  const iconeTema = document.getElementById("icone-tema");
  // 1. O JS "pesga" a imagem da logo pelo ID
  const logoImg = document.getElementById("logo-autocar");

  document.body.classList.toggle("light-theme");

  if (document.body.classList.contains("light-theme")) {
    // Modo Claro ativado
    iconeTema.classList.replace("ph-sun", "ph-moon");
    // 2. Muda o caminho da imagem para a preta
    logoImg.src = "img/logo-preta.png";
  } else {
    // Modo Escuro ativado
    iconeTema.classList.replace("ph-moon", "ph-sun");
    // 3. Volta o caminho da imagem para a branca
    logoImg.src = "img/logo-branca.png";
  }
}

// Memória do sistema para saber o que imprimir
let ultimoChecklistSalvo = null;

function abrirModalSucesso(mensagem, mostrarBotaoImprimir = false) {
  document.getElementById("texto-modal-sucesso").innerText = mensagem;
  document.getElementById("modal-sucesso").classList.remove("hidden");

  // Controla se o botão de imprimir aparece ou não
  const btnImprimir = document.getElementById("btn-imprimir-sucesso");
  if (btnImprimir) {
    btnImprimir.style.display = mostrarBotaoImprimir ? "inline-flex" : "none";
  }
}

function fecharModalSucesso() {
  document.getElementById("modal-sucesso").classList.add("hidden");
}

// Ação do novo botão de Imprimir dentro do Modal de Sucesso
document
  .getElementById("btn-imprimir-sucesso")
  .addEventListener("click", () => {
    if (ultimoChecklistSalvo) {
      // Puxa o nível de combustível da tela (ou vazio se não achar)
      const nivelCombustivel = document.getElementById("nivel_combustivel")
        ? document.getElementById("nivel_combustivel").value
        : "VAZIO";

      // Manda pra fábrica de PDFs!
      gerarPDFImpressao(ultimoChecklistSalvo, nivelCombustivel);

      // (Opcional) Fecha o modal de sucesso depois que abrir a impressão
      fecharModalSucesso();
    }
  });

function abrirModalAviso(mensagem) {
  document.getElementById("texto-modal-aviso").innerText = mensagem;
  document.getElementById("modal-aviso").classList.remove("hidden");
}

function fecharModalAviso() {
  document.getElementById("modal-aviso").classList.add("hidden");
}

// ==========================================
// 5. BANCO DE CHECKLISTS E HISTÓRICO
// ==========================================
let bancoChecklists = [];
let paginaAtualClientes = 1;
const clientesPorPagina = 10;

// 1. Puxa os checklists DIRETAMENTE DAS NUVENS (Supabase)
// 1. Puxa os checklists DIRETAMENTE DAS NUVENS (Supabase)
async function carregarBancoChecklists() {
  try {
    // 👇 ADICIONAMOS O 'id' AQUI NO SELECT 👇
    const { data, error } = await supabaseClient
      .from("historico_checklists")
      .select("id, dados_checklist")
      .order("created_at", { ascending: false });

    if (error) throw error;

    bancoChecklists = [];

    if (data && data.length > 0) {
      data.forEach((linha) => {
        // Pegamos o pacote e "colamos" o ID da nuvem nele
        let pacote = linha.dados_checklist;
        pacote.id_nuvem = linha.id; // 👈 MÁGICA: Guarda o ID verdadeiro!

        bancoChecklists.push(pacote);
      });
    }

    renderizarTabelaClientes();
    console.log("Histórico baixado das nuvens com sucesso!");
  } catch (erro) {
    console.error("Erro ao puxar o histórico da nuvem:", erro);
    const dadosSalvos = localStorage.getItem("autocar_checklists");
    if (dadosSalvos) {
      bancoChecklists = JSON.parse(dadosSalvos);
      renderizarTabelaClientes();
    }
  }
}

// 2. Salva os checklists no navegador
function salvarBancoChecklists() {
  localStorage.setItem("autocar_checklists", JSON.stringify(bancoChecklists));
}

// Já carrega assim que o JS roda!
carregarBancoChecklists();

// 3. Desenha a tabela agrupando os checklists por Cliente
function renderizarTabelaClientes() {
  const tbody = document.getElementById("lista-clientes-tabela");
  const termoBusca = document
    .getElementById("busca-historico")
    .value.toUpperCase();
  const btnPrev = document.getElementById("btn-prev-page");
  const btnNext = document.getElementById("btn-next-page");
  const infoPagina = document.getElementById("info-pagina");

  const agrupados = {};

  // Agrupa os checklists por cliente, lembrando quem veio primeiro (o mais novo)
  bancoChecklists.forEach((chk, index) => {
    const nome = (chk.cliente_nome || "SEM NOME").toUpperCase();
    if (!agrupados[nome]) {
      agrupados[nome] = {
        nome: nome,
        qtd: 0,
        ultima: chk.data_entrada,
        horario: chk.horario_entrada,
        ordem_chegada: index, // 👈 MÁGICA 2: Salva a posição exata de quem é o mais novo!
      };
    }
    agrupados[nome].qtd++;
  });

  let listaAgrupada = Object.values(agrupados);

  // 🌟 A REGRA DE OURO: Ordena a lista para o mais recente ficar sempre no topo!
  listaAgrupada.sort((a, b) => a.ordem_chegada - b.ordem_chegada);

  let clientesFiltrados = listaAgrupada.filter((cliente) =>
    cliente.nome.includes(termoBusca),
  );

  const totalPaginas =
    Math.ceil(clientesFiltrados.length / clientesPorPagina) || 1;
  if (paginaAtualClientes > totalPaginas) paginaAtualClientes = 1;

  const inicio = (paginaAtualClientes - 1) * clientesPorPagina;
  const fim = inicio + clientesPorPagina;
  const clientesDaPagina = clientesFiltrados.slice(inicio, fim);

  tbody.innerHTML = "";

  if (clientesDaPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">Nenhum checklist salvo.</td></tr>`;
    btnPrev.disabled = true;
    btnNext.disabled = true;
    infoPagina.innerText = `Página 0 de 0`;
  } else {
    clientesDaPagina.forEach((cliente) => {
      // Deixei o visual da data/hora mais limpo para você ver exatamente quando ele entrou
      tbody.innerHTML += `
        <tr>
          <td><strong>${cliente.nome}</strong></td>
          <td><span class="badge" style="background: var(--bg-body); color: var(--text-primary); border: 1px solid #444;">${cliente.qtd} entrada(s)</span></td>
          <td>${cliente.ultima} ${cliente.horario ? "às " + cliente.horario : ""}</td>
          <td style="text-align: right">
            <button class="icon-btn" style="display:inline-flex; padding: 6px; border:none;" title="Ver Checklists" onclick="abrirDetalhesCliente('${cliente.nome}')">
              <i class="ph ph-list-bullets" style="font-size: 1.2rem; color: var(--primary);"></i>
            </button>
          </td>
        </tr>`;
    });
    infoPagina.innerText = `Página ${paginaAtualClientes} de ${totalPaginas}`;
    btnPrev.disabled = paginaAtualClientes === 1;
    btnNext.disabled = paginaAtualClientes === totalPaginas;
  }

  btnPrev.style.opacity = btnPrev.disabled ? "0.3" : "1";
  btnPrev.style.cursor = btnPrev.disabled ? "not-allowed" : "pointer";
  btnNext.style.opacity = btnNext.disabled ? "0.3" : "1";
  btnNext.style.cursor = btnNext.disabled ? "not-allowed" : "pointer";
}

// ==========================================
// FUNÇÕES DO MODAL DE DETALHES DO CLIENTE
// ==========================================
function abrirDetalhesCliente(nomeCliente) {
  const tbody = document.getElementById("lista-checklists-cliente-tabela");
  tbody.innerHTML = "";
  document.getElementById("titulo-cliente").innerHTML =
    `<i class="ph ph-user"></i> Histórico: ${nomeCliente}`;

  // Procura no banco os checklists do cliente e desenha a tabela
  bancoChecklists.forEach((chk, index) => {
    if ((chk.cliente_nome || "SEM NOME").toUpperCase() === nomeCliente) {
      const placa = chk.veiculo_placa || "-";
      const veiculo = `${chk.veiculo_marca || ""} ${chk.veiculo_versao || ""}`;
      const data = chk.data_entrada || "-";

      tbody.innerHTML += `
        <tr>
          <td><span class="badge" style="background: var(--primary); color: white;">SALVO</span></td>
          <td><strong>${placa}</strong></td>
          <td>${veiculo}</td>
          <td>${data}</td>
          <td style="text-align: right;">
            <div style="display: flex; justify-content: flex-end; gap: 8px;">
              <button type="button" class="icon-btn" title="Visualizar Checklist" onclick="carregarChecklistNaTela(${index})">
                <i class="ph ph-eye" style="font-size: 1.2rem; color: var(--primary);"></i>
              </button>
              
              <button type="button" class="icon-btn" title="Imprimir OS" onclick="imprimirDoHistorico(${index})" style="color: var(--text-primary);">
                <i class="ph ph-printer" style="font-size: 1.2rem;"></i>
              </button>
              <button type="button" class="icon-btn btn-danger" title="Excluir Checklist" onclick="excluirChecklist(${index}, '${nomeCliente}')">
                <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  });

  document.getElementById("modal-historico").classList.add("hidden");
  document.getElementById("modal-cliente").classList.remove("hidden");
}

function fecharDetalhesCliente() {
  document.getElementById("modal-cliente").classList.add("hidden");
  document.getElementById("modal-historico").classList.remove("hidden");
}

// Variáveis para o sistema lembrar o que você quer apagar
let checklistIndexParaExcluir = -1;
let nomeClienteChecklistParaExcluir = "";

function excluirChecklist(index, nomeCliente) {
  // Abre o modal BONITO em vez do alerta feio
  checklistIndexParaExcluir = index;
  nomeClienteChecklistParaExcluir = nomeCliente;
  document.getElementById("modal-excluir-checklist").classList.remove("hidden");
}

function fecharModalExcluirChecklist() {
  document.getElementById("modal-excluir-checklist").classList.add("hidden");
  checklistIndexParaExcluir = -1;
  nomeClienteChecklistParaExcluir = "";
}

async function confirmarExclusaoChecklist() {
  if (checklistIndexParaExcluir > -1) {
    try {
      // Muda o botão para mostrar que está apagando
      const btnConfirmar = document.getElementById(
        "btn-confirmar-excluir-checklist",
      );
      const textoOriginal = btnConfirmar.innerHTML;
      btnConfirmar.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Excluindo...`;
      btnConfirmar.disabled = true;

      // 1. Descobre qual é o ID verdadeiro desse checklist lá na nuvem
      const checklistAlvo = bancoChecklists[checklistIndexParaExcluir];
      const idNaNuvem = checklistAlvo.id_nuvem;

      // 2. Se ele tem ID na nuvem, manda o Supabase DELETAR DE VERDADE!
      if (idNaNuvem) {
        const { error } = await supabaseClient
          .from("historico_checklists")
          .delete()
          .eq("id", idNaNuvem);

        if (error) throw error;
      }

      // 3. Remove da memória da tela (limpa do visual)
      bancoChecklists.splice(checklistIndexParaExcluir, 1);
      salvarBancoChecklists();
      renderizarTabelaClientes();

      // 4. Verifica se o cliente ainda tem outro checklist salvo
      const aindaTemChecklist = bancoChecklists.some(
        (chk) =>
          (chk.cliente_nome || "SEM NOME").toUpperCase() ===
          nomeClienteChecklistParaExcluir,
      );

      if (aindaTemChecklist) {
        abrirDetalhesCliente(nomeClienteChecklistParaExcluir);
      } else {
        fecharDetalhesCliente();
      }

      // 5. Fecha a pergunta e mostra o sucesso!
      fecharModalExcluirChecklist();
      abrirModalSucesso("Checklist excluído definitivamente das Nuvens!");

      // Volta o botão ao normal
      btnConfirmar.innerHTML = textoOriginal;
      btnConfirmar.disabled = false;
    } catch (erro) {
      console.error("Erro ao excluir das nuvens:", erro);
      alert(
        "🚨 Erro ao excluir o checklist. Verifique sua conexão com a internet.",
      );

      // Em caso de erro, solta o botão
      const btnConfirmar = document.getElementById(
        "btn-confirmar-excluir-checklist",
      );
      btnConfirmar.innerHTML = "Sim, Excluir";
      btnConfirmar.disabled = false;
    }
  }
}

// A MÁGICA DE PREENCHER TUDO DE NOVO
function carregarChecklistNaTela(index) {
  const chk = bancoChecklists[index];

  // 1. Fecha os modais de histórico
  fecharDetalhesCliente();
  fecharHistorico();

  // 2. Preenche todos os campos de texto automaticamente
  Object.keys(chk).forEach((chave) => {
    const campo = document.getElementById(chave);
    if (
      campo &&
      campo.type !== "radio" &&
      campo.type !== "checkbox" &&
      campo.type !== "file"
    ) {
      campo.value = chk[chave];
    }

    // 3. Marca as "bolinhas" (Radios) corretas (Combustível, Guincho, Portas, etc)
    const radios = document.querySelectorAll(`input[name="${chave}"]`);
    radios.forEach((radio) => {
      if (radio.value === chk[chave]) {
        radio.checked = true;
      }
    });
  });

  // 👇 🌟 RECUPERANDO A ASSINATURA DA NUVEM PARA A TELA 🌟 👇
  const inputBase64 = document.getElementById("assinatura_base64");
  const previewContainer = document.getElementById(
    "preview-assinatura-container",
  );
  const previewImg = document.getElementById("preview-assinatura-img");
  const btnAbrirAssinatura = document.getElementById("btn-abrir-assinatura");

  if (chk.assinatura_cliente && chk.assinatura_cliente.trim() !== "") {
    // Se tem assinatura salva, coloca no formulário invisível e mostra a imagem!
    if (inputBase64) inputBase64.value = chk.assinatura_cliente;
    if (previewImg) previewImg.src = chk.assinatura_cliente;
    if (previewContainer) previewContainer.style.display = "block";
    if (btnAbrirAssinatura) btnAbrirAssinatura.style.display = "none";
  } else {
    // Se for um checklist bem antigo que não tinha assinatura ainda, limpa tudo
    if (inputBase64) inputBase64.value = "";
    if (previewImg) previewImg.src = "";
    if (previewContainer) previewContainer.style.display = "none";
    if (btnAbrirAssinatura) btnAbrirAssinatura.style.display = "flex";
  }
  // 👆 ======================================================= 👆

  // 4. Arruma o ponteiro visual de Combustível
  const nivelTexto = chk.nivel_combustivel;
  const indiceCombustivel = MAPA_COMBUSTIVEL.findIndex(
    (item) => item.texto === nivelTexto,
  );
  if (indiceCombustivel !== -1) {
    document.getElementById("fuel-slider").value = indiceCombustivel;
    if (typeof atualizarMarcadorCombustivel === "function") {
      atualizarMarcadorCombustivel(indiceCombustivel);
    }
  }

  // 5. Muda o Visual do Topo (Mostra que estamos visualizando algo antigo)
  document.getElementById("status-edicao").innerText = "VISUALIZANDO HISTÓRICO";
  document.getElementById("status-edicao").style.background = "var(--primary)";
  document.getElementById("status-edicao").style.color = "#FFFFFF";
  document.getElementById("btn-cancelar-edicao").style.display = "flex";

  // Troca o botão de Salvar pelo de Imprimir!
  document.getElementById("btn-salvar-entrada").style.display = "none";
  document.getElementById("btn-imprimir").style.display = "flex";

  // Rola a tela pro topo para o mecânico ver
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fecharDetalhesCliente() {
  // Faz o inverso: fecha a individual e volta pra geral
  document.getElementById("modal-cliente").classList.add("hidden");
  document.getElementById("modal-historico").classList.remove("hidden");
}

function mudarPagina(direcao) {
  paginaAtualClientes += direcao;
  renderizarTabelaClientes();
}

// ==========================================
// 6. INTEGRAÇÃO VIACEP (Busca de Endereço Inteligente)
// ==========================================
async function buscarCEP(cep, tipoFormulario) {
  const cepLimpo = cep.replace(/\D/g, "");
  if (cepLimpo.length !== 8) return;

  // 1. A MÁGICA: Define o prefixo dos IDs com base em quem chamou a função!
  const prefixo = tipoFormulario === "cadastro" ? "cad_cliente_" : "cliente_";
  const idIcone =
    tipoFormulario === "cadastro" ? "icon-cad-cep-loading" : "icon-cep-loading";

  const inputCep = document.getElementById(prefixo + "cep");
  const iconeCep = document.getElementById(idIcone);

  try {
    inputCep.parentElement.classList.add("input-loading");
    if (iconeCep) {
      iconeCep.classList.replace("ph-magnifying-glass", "ph-spinner");
      iconeCep.classList.add("ph-spin");
    }

    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("Opa! Esse CEP não foi encontrado.");
      return;
    }

    // 2. Preenche os campos usando o prefixo inteligente
    document.getElementById(prefixo + "endereco").value = dados.logradouro;
    document.getElementById(prefixo + "bairro").value = dados.bairro;
    document.getElementById(prefixo + "cidade").value = dados.localidade;

    // O campo de UF nós só colocamos no formulário principal, então o JS verifica se ele existe antes de preencher
    const campoUF = document.getElementById(prefixo + "uf");
    if (campoUF) campoUF.value = dados.uf;

    document.getElementById(prefixo + "numero").focus();
  } catch (erro) {
    console.error("Erro ao buscar CEP:", erro);
    alert("Erro ao buscar o CEP. Verifique sua conexão com a internet.");
  } finally {
    inputCep.parentElement.classList.remove("input-loading");
    if (iconeCep) {
      iconeCep.classList.replace("ph-spinner", "ph-magnifying-glass");
      iconeCep.classList.remove("ph-spin");
    }
  }
}

// ==========================================
// INTEGRAÇÃO API DE PLACAS (Placas.app.br)
// ==========================================
async function buscarPlacaAPI(placaDigitada) {
  // 1. Limpa o traço para a API entender (ex: vira ABC1234)
  const placaLimpa = placaDigitada.replace(/[^a-zA-Z0-9]/g, "");

  // Se não tiver 7 dígitos exatos, ele cancela para não gastar sua requisição
  if (placaLimpa.length !== 7) return;

  const inputPlaca = document.getElementById("temp_veiculo_placa");

  // 👇 DADOS DO SEU INSOMNIA 👇
  // URL original da API
  const urlApiOriginal = "https://placas.app.br/api/v1/placas/numero";

  // URL do Proxy "Laranja" para enganar o navegador e pular o CORS
  const urlApi = "https://corsproxy.io/?" + encodeURIComponent(urlApiOriginal);

  // Cole aqui o seu token JWT completo (aquele grandão que começa com eyJhb...)
  const tokenPlacas = "COLE_SEU_TOKEN_AQUI";

  try {
    inputPlaca.style.opacity = "0.5"; // Efeito de carregando

    const resposta = await fetch(urlApi, {
      method: "POST", // Mudamos para POST conforme o Insomnia
      headers: {
        Authorization: `Bearer ${tokenPlacas}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        placa: placaLimpa, // Envia a placa no formato que a API exigiu
      }),
    });

    const dados = await resposta.json();

    // ⚠️ IMPRIME NO CONSOLE PARA VOCÊ VER A ESTRUTURA
    console.log("Resposta da API de Placas:", dados);

    // 2. Preenche as caixinhas se a API não retornar erro
    if (dados) {
      // ATENÇÃO: Verifique no console.log se os nomes (marca, modelo) batem com os que a API devolve
      document.getElementById("temp_veiculo_marca").value = (
        dados.marca || ""
      ).toUpperCase();
      document.getElementById("temp_veiculo_modelo").value = (
        dados.modelo || ""
      ).toUpperCase();
      document.getElementById("temp_veiculo_cor").value = (
        dados.cor || ""
      ).toUpperCase();
      document.getElementById("temp_veiculo_chassi").value = (
        dados.chassi || ""
      ).toUpperCase();

      // Monta o ano no padrão da oficina
      if (dados.anoFabricacao && dados.anoModelo) {
        document.getElementById("temp_veiculo_ano").value =
          `${dados.anoFabricacao}/${dados.anoModelo}`;
      } else if (dados.ano) {
        document.getElementById("temp_veiculo_ano").value = dados.ano;
      }

      document.getElementById("temp_veiculo_combustivel").focus();
    }
  } catch (erro) {
    console.error("Erro ao buscar a placa:", erro);
  } finally {
    inputPlaca.style.opacity = "1";
  }
}

// ==========================================
// 7. MÁSCARAS DE ENTRADA (Formatação Automática)
// ==========================================
const mascaras = {
  cpf(valor) {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  },
  telefone(valor) {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  },
  cep(valor) {
    return valor
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{3})\d+?$/, "$1");
  },
  placa(valor) {
    return valor
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .replace(/^([A-Z]{3})(\d)/, "$1-$2")
      .substring(0, 8);
  },

  km(valor) {
    return valor
      .replace(/\D/g, "") // Remove tudo que não for número
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."); // Mágica: coloca um ponto a cada 3 casas
  },

  chassi(valor) {
    return valor
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "") // Remove tudo que não for letra ou número (impede símbolos e espaços)
      .substring(0, 17); // Limita a 17 caracteres
  },

  ano_modelo(valor) {
    let v = valor.replace(/\D/g, ""); // Só deixa digitar números
    if (v.length > 4) {
      v = v.replace(/^(\d{4})(\d{0,4}).*/, "$1/$2"); // Se passar de 4 números (2012), ele bota a barra sozinho (2012/2013)
    }
    return v;
  },

  data(valor) {
    return valor
      .replace(/\D/g, "") // Só números
      .replace(/(\d{2})(\d)/, "$1/$2") // Barra depois do dia
      .replace(/(\d{2})(\d)/, "$1/$2") // Barra depois do mês
      .substring(0, 10); // Trava em DD/MM/AAAA
  },
};

function aplicarMascara(evento) {
  const input = evento.target;
  // Olha pro HTML e descobre qual máscara esse input pediu
  const tipoMascara = input.getAttribute("data-mascara");

  // Se a máscara existir na nossa lista, aplica ela enquanto o usuário digita
  if (mascaras[tipoMascara]) {
    input.value = mascaras[tipoMascara](input.value);
  }
}

// ==========================================
// 8. INICIALIZAÇÃO (O "Motor de Partida")
// ==========================================

// ==========================================
// FUNÇÕES DE AUTOMAÇÃO DO CHECKLIST (SUPABASE)
// ==========================================
async function atualizarSugestoesClientes(termoPesquisa = "") {
  const datalist = document.getElementById("lista-clientes-sugestao");
  if (!datalist) return;

  datalist.innerHTML = "";
  if (termoPesquisa.length < 3) return; // Só busca se tiver 3 letras ou mais

  try {
    // Vai na nuvem e busca até 5 nomes parecidos com o que foi digitado
    const { data: clientes, error } = await supabaseClient
      .from("clientes")
      .select("nome")
      .ilike("nome", `%${termoPesquisa}%`)
      .limit(5);

    if (error) throw error;

    clientes.forEach((cliente) => {
      datalist.innerHTML += `<option value="${cliente.nome}"></option>`;
    });
  } catch (erro) {
    console.error("Erro ao buscar sugestões:", erro);
  }
}

function preencherVeiculoChecklist(veiculo) {
  // Puxa as informações do banco para o Checklist Principal
  document.getElementById("veiculo_placa").value = veiculo.placa || "";
  document.getElementById("veiculo_marca").value = veiculo.marca || "";

  const campoVersao = document.getElementById("veiculo_versao");
  if (campoVersao) campoVersao.value = veiculo.modelo || "";

  const campoChassi = document.getElementById("veiculo_chassi");
  if (campoChassi) campoChassi.value = veiculo.chassi || "";

  const campoAno = document.getElementById("veiculo_ano_modelo");
  if (campoAno) campoAno.value = veiculo.ano || "";

  const campoCor = document.getElementById("veiculo_cor");
  if (campoCor) campoCor.value = veiculo.cor || "";

  // (Removido o preenchimento automático de KM daqui. O mecânico terá que digitar na hora!)

  // Mágica do Combustível: Encontra o "radio button" correto e clica nele!
  if (veiculo.combustivel) {
    const radioCombustivel = document.querySelector(
      `input[name="combustivel"][value="${veiculo.combustivel}"]`,
    );
    if (radioCombustivel) radioCombustivel.checked = true;
  }
}

function abrirSelecaoVeiculos(veiculos) {
  const container = document.getElementById("lista-botoes-veiculos");
  if (!container) return;

  container.innerHTML = "";

  veiculos.forEach((veiculo) => {
    const btn = document.createElement("button");
    btn.className = "btn btn-secondary";
    btn.style.justifyContent = "center";
    btn.innerHTML = `<strong>${veiculo.placa}</strong> &nbsp;-&nbsp; ${veiculo.marca} ${veiculo.modelo}`;

    btn.onclick = function () {
      preencherVeiculoChecklist(veiculo);
      document
        .getElementById("modal-selecionar-veiculo")
        .classList.add("hidden");
    };
    container.appendChild(btn);
  });
  document
    .getElementById("modal-selecionar-veiculo")
    .classList.remove("hidden");
}

window.onload = function () {
  preencherDataHoraAtual();
  verificarLuzPainel();

  // Evento da Luz do Painel
  const radiosLuzPainel = document.querySelectorAll('input[name="luz_painel"]');
  radiosLuzPainel.forEach((radio) => {
    radio.addEventListener("change", verificarLuzPainel);
  });

  // Eventos dos Botões do Cabeçalho
  document
    .getElementById("btn-limpar")
    .addEventListener("click", abrirModalLimpar);
  document
    .getElementById("btn-historico")
    .addEventListener("click", abrirHistorico);
  document.getElementById("btn-tema").addEventListener("click", alternarTema);

  // Eventos da Modal de Limpar
  document
    .getElementById("btn-cancelar-limpar")
    .addEventListener("click", fecharModalLimpar);
  document
    .getElementById("btn-confirmar-limpar")
    .addEventListener("click", confirmarLimpeza);
  // Ligar botão do modal de sucesso
  document
    .getElementById("btn-fechar-sucesso")
    .addEventListener("click", fecharModalSucesso);

  // Ligar botão do modal de aviso
  document
    .getElementById("btn-fechar-aviso")
    .addEventListener("click", fecharModalAviso);

  // Ligar os botões do Modal de Exclusão de Checklist
  document
    .getElementById("btn-cancelar-excluir-checklist")
    .addEventListener("click", fecharModalExcluirChecklist);
  document
    .getElementById("btn-confirmar-excluir-checklist")
    .addEventListener("click", confirmarExclusaoChecklist);

  // Eventos da Modal de Histórico
  document
    .getElementById("btn-fechar-historico")
    .addEventListener("click", fecharHistorico);

  document
    .getElementById("btn-fechar-modal-cliente")
    .addEventListener("click", fecharDetalhesCliente);

  // Primeira renderização da tabela
  renderizarTabelaClientes();

  // Eventos de Busca e Paginação do Histórico
  document
    .getElementById("busca-historico")
    .addEventListener("input", function () {
      paginaAtualClientes = 1;
      renderizarTabelaClientes();
    });

  document
    .getElementById("btn-prev-page")
    .addEventListener("click", function () {
      if (!this.disabled) mudarPagina(-1);
    });

  document
    .getElementById("btn-next-page")
    .addEventListener("click", function () {
      if (!this.disabled) mudarPagina(1);
    });

  // LIGANDO O VIACEP NO CHECKLIST PRINCIPAL
  document.getElementById("cliente_cep").addEventListener("blur", function () {
    buscarCEP(this.value, "checklist");
  });

  // LIGANDO O VIACEP NO MODAL DE CADASTRO DE CLIENTE
  document
    .getElementById("cad_cliente_cep")
    .addEventListener("blur", function () {
      buscarCEP(this.value, "cadastro");
    });

  // LIGANDO A BUSCA DE PLACA AUTOMÁTICA
  document
    .getElementById("temp_veiculo_placa")
    .addEventListener("blur", function () {
      buscarPlacaAPI(this.value);
    });

  // LIGANDO AS MÁSCARAS
  document.querySelectorAll("[data-mascara]").forEach((input) => {
    input.addEventListener("input", aplicarMascara);
  });

  // Força o Serviço Solicitado a ficar sempre MAIÚSCULO enquanto o usuário digita
  document
    .getElementById("servico_solicitado")
    .addEventListener("input", function () {
      this.value = this.value.toUpperCase();
    });

  // ==========================================
  // LIGAÇÕES DA GESTÃO DE CLIENTES (CORRIGIDAS)
  // ==========================================

  // Quando clica no topo para abrir o modal, garante que a tabela é desenhada!
  document
    .getElementById("btn-gestao-clientes")
    .addEventListener("click", () => {
      abrirModalGestaoClientes();
      renderizarListaClientesCadastrados();
    });

  document
    .getElementById("btn-fechar-gestao-clientes")
    .addEventListener("click", fecharModalGestaoClientes);

  document
    .getElementById("btn-add-veiculo")
    .addEventListener("click", adicionarVeiculoLista);

  // ALTERNAR ENTRE A LISTA E O FORMULÁRIO DENTRO DO MODAL
  document.getElementById("btn-novo-cliente").addEventListener("click", () => {
    document.getElementById("cad_cliente_index").value = "-1"; // 👈 MÁGICA: Avisa que é um cadastro novo!

    document.getElementById("view-lista-clientes").classList.add("hidden");
    document.getElementById("form-cadastro-cliente").classList.remove("hidden");

    // Limpa o formulário caso tenha ficado sujeira
    document.getElementById("form-cadastro-cliente").reset();
    veiculosTemporarios = [];
    renderizarVeiculosCadastro();
  });

  document.getElementById("btn-voltar-lista").addEventListener("click", () => {
    document.getElementById("cad_cliente_index").value = "-1"; // 👈 MÁGICA: Reseta por precaução

    document.getElementById("form-cadastro-cliente").classList.add("hidden");
    document.getElementById("view-lista-clientes").classList.remove("hidden");

    // Limpa tudo
    document.getElementById("form-cadastro-cliente").reset();
    veiculosTemporarios = [];
    renderizarVeiculosCadastro();
    renderizarListaClientesCadastrados();
  });

  document.getElementById("btn-voltar-lista").addEventListener("click", () => {
    document.getElementById("form-cadastro-cliente").classList.add("hidden");
    document.getElementById("view-lista-clientes").classList.remove("hidden");
    document.getElementById("form-cadastro-cliente").reset();
    veiculosTemporarios = [];
    renderizarVeiculosCadastro();
    renderizarListaClientesCadastrados(); // Adicionado para forçar a atualização!
  });

  // Escuta a barra de pesquisa da lista de clientes cadastrados
  document
    .getElementById("busca-lista-clientes")
    .addEventListener("input", renderizarListaClientesCadastrados);

  // =======================================================
  // SALVAR / EDITAR CLIENTE (SUPABASE COMPLETO)
  // =======================================================
  document
    .getElementById("form-cadastro-cliente")
    .addEventListener("submit", async function (evento) {
      evento.preventDefault();

      const btnSalvar = document.getElementById("btn-salvar-cliente");
      const textoOriginalBotao = btnSalvar.innerHTML;

      // Pega o ID escondido (se for -1 é novo, se for número, estamos editando)
      const idEdicao = document.getElementById("cad_cliente_index").value;

      try {
        const formData = new FormData(this);
        const dadosCliente = Object.fromEntries(formData.entries());

        const nome = (dadosCliente.nome || "").trim().toUpperCase();
        const cpf = (dadosCliente.cpf || "").trim();
        const telefone = (dadosCliente.telefone || "").trim();
        const cep = (dadosCliente.cep || "").trim();
        const endereco = (dadosCliente.endereco || "").trim().toUpperCase();
        const numero = (dadosCliente.numero || "").trim();
        const bairro = (dadosCliente.bairro || "").trim().toUpperCase();
        const cidade = (dadosCliente.cidade || "").trim().toUpperCase();
        const uf = (dadosCliente.uf || "").trim().toUpperCase();

        // 🚨 TRAVA DE CPF NAS NUVENS 🚨
        if (cpf !== "") {
          let queryBusca = supabaseClient
            .from("clientes")
            .select("id, nome")
            .eq("cpf", cpf);

          // Se estivermos editando, não barra se o CPF encontrado for do próprio cliente!
          if (idEdicao !== "-1") {
            queryBusca = queryBusca.neq("id", idEdicao);
          }

          const { data: clienteExistente } = await queryBusca.single();

          if (clienteExistente) {
            abrirModalAviso(
              `Este CPF já pertence ao cliente:\n👤 ${clienteExistente.nome}`,
            );
            document.getElementById("cad_cliente_cpf").focus();
            return;
          }
        }

        btnSalvar.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Salvando...`;
        btnSalvar.disabled = true;

        let clienteIdFinal;

        // 1. INSERE OU ATUALIZA NA TABELA 'clientes'
        if (idEdicao === "-1") {
          // INSERIR NOVO
          const { data, error } = await supabaseClient
            .from("clientes")
            .insert([
              {
                nome,
                cpf,
                telefone,
                cep,
                endereco,
                numero,
                bairro,
                cidade,
                uf,
              },
            ])
            .select();
          if (error) throw error;
          clienteIdFinal = data[0].id;
        } else {
          // ATUALIZAR EXISTENTE
          const { data, error } = await supabaseClient
            .from("clientes")
            .update({
              nome,
              cpf,
              telefone,
              cep,
              endereco,
              numero,
              bairro,
              cidade,
              uf,
            })
            .eq("id", idEdicao)
            .select();
          if (error) throw error;
          clienteIdFinal = data[0].id;

          // Se for edição, apaga os carros antigos dele nas nuvens para colocar a lista nova
          await supabaseClient
            .from("veiculos")
            .delete()
            .eq("cliente_id", clienteIdFinal);
        }

        // 2. SALVA A LISTA NOVA DE VEÍCULOS
        if (veiculosTemporarios && veiculosTemporarios.length > 0) {
          const veiculosParaSalvar = veiculosTemporarios.map((v) => ({
            cliente_id: clienteIdFinal,
            placa: v.placa,
            marca: v.marca,
            modelo: v.modelo,
            ano: v.ano,
            cor: v.cor,
            chassi: v.chassi,
            combustivel: v.combustivel,
          }));

          const { error: erroVeiculos } = await supabaseClient
            .from("veiculos")
            .insert(veiculosParaSalvar);
          if (erroVeiculos) throw erroVeiculos;
        }

        abrirModalSucesso(
          idEdicao === "-1"
            ? "Cliente cadastrado!"
            : "Dados do cliente atualizados!",
        );

        // Limpa e volta pra tela de lista
        this.reset();
        document.getElementById("cad_cliente_index").value = "-1";
        veiculosTemporarios = [];
        renderizarVeiculosCadastro();
        document.getElementById("btn-voltar-lista").click();
      } catch (erro) {
        console.error("Erro no Supabase:", erro);
        alert("🚨 Ocorreu um erro ao salvar no banco de dados.");
      } finally {
        btnSalvar.innerHTML = textoOriginalBotao;
        btnSalvar.disabled = false;
      }
    });

  // ESCUTANDO O CAMPO DE NOME DO CHECKLIST PRINCIPAL (VIA SUPABASE)
  document
    .getElementById("cliente_nome")
    .addEventListener("input", async function () {
      // 👈 Virou 'async'
      const nomeDigitado = this.value.toUpperCase();
      this.value = nomeDigitado;

      if (nomeDigitado.length >= 3) {
        atualizarSugestoesClientes(nomeDigitado);
      }

      // Procura no banco nas NUVENS se esse cliente exato existe
      if (nomeDigitado.length > 3) {
        try {
          const { data: clienteEncontrado, error } = await supabaseClient
            .from("clientes")
            .select("*, veiculos(*)")
            .eq("nome", nomeDigitado)
            .single(); // Tenta pegar 1 cliente exato

          if (clienteEncontrado) {
            // Puxa as informações como um passe de mágica
            document.getElementById("cliente_cpf").value =
              clienteEncontrado.cpf || "";
            document.getElementById("cliente_telefone").value =
              clienteEncontrado.telefone || "";
            document.getElementById("cliente_cep").value =
              clienteEncontrado.cep || "";
            document.getElementById("cliente_endereco").value =
              clienteEncontrado.endereco || "";
            document.getElementById("cliente_numero").value =
              clienteEncontrado.numero || "";
            document.getElementById("cliente_bairro").value =
              clienteEncontrado.bairro || "";
            document.getElementById("cliente_cidade").value =
              clienteEncontrado.cidade || "";
            const campoUfPrincipal = document.getElementById("cliente_uf");
            if (campoUfPrincipal)
              campoUfPrincipal.value = clienteEncontrado.uf || "";

            // E os veículos?
            const veiculos = clienteEncontrado.veiculos;
            if (veiculos && veiculos.length === 1) {
              preencherVeiculoChecklist(veiculos[0]);
            } else if (veiculos && veiculos.length > 1) {
              abrirSelecaoVeiculos(veiculos);
            }
          }
        } catch (erro) {
          // Se não achou ninguém com o nome exato ainda, ignora silenciosamente
        }
      }
    });

  // Garante que o autocomplete e a lista já existem assim que a página abre
  atualizarSugestoesClientes();

  // Ligar os botões do Modal de Exclusão de Cliente
  document
    .getElementById("btn-cancelar-excluir")
    .addEventListener("click", fecharModalExcluir);
  document
    .getElementById("btn-confirmar-excluir")
    .addEventListener("click", confirmarExclusao);

  document
    .getElementById("btn-cancelar-edicao")
    .addEventListener("click", confirmarLimpeza);

  // ==========================================
  // BOTÃO DE CANCELAR EDIÇÃO / VISUALIZAÇÃO
  // ==========================================
  const btnCancelarEdicao = document.getElementById("btn-cancelar-edicao");

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", function () {
      // 1. Limpa todos os campos do formulário de uma vez
      document.getElementById("form-checklist").reset();

      // 👇 🌟 COLE O CÓDIGO DO CANVAS AQUI 🌟 👇
      if (canvas) {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById("assinatura_base64").value = "";
        // Esconde a foto da assinatura velha e volta o botão de assinar
        document.getElementById("preview-assinatura-container").style.display =
          "none";
        document.getElementById("btn-abrir-assinatura").style.display = "flex";
      }
      // 2. Zera o ponteiro de combustível
      if (typeof atualizarMarcadorCombustivel === "function") {
        document.getElementById("fuel-slider").value = 0;
        atualizarMarcadorCombustivel(0);
      }

      // 3. Devolve a aparência original da etiqueta "NOVO"
      const badgeStatus = document.getElementById("status-edicao");
      badgeStatus.innerText = "NOVO";
      badgeStatus.style.background = ""; // Tira o vermelho/azul
      badgeStatus.style.color = ""; // Tira a cor de texto forçada

      // 4. Esconde o "Cancelar", esconde a "Impressora" e volta o "Salvar"
      this.style.display = "none";
      document.getElementById("btn-imprimir").style.display = "none";
      document.getElementById("btn-salvar-entrada").style.display = "flex";

      // 5. Preenche a data e hora atual novamente para o próximo carro
      preencherDataHoraAtual();
      verificarLuzPainel();

      // 6. Rola a tela para o topo suavemente
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
};

// ==========================================
// 9. CAPTURA E SALVAMENTO DO CHECKLIST (AGORA NAS NUVENS ☁️)
// ==========================================

// Função que envia o pacote de dados para o Supabase
async function salvarChecklistNaNuvem(dados) {
  const { data, error } = await supabaseClient
    .from("historico_checklists")
    .insert([
      {
        placa_veiculo: dados.veiculo_placa || "SEM PLACA",
        cliente_nome: dados.cliente_nome || "NÃO INFORMADO",
        dados_checklist: dados, // Salva o formulário inteiro de uma vez aqui!
        observacoes: dados.servico_solicitado || "",
        mecanico_responsavel: dados.mecanico_responsavel || "NÃO INFORMADO",
      },
    ]);

  if (error) throw error;
  console.log("Sucesso! Checklist salvo nas nuvens!");
}

const formChecklist = document.getElementById("form-checklist");

// Transformamos o botão em 'async' para poder esperar o Supabase responder
formChecklist.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  // Pega o botão para fazer o efeito de "carregando"
  const btnSalvar = document.getElementById("btn-salvar-entrada");
  const textoOriginalBotao = btnSalvar.innerHTML;

  try {
    // 1. Muda o botão para mostrar que está pensando
    btnSalvar.innerHTML = `<i class="ph ph-spinner ph-spin"></i> Salvando nas Nuvens...`;
    btnSalvar.disabled = true;

    // 2. Empacota todos os valores do formulário
    const formData = new FormData(formChecklist);
    const dadosDoChecklist = Object.fromEntries(formData.entries());

    // 🌟 3. A MÁGICA: Manda para o banco de dados do Supabase! 🌟
    await salvarChecklistNaNuvem(dadosDoChecklist);

    // 4. Mantemos o salvamento local como "Backup" e para a tabela do modal funcionar rápido
    bancoChecklists.push(dadosDoChecklist);
    salvarBancoChecklists();

    // 5. Atualiza a tabela do reloginho (Histórico) com a nova entrada
    renderizarTabelaClientes();

    ultimoChecklistSalvo = dadosDoChecklist;

    // 6. Mostra a nossa mensagem de sucesso bonitona
    abrirModalSucesso("Checklist salvo com sucesso nas nuvens!", true);

    // 7. Limpa o formulário para o próximo carro
    formChecklist.reset();

    if (canvas) {
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    }
    document.getElementById("assinatura_base64").value = "";

    const previewImg = document.getElementById("preview-assinatura-img");
    if (previewImg) previewImg.src = "";

    document.getElementById("preview-assinatura-container").style.display =
      "none";
    document.getElementById("btn-abrir-assinatura").style.display = "flex";

    // Volta o ponteiro de combustível pro VAZIO visualmente
    if (typeof atualizarMarcadorCombustivel === "function") {
      atualizarMarcadorCombustivel(0);
      document.getElementById("fuel-slider").value = 0;
    }
  } catch (erro) {
    console.error(erro);
    alert("🚨 Erro ao salvar o checklist nas nuvens. Verifique o Console.");
  } finally {
    // 8. Devolve o botão ao normal, dando sucesso ou erro
    btnSalvar.innerHTML = textoOriginalBotao;
    btnSalvar.disabled = false;
  }
});
// ==========================================
// 10. GESTÃO DE CLIENTES (Modal e Veículos)
// ==========================================
let veiculosTemporarios = []; // Nossa lista "carrinho" de veículos vazia

function abrirModalGestaoClientes() {
  document.getElementById("modal-gestao-clientes").classList.remove("hidden");
}

function fecharModalGestaoClientes() {
  // 1. Esconde o modal principal da tela
  document.getElementById("modal-gestao-clientes").classList.add("hidden");

  // 2. Limpa o formulário e a lista de veículos para não sujar o próximo cadastro
  document.getElementById("form-cadastro-cliente").reset();
  document.getElementById("cad_cliente_index").value = "-1"; // Reseta o modo de edição
  veiculosTemporarios = [];
  renderizarVeiculosCadastro();

  // 3. A MÁGICA AQUI: Força as telas internas a voltarem para o padrão (Lista visível, Cadastro oculto)
  document.getElementById("view-lista-clientes").classList.remove("hidden");
  document.getElementById("form-cadastro-cliente").classList.add("hidden");
}

function adicionarVeiculoLista() {
  const placaInput = document.getElementById("temp_veiculo_placa");

  // Puxa todos os valores novos (SEM O KM)
  const placa = placaInput.value.toUpperCase();
  const chassi = document
    .getElementById("temp_veiculo_chassi")
    .value.toUpperCase();
  const marca = document
    .getElementById("temp_veiculo_marca")
    .value.toUpperCase();
  const modelo = document
    .getElementById("temp_veiculo_modelo")
    .value.toUpperCase();
  const ano = document.getElementById("temp_veiculo_ano").value;
  const cor = document.getElementById("temp_veiculo_cor").value.toUpperCase();
  const combustivel = document.getElementById("temp_veiculo_combustivel").value;

  if (!placa) {
    alert("Digite pelo menos a placa para adicionar o veículo.");
    placaInput.focus();
    return;
  }

  // Joga TUDO pro "carrinho" de veículos (Tiramos o km daqui também)
  veiculosTemporarios.push({
    placa,
    chassi,
    marca,
    modelo,
    ano,
    cor,
    combustivel,
  });

  // Limpa tudo para o próximo carro
  placaInput.value = "";
  document.getElementById("temp_veiculo_chassi").value = "";
  document.getElementById("temp_veiculo_marca").value = "";
  document.getElementById("temp_veiculo_modelo").value = "";
  document.getElementById("temp_veiculo_ano").value = "";
  document.getElementById("temp_veiculo_cor").value = "";
  document.getElementById("temp_veiculo_combustivel").value = "";

  placaInput.focus();
  renderizarVeiculosCadastro();
}
function removerVeiculoLista(index) {
  // Remove 1 item da lista na posição exata (index) que clicamos
  veiculosTemporarios.splice(index, 1);
  renderizarVeiculosCadastro();
}

function renderizarVeiculosCadastro() {
  const tbody = document.getElementById("lista-veiculos-cadastro");
  tbody.innerHTML = "";

  // Se a lista estiver vazia, mostra a mensagem padrão
  if (veiculosTemporarios.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum veículo adicionado.</td></tr>`;
    return;
  }

  // Varre a nossa lista e cria uma linha na tabela para cada carro
  veiculosTemporarios.forEach((veiculo, index) => {
    tbody.innerHTML += `
      <tr>
        <td><strong>${veiculo.placa}</strong></td>
        <td>${veiculo.marca}</td>
        <td>${veiculo.modelo}</td>
        <td style="text-align: right">
          <button type="button" class="icon-btn btn-danger" style="display:inline-flex; padding: 6px; border:none;" onclick="removerVeiculoLista(${index})" title="Remover Veículo">
            <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

// ==========================================
// 11. AUTOMAÇÃO E BANCO DE DADOS (LocalStorage)
// ==========================================
let bancoClientesFalso = [];

// 1. Tenta puxar do navegador. Se não tiver, cria a Rafaela como padrão.
function carregarBancoClientes() {
  const dadosSalvos = localStorage.getItem("autocar_clientes");

  if (dadosSalvos) {
    bancoClientesFalso = JSON.parse(dadosSalvos);
  } else {
    // Lista inicial completamente vazia para a oficina!
    bancoClientesFalso = [];
    salvarBancoClientes();
  }
}

// 2. Salva a lista inteira no navegador
function salvarBancoClientes() {
  localStorage.setItem("autocar_clientes", JSON.stringify(bancoClientesFalso));
}

// 3. Chama a função para carregar os dados assim que o JS é lido!
carregarBancoClientes();

// 4. Sua função blindada de desenhar a tabela (mantida intacta)
// ==========================================
// RENDERIZAÇÃO E PAGINAÇÃO DA GESTÃO DE CLIENTES
// ==========================================
let cacheGestaoClientes = [];
let paginaAtualGestao = 1;
const clientesPorPaginaGestao = 10; // Quebrando de 10 em 10

// 1. Busca todos os clientes do Supabase de uma vez só e ORDENA DE A a Z
async function renderizarListaClientesCadastrados() {
  const tbody = document.getElementById("tbody-lista-clientes");
  const termo = document
    .getElementById("busca-lista-clientes")
    .value.trim()
    .toUpperCase();

  tbody.innerHTML = `<tr><td colspan="4" style="text-align: center;"><i class="ph ph-spinner ph-spin"></i> Buscando nas nuvens...</td></tr>`;

  try {
    let query = supabaseClient.from("clientes").select("*, veiculos(*)");

    if (termo) query = query.ilike("nome", `%${termo}%`);

    const { data: clientes, error } = await query;
    if (error) throw error;

    let clientesOrdenados = clientes || [];

    // 🌟 A MÁGICA DA ORDEM ALFABÉTICA (A a Z)
    clientesOrdenados.sort((a, b) => {
      // Pega os nomes, tira os espaços em branco das pontas e deixa tudo maiúsculo para comparar justo
      const nomeA = (a.nome || "").trim().toUpperCase();
      const nomeB = (b.nome || "").trim().toUpperCase();
      return nomeA.localeCompare(nomeB);
    });

    // Guarda na memória a lista já organizada!
    cacheGestaoClientes = clientesOrdenados;
    paginaAtualGestao = 1;

    desenharPaginaGestao(); // Manda desenhar a primeira página
  } catch (erro) {
    console.error("Erro ao buscar clientes:", erro);
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #ef4444;">Erro ao carregar dados do servidor.</td></tr>`;
  }
}

// 2. Desenha na tela apenas os 10 clientes da página atual
function desenharPaginaGestao() {
  const tbody = document.getElementById("tbody-lista-clientes");
  const btnPrev = document.getElementById("btn-prev-gestao");
  const btnNext = document.getElementById("btn-next-gestao");
  const infoPagina = document.getElementById("info-pagina-gestao");

  tbody.innerHTML = "";

  const totalPaginas =
    Math.ceil(cacheGestaoClientes.length / clientesPorPaginaGestao) || 1;
  if (paginaAtualGestao > totalPaginas) paginaAtualGestao = 1;

  const inicio = (paginaAtualGestao - 1) * clientesPorPaginaGestao;
  const fim = inicio + clientesPorPaginaGestao;
  const clientesDaPagina = cacheGestaoClientes.slice(inicio, fim);

  if (clientesDaPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum cliente encontrado.</td></tr>`;
  } else {
    clientesDaPagina.forEach((cliente) => {
      const qtdVeiculos = cliente.veiculos ? cliente.veiculos.length : 0;
      const nomeExibicao = (cliente.nome || "SEM NOME").toUpperCase();

      tbody.innerHTML += `
        <tr>
          <td><strong>${nomeExibicao}</strong></td>
          <td>${cliente.telefone || "-"}</td>
          <td><span class="badge">${qtdVeiculos} carro(s)</span></td>
          <td style="text-align: right; white-space: nowrap;">
            <button type="button" class="icon-btn" style="display:inline-flex; padding: 6px; border:none; margin-right: 5px;" title="Editar" onclick="editarCliente(${cliente.id})">
              <i class="ph ph-pencil-simple" style="font-size: 1.2rem; color: var(--primary);"></i>
            </button>
            <button type="button" class="icon-btn btn-danger" style="display:inline-flex; padding: 6px; border:none;" title="Excluir" onclick="excluirCliente(${cliente.id})">
              <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
            </button>
          </td>
        </tr>`;
    });
  }

  // 3. Atualiza os botões (trava se estiver na primeira ou última página)
  if (infoPagina)
    infoPagina.innerText = `Página ${paginaAtualGestao} de ${totalPaginas}`;

  if (btnPrev) {
    btnPrev.disabled = paginaAtualGestao === 1;
    btnPrev.style.opacity = btnPrev.disabled ? "0.3" : "1";
    btnPrev.style.cursor = btnPrev.disabled ? "not-allowed" : "pointer";
  }
  if (btnNext) {
    btnNext.disabled = paginaAtualGestao === totalPaginas;
    btnNext.style.opacity = btnNext.disabled ? "0.3" : "1";
    btnNext.style.cursor = btnNext.disabled ? "not-allowed" : "pointer";
  }
}

// 4. Acionada ao clicar no botão Anterior/Próxima
function mudarPaginaGestao(direcao) {
  paginaAtualGestao += direcao;
  desenharPaginaGestao();
}
// 👇 NOVAS FUNÇÕES COMUNICANDO COM O SUPABASE 👇

async function editarCliente(id) {
  try {
    // Busca o cliente específico e seus carros pelo ID
    const { data: cliente, error } = await supabaseClient
      .from("clientes")
      .select("*, veiculos(*)")
      .eq("id", id)
      .single();

    if (error) throw error;

    // 1. Diz pro formulário invisível: "Estamos editando a pessoa com ID X"
    document.getElementById("cad_cliente_index").value = cliente.id;

    // 2. Preenche todas as caixinhas de texto
    document.getElementById("cad_cliente_nome").value = cliente.nome || "";
    document.getElementById("cad_cliente_cpf").value = cliente.cpf || "";
    document.getElementById("cad_cliente_telefone").value =
      cliente.telefone || "";
    document.getElementById("cad_cliente_cep").value = cliente.cep || "";
    document.getElementById("cad_cliente_endereco").value =
      cliente.endereco || "";
    document.getElementById("cad_cliente_numero").value = cliente.numero || "";
    document.getElementById("cad_cliente_bairro").value = cliente.bairro || "";
    document.getElementById("cad_cliente_cidade").value = cliente.cidade || "";
    document.getElementById("cad_cliente_uf").value = cliente.uf || "";

    // 3. Puxa os carros dele de volta pra tabela temporária
    veiculosTemporarios = cliente.veiculos ? [...cliente.veiculos] : [];
    renderizarVeiculosCadastro();

    // 4. Muda da tela de lista para a tela de formulário
    document.getElementById("view-lista-clientes").classList.add("hidden");
    document.getElementById("form-cadastro-cliente").classList.remove("hidden");
  } catch (erro) {
    console.error("Erro ao buscar para edição:", erro);
    alert("Erro ao puxar dados do cliente.");
  }
}

// Variável para lembrar qual ID vamos apagar
let clienteIdParaExcluir = -1;

function excluirCliente(id) {
  clienteIdParaExcluir = id;
  document
    .getElementById("modal-confirmacao-excluir")
    .classList.remove("hidden");
}

function fecharModalExcluir() {
  document.getElementById("modal-confirmacao-excluir").classList.add("hidden");
  clienteIdParaExcluir = -1;
}

async function confirmarExclusao() {
  // 👈 Virou async para esperar a internet!
  if (clienteIdParaExcluir !== -1) {
    try {
      // MÁGICA: Manda o Supabase deletar!
      // (Como configuramos a regra 'cascade' no SQL, ele vai apagar os carros do cliente sozinho também!)
      const { error } = await supabaseClient
        .from("clientes")
        .delete()
        .eq("id", clienteIdParaExcluir);

      if (error) throw error;

      // Limpa a tela e avisa o sucesso
      renderizarListaClientesCadastrados();
      atualizarSugestoesClientes();
      fecharModalExcluir();
      abrirModalSucesso("Cliente excluído com sucesso do banco de dados!");
    } catch (erro) {
      console.error("Erro ao excluir:", erro);
      alert("Erro ao excluir o cliente das nuvens.");
    }
  }
}

// ==========================================
// MÓDULO DE ASSINATURA DIGITAL EM TELA CHEIA (MODAL)
// ==========================================
const modalAssinatura = document.getElementById("modal-assinatura");
const canvas = document.getElementById("canvas-assinatura");
const ctx = canvas ? canvas.getContext("2d", { desynchronized: true }) : null;
let desenhando = false;

// Elementos da tela principal
const btnAbrirAssinatura = document.getElementById("btn-abrir-assinatura");
const btnRefazerAssinatura = document.getElementById("btn-refazer-assinatura");
const previewContainer = document.getElementById(
  "preview-assinatura-container",
);
const previewImg = document.getElementById("preview-assinatura-img");
const inputBase64 = document.getElementById("assinatura_base64");

function ajustarTamanhoCanvas() {
  if (!canvas) return;
  // A mágica anti-descalibração: O sistema pega o tamanho real do modal na tela do tablet e iguala os pixels internos do Canvas!
  const container = document.getElementById("container-do-canvas");
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;

  // Reconfigura a caneta com precisão absoluta
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#000000";
}

function abrirModalAssinatura() {
  modalAssinatura.classList.remove("hidden");

  // 👇 Trava a rolagem da página de fundo pro tablet focar só na caneta
  document.body.style.overflow = "hidden";

  setTimeout(ajustarTamanhoCanvas, 150);
}

function fecharModalAssinatura() {
  modalAssinatura.classList.add("hidden");

  // 👇 Destrava a página quando fechar a assinatura
  document.body.style.overflow = "";
}

if (btnAbrirAssinatura)
  btnAbrirAssinatura.addEventListener("click", abrirModalAssinatura);
if (btnRefazerAssinatura)
  btnRefazerAssinatura.addEventListener("click", abrirModalAssinatura);
document
  .getElementById("btn-fechar-modal-assinatura")
  .addEventListener("click", fecharModalAssinatura);

if (canvas) {
  canvas.addEventListener("touchstart", (e) => e.preventDefault(), {
    passive: false,
  });
  canvas.addEventListener("touchmove", (e) => e.preventDefault(), {
    passive: false,
  });

  // ==========================================
  // NOVO MOTOR DA CANETA (Pointer Events - Alta Sensibilidade)
  // ==========================================
  // Variável para guardar o tamanho do quadro uma vez só
  let canvasRect;

  function pegarPosicaoX(e) {
    const escalaX = canvas.width / canvasRect.width;
    return (e.clientX - canvasRect.left) * escalaX;
  }

  function pegarPosicaoY(e) {
    const escalaY = canvas.height / canvasRect.height;
    return (e.clientY - canvasRect.top) * escalaY;
  }

  function iniciarDesenho(e) {
    e.preventDefault();
    desenhando = true;

    // Tira a medida da tela
    canvasRect = canvas.getBoundingClientRect();

    // Tenta capturar o ponteiro com segurança
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (err) {}

    // 👇 --- AQUI ESTÁ O AJUSTE ESTÉTICO --- 👇

    // 1. Define a cor da tinta (Preto puro para OS)
    ctx.strokeStyle = "#000000";

    // 2. DEFINE A ESPESSURA (A mágica!)
    // Provavelmente estava em 5 ou mais.
    // Mude para 2 para uma caneta em gel, ou 1.5 para uma BIC fina.
    ctx.lineWidth = 2;

    // 3. Arredonda a ponta e as curvas (Pro traço não ficar quadrado/picotado)
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // ☝️ ------------------------------------- ☝️

    // Inicia o caminho de tinta
    ctx.beginPath();
    ctx.moveTo(pegarPosicaoX(e), pegarPosicaoY(e));

    // Pingo inicial
    ctx.lineTo(pegarPosicaoX(e), pegarPosicaoY(e));
    ctx.stroke();
  }
  function desenhar(e) {
    if (!desenhando) return;
    e.preventDefault();
    ctx.lineTo(pegarPosicaoX(e), pegarPosicaoY(e));
    ctx.stroke();
  }

  function pararDesenho(e) {
    if (e) e.preventDefault();
    desenhando = false;

    // Corta o fluxo de tinta para garantir que o segundo toque não ligue com o primeiro!
    ctx.beginPath();

    // O Android já solta a caneta sozinho, não colocamos o releasePointer aqui para evitar o bug!
  }

  // 👇 LIGAÇÕES PURAS (Sem misturar com touchstart velho!)
  canvas.addEventListener("pointerdown", iniciarDesenho);
  canvas.addEventListener("pointermove", desenhar);
  canvas.addEventListener("pointerup", pararDesenho);
  canvas.addEventListener("pointerout", pararDesenho);
  canvas.addEventListener("pointercancel", pararDesenho);
  // BOTÃO: Confirmar Assinatura
  document
    .getElementById("btn-confirmar-assinatura")
    .addEventListener("click", () => {
      const imagemBase64 = canvas.toDataURL("image/png");

      // Salva invisível para enviar ao Supabase/PDF
      inputBase64.value = imagemBase64;

      // Mostra o preview bonito na tela principal e esconde o botão gigante
      previewImg.src = imagemBase64;
      previewContainer.style.display = "block";
      btnAbrirAssinatura.style.display = "none";

      fecharModalAssinatura();
    });

  // BOTÃO: Limpar Assinatura
  document
    .getElementById("btn-limpar-assinatura")
    .addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

  window.addEventListener("resize", () => {
    if (!modalAssinatura.classList.contains("hidden")) {
      // Tira a foto do que já foi desenhado
      const desenhoAtual = canvas.toDataURL();

      // Dá 200 milissegundos pro tablet terminar de girar o vidro e o CSS se acomodar
      setTimeout(() => {
        ajustarTamanhoCanvas();
        const imgTemp = new Image();
        imgTemp.src = desenhoAtual;
        imgTemp.onload = () => {
          ctx.drawImage(imgTemp, 0, 0, canvas.width, canvas.height);
        };
      }, 200);
    }
  });
}
