/* =======================================================
   AUTOCAR BS - SISTEMA DE CHECKLIST
   Arquivo Principal de Lógica (JavaScript)
   ======================================================= */

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

  let assinaturasHtml = "";
  if (dados.guincho === "SIM") {
    assinaturasHtml = `
      <div style="width: 30%; border-top: 1px solid #000; padding-top: 5px;">Assinatura do Cliente</div>
      <div style="width: 30%; border-top: 1px solid #000; padding-top: 5px;">Assinatura do Responsável</div>
      <div style="width: 30%; border-top: 1px solid #000; padding-top: 5px;">Assinatura do Guincho</div>
    `;
  } else {
    assinaturasHtml = `
      <div style="width: 40%; border-top: 1px solid #000; padding-top: 5px;">Assinatura do Cliente</div>
      <div style="width: 40%; border-top: 1px solid #000; padding-top: 5px;">Assinatura do Responsável Técnico</div>
    `;
  }

  const logoUrl = new URL(
    "img/logo-preta.png",
    window.location.origin + window.location.pathname,
  ).href;

  const htmlContent = `
      <html>
      <head>
        <title>Checklist - ${dados.veiculo_placa}</title>
        <style>
          @page { margin: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; margin: 15mm; color: #000; line-height: 1.5; }
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
          <img src="${logoUrl}" style="height: 65px;" alt="Logo Autocar" />
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
  }, 800);
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

function abrirModalSucesso(mensagem) {
  // Troca o texto do modal pelo texto que a gente quiser na hora!
  document.getElementById("texto-modal-sucesso").innerText = mensagem;
  document.getElementById("modal-sucesso").classList.remove("hidden");
}

function fecharModalSucesso() {
  document.getElementById("modal-sucesso").classList.add("hidden");
}

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
const clientesPorPagina = 20;

// 1. Puxa os checklists salvos no navegador
function carregarBancoChecklists() {
  const dadosSalvos = localStorage.getItem("autocar_checklists");
  if (dadosSalvos) {
    bancoChecklists = JSON.parse(dadosSalvos);
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
  bancoChecklists.forEach((chk) => {
    const nome = (chk.cliente_nome || "SEM NOME").toUpperCase();
    if (!agrupados[nome]) {
      agrupados[nome] = { nome: nome, qtd: 0, ultima: chk.data_entrada };
    }
    agrupados[nome].qtd++;
    agrupados[nome].ultima = chk.data_entrada || agrupados[nome].ultima;
  });

  let listaAgrupada = Object.values(agrupados);
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
      tbody.innerHTML += `
        <tr>
          <td><strong>${cliente.nome}</strong></td>
          <td>${cliente.qtd}</td>
          <td>${cliente.ultima}</td>
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

