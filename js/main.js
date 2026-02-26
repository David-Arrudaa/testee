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

function abrirHistorico() {
  document.getElementById("modal-historico").classList.remove("hidden");
}

function fecharHistorico() {
  document.getElementById("modal-historico").classList.add("hidden");
}

function alternarTema() {
  const iconeTema = document.getElementById("icone-tema");
  if (iconeTema.classList.contains("ph-sun")) {
    iconeTema.classList.replace("ph-sun", "ph-moon");
  } else {
    iconeTema.classList.replace("ph-moon", "ph-sun");
  }
}

// ==========================================
// 5. LÓGICA DE PAGINAÇÃO (Histórico)
// ==========================================
let listaClientesDb = [];
let paginaAtualClientes = 1;
const clientesPorPagina = 20;

function renderizarTabelaClientes() {
  const tbody = document.getElementById("lista-clientes-tabela");
  const termoBusca = document
    .getElementById("busca-historico")
    .value.toUpperCase();
  const btnPrev = document.getElementById("btn-prev-page");
  const btnNext = document.getElementById("btn-next-page");
  const infoPagina = document.getElementById("info-pagina");

  // Filtra pela busca
  let clientesFiltrados = listaClientesDb.filter((cliente) =>
    cliente.nome.includes(termoBusca),
  );

  // Calcula total de páginas
  const totalPaginas =
    Math.ceil(clientesFiltrados.length / clientesPorPagina) || 1;
  if (paginaAtualClientes > totalPaginas) paginaAtualClientes = 1;

  // Pega apenas os 20 da página
  const inicio = (paginaAtualClientes - 1) * clientesPorPagina;
  const fim = inicio + clientesPorPagina;
  const clientesDaPagina = clientesFiltrados.slice(inicio, fim);

  // Desenha na tela
  tbody.innerHTML = "";

  if (clientesDaPagina.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 30px;">Nenhum cliente encontrado.</td></tr>`;
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
                        <button class="icon-btn" style="display:inline-flex; padding: 6px; border:none;" title="Ver Checklists">
                            <i class="ph ph-list-bullets" style="font-size: 1.2rem; color: var(--primary);"></i>
                        </button>
                    </td>
                </tr>
            `;
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

function mudarPagina(direcao) {
  paginaAtualClientes += direcao;
  renderizarTabelaClientes();
}

// ==========================================
// 6. INTEGRAÇÃO VIACEP (Busca de Endereço)
// ==========================================
async function buscarCEP(cep) {
  // 1. Limpa o CEP (tira os traços, deixa só os números)
  const cepLimpo = cep.replace(/\D/g, "");

  // 2. Verifica se realmente tem 8 números. Se não tiver, ele nem tenta buscar.
  if (cepLimpo.length !== 8) return;

  // 3. Pega os elementos visuais para mostrar o "Carregando"
  const inputCep = document.getElementById("cliente_cep");
  const iconeCep = document.getElementById("icon-cep-loading");

  try {
    // Efeito Visual: Borda azul e ícone girando
    inputCep.parentElement.classList.add("input-loading");
    iconeCep.classList.replace("ph-magnifying-glass", "ph-spinner");
    iconeCep.classList.add("ph-spin");

    // 4. Faz o pedido na internet (Bate na porta do ViaCEP)
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resposta.json();

    // Se o CEP não existir (ex: 99999-999)
    if (dados.erro) {
      alert("Opa! Esse CEP não foi encontrado.");
      return;
    }

    // 5. Preenche os campos do HTML automaticamente com os dados que voltaram!
    document.getElementById("cliente_endereco").value = dados.logradouro;
    document.getElementById("cliente_bairro").value = dados.bairro;
    document.getElementById("cliente_cidade").value = dados.localidade;
    document.getElementById("cliente_uf").value = dados.uf;

    // BÔNUS UX: Joga o cursor piscando direto pro campo de "Número" pra agilizar a vida!
    document.getElementById("cliente_numero").focus();
  } catch (erro) {
    console.error("Erro ao buscar CEP:", erro);
    alert("Erro ao buscar o CEP. Verifique sua conexão com a internet.");
  } finally {
    // 6. Tira o efeito de carregamento, independente se deu certo ou errado
    inputCep.parentElement.classList.remove("input-loading");
    iconeCep.classList.replace("ph-spinner", "ph-magnifying-glass");
    iconeCep.classList.remove("ph-spin");
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
  // 👇 A NOVA MÁSCARA DO KM AQUI 👇
  km(valor) {
    return valor
      .replace(/\D/g, "") // Remove tudo que não for número
      .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1."); // Mágica: coloca um ponto a cada 3 casas
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

  // Eventos da Modal de Histórico
  document
    .getElementById("btn-fechar-historico")
    .addEventListener("click", fecharHistorico);

  // Injetando 35 clientes de teste
  for (let i = 1; i <= 35; i++) {
    listaClientesDb.push({
      nome: `CLIENTE TESTE ${i}`,
      qtd: Math.floor(Math.random() * 5) + 1,
      ultima: "10/10/2023",
    });
  }

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

  // 👇 O FIO DO VIACEP LIGADO AQUI 👇
  document.getElementById("cliente_cep").addEventListener("blur", function () {
    buscarCEP(this.value);
  });

  // LIGANDO AS MÁSCARAS
  document.querySelectorAll("[data-mascara]").forEach((input) => {
    input.addEventListener("input", aplicarMascara);
  });
};