function confirmarExclusaoChecklist() {
  if (checklistIndexParaExcluir > -1) {
    // 1. Remove da memória
    bancoChecklists.splice(checklistIndexParaExcluir, 1);

    // 2. Salva no navegador e atualiza a tabela geral
    salvarBancoChecklists();
    renderizarTabelaClientes();

    // 3. Verifica se o cliente ainda tem outro checklist salvo
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

    // 4. Fecha a pergunta e mostra a mensagem de sucesso!
    fecharModalExcluirChecklist();
    abrirModalSucesso("Checklist excluído com sucesso!");
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

  // 4. Arruma o ponteiro visual de Combustível
  const nivelTexto = chk.nivel_combustivel;
  const indiceCombustivel = MAPA_COMBUSTIVEL.findIndex(
    (item) => item.texto === nivelTexto,
  );
  if (indiceCombustivel !== -1) {
    document.getElementById("fuel-slider").value = indiceCombustivel;
    atualizarMarcadorCombustivel(indiceCombustivel);
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
// FUNÇÕES DE AUTOMAÇÃO DO CHECKLIST
// ==========================================
function atualizarSugestoesClientes(termoPesquisa = "") {
  const datalist = document.getElementById("lista-clientes-sugestao");
  if (!datalist) return;

  // 1. Limpa a lista sempre que a função for chamada
  datalist.innerHTML = "";

  // 2. Trava de segurança: Se tiver menos de 3 letras, não faz nada!
  if (termoPesquisa.length < 3) return;

  // 3. Procura no banco só quem tem o termo digitado
  const filtrados = bancoClientesFalso.filter((c) =>
    (c.nome || "").toUpperCase().includes(termoPesquisa),
  );

  // 4. Cria as opções só com os resultados encontrados
  filtrados.forEach((cliente) => {
    datalist.innerHTML += `<option value="${cliente.nome}"></option>`;
  });
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
  // ATUALIZANDO O SALVAR CLIENTE: (COM TRAVA DE CPF)
  // =======================================================
  document
    .getElementById("form-cadastro-cliente")
    .addEventListener("submit", function (evento) {
      evento.preventDefault();

      try {
        const formData = new FormData(this);
        const dadosCliente = Object.fromEntries(formData.entries());

        // 👇 Puxa a posição do cliente lá daquele campo invisível
        const indexEdicao = document.getElementById("cad_cliente_index").value;

        // =======================================================
        // 🚨 NOVA TRAVA DE SEGURANÇA: VERIFICAÇÃO DE CPF DUPLICADO
        // =======================================================
        const cpfDigitado = (dadosCliente.cpf || "").trim();

        // Só faz a busca no banco se o campo não estiver vazio
        if (cpfDigitado !== "") {
          const clienteDuplicado = bancoClientesFalso.find(
            (clienteSalvo, index) => {
              // Verifica se o CPF bate E se NÃO é a própria pessoa que estamos editando
              const cpfBate = clienteSalvo.cpf === cpfDigitado;
              const eOutraPessoa = index.toString() !== indexEdicao.toString();

              return cpfBate && eOutraPessoa;
            },
          );

          // Se achou alguém com esse CPF, barra tudo!
          if (clienteDuplicado) {
            abrirModalAviso(
              `Este CPF já está cadastrado no sistema para o cliente:\n👤 ${clienteDuplicado.nome}`,
            );
            document.getElementById("cad_cliente_cpf").focus(); // Devolve o cursor pro campo
            return; // 🛑 PARA A EXECUÇÃO AQUI! Não salva e não fecha o modal.
          }
        }
        // =======================================================

        // Força o nome a ficar maiúsculo antes de salvar e vincula os carros
        dadosCliente.nome = (dadosCliente.nome || "").toUpperCase();
        dadosCliente.veiculos = veiculosTemporarios || [];

        if (indexEdicao === "-1" || indexEdicao === "") {
          // Se for -1, significa que clicamos em NOVO CLIENTE
          bancoClientesFalso.push(dadosCliente);
        } else {
          // Se for 0, 1, 2... significa que clicamos no LÁPIS (Editar)
          bancoClientesFalso[indexEdicao] = dadosCliente;
        }

        // 💾 Salva no navegador, atualiza o autocomplete e a tabela
        salvarBancoClientes();
        atualizarSugestoesClientes();
        renderizarListaClientesCadastrados();

        // AVISA O USUÁRIO COM O NOVO MODAL!
        abrirModalSucesso("Cliente salvo com sucesso!");

        // Limpa tudo pra voltar pra tela
        this.reset();
        document.getElementById("cad_cliente_index").value = "-1"; // Reseta o campo invisível
        veiculosTemporarios = [];
        renderizarVeiculosCadastro();

        // Finge o clique no botão voltar de forma segura
        document.getElementById("btn-voltar-lista").click();
      } catch (erro) {
        console.error(erro);
        alert("🚨 Opa! O JavaScript travou. O erro foi: " + erro.message);
      }
    });

  // ESCUTANDO O CAMPO DE NOME DO CHECKLIST PRINCIPAL
  document
    .getElementById("cliente_nome")
    .addEventListener("input", function () {
      const nomeDigitado = this.value.toUpperCase(); // Força maiúsculo pra evitar erro de busca
      this.value = nomeDigitado; // Mantém a caixa de texto em maiúsculo

      atualizarSugestoesClientes(nomeDigitado);

      // Procura no nosso "banco" se esse cliente existe
      const clienteEncontrado = bancoClientesFalso.find(
        (c) => c.nome.toUpperCase() === nomeDigitado,
      );

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
          // Se só tem um carro, já joga na tela sem perguntar
          preencherVeiculoChecklist(veiculos[0]);
        } else if (veiculos && veiculos.length > 1) {
          // Se tem mais de um, abre o modal de escolha!
          abrirSelecaoVeiculos(veiculos);
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
// 9. CAPTURA E SALVAMENTO DO CHECKLIST
// ==========================================
const formChecklist = document.getElementById("form-checklist");

formChecklist.addEventListener("submit", function (evento) {
  evento.preventDefault();

  try {
    // 1. O FormData passa em todos os inputs e empacota os valores automaticamente
    const formData = new FormData(formChecklist);
    const dadosDoChecklist = Object.fromEntries(formData.entries());

    // 2. Salva no nosso "Banco de Checklists" da memória do navegador
    bancoChecklists.push(dadosDoChecklist);
    salvarBancoChecklists(); // 💾 Grava no LocalStorage!

    // 3. Atualiza a tabela do reloginho (Histórico) com a nova entrada
    renderizarTabelaClientes();

    // 4. Mostra a nossa mensagem de sucesso bonitona
    abrirModalSucesso("Checklist de Entrada salvo com sucesso!");

    // 5. Limpa o formulário e os visuais (como o ponteiro de combustível)
    // para o próximo carro!
    formChecklist.reset();

    // Volta o ponteiro de combustível pro VAZIO visualmente
    if (typeof atualizarMarcadorCombustivel === "function") {
      atualizarMarcadorCombustivel(0);
      document.getElementById("fuel-slider").value = 0;
    }
  } catch (erro) {
    console.error(erro);
    alert("🚨 Erro ao salvar o checklist: " + erro.message);
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
  document.getElementById("modal-gestao-clientes").classList.add("hidden");
  // Limpa o formulário e a lista quando fecha, para não sujar o próximo cadastro
  document.getElementById("form-cadastro-cliente").reset();
  veiculosTemporarios = [];
  renderizarVeiculosCadastro();
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
// Substitua a sua função renderizarLista por esta (que agora tem os 2 botões)
function renderizarListaClientesCadastrados() {
  const tbody = document.getElementById("tbody-lista-clientes");
  const termo = document
    .getElementById("busca-lista-clientes")
    .value.toUpperCase();
  tbody.innerHTML = "";

  const filtrados = bancoClientesFalso.filter((c) => {
    const nomeSeguro = (c.nome || "SEM NOME").toUpperCase();
    return nomeSeguro.includes(termo);
  });

  if (filtrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 20px;">Nenhum cliente encontrado.</td></tr>`;
    return;
  }

  filtrados.forEach((cliente) => {
    const qtdVeiculos = cliente.veiculos ? cliente.veiculos.length : 0;
    const nomeExibicao = (cliente.nome || "SEM NOME").toUpperCase();

    // 👇 Pega a posição real do cliente no banco para podermos editar/excluir o cara certo!
    const indexOriginal = bancoClientesFalso.indexOf(cliente);

    tbody.innerHTML += `
      <tr>
        <td><strong>${nomeExibicao}</strong></td>
        <td>${cliente.telefone || "-"}</td>
        <td><span class="badge">${qtdVeiculos} carro(s)</span></td>
        <td style="text-align: right; white-space: nowrap;">
          <button type="button" class="icon-btn" style="display:inline-flex; padding: 6px; border:none; margin-right: 5px;" title="Editar" onclick="editarCliente(${indexOriginal})">
            <i class="ph ph-pencil-simple" style="font-size: 1.2rem; color: var(--primary);"></i>
          </button>
          <button type="button" class="icon-btn btn-danger" style="display:inline-flex; padding: 6px; border:none;" title="Excluir" onclick="excluirCliente(${indexOriginal})">
            <i class="ph ph-trash" style="font-size: 1.2rem;"></i>
          </button>
        </td>
      </tr>`;
  });
}

// 👇 ADICIONE ESTAS DUAS FUNÇÕES NOVAS LOGO ABAIXO 👇
function editarCliente(index) {
  const cliente = bancoClientesFalso[index];

  // 1. Diz pro formulário invisível: "Estamos editando a pessoa da posição X"
  document.getElementById("cad_cliente_index").value = index;

  // 2. Preenche todas as caixinhas de texto com os dados do cara
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
}

// Variável para o sistema lembrar em quem você clicou na lixeira
let clienteIndexParaExcluir = -1;

function excluirCliente(index) {
  clienteIndexParaExcluir = index; // Guarda a posição do cliente
  document
    .getElementById("modal-confirmacao-excluir")
    .classList.remove("hidden"); // Abre o modal bonito
}

function fecharModalExcluir() {
  document.getElementById("modal-confirmacao-excluir").classList.add("hidden");
  clienteIndexParaExcluir = -1; // Limpa a memória
}

function confirmarExclusao() {
  if (clienteIndexParaExcluir > -1) {
    bancoClientesFalso.splice(clienteIndexParaExcluir, 1); // Remove da lista
    salvarBancoClientes(); // Salva a lista nova no navegador
    atualizarSugestoesClientes(); // Tira o cara do AutoComplete do checklist
    renderizarListaClientesCadastrados(); // Redesenha a tabela

    fecharModalExcluir(); // Fecha a pergunta
    abrirModalSucesso("Cliente excluído com sucesso!"); // Mostra nosso modal verde!
  }
}
