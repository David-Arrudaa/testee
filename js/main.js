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
function atualizarSugestoesClientes() {
  const datalist = document.getElementById("lista-clientes-sugestao");
  if (!datalist) return;

  datalist.innerHTML = "";
  bancoClientesFalso.forEach((cliente) => {
    datalist.innerHTML += `<option value="${cliente.nome}"></option>`;
  });
}

function preencherVeiculoChecklist(veiculo) {
  document.getElementById("veiculo_placa").value = veiculo.placa || "";
  document.getElementById("veiculo_marca").value = veiculo.marca || "";
  document.getElementById("veiculo_versao").value = veiculo.modelo || "";
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

  // Eventos da Modal de Histórico
  document
    .getElementById("btn-fechar-historico")
    .addEventListener("click", fecharHistorico);

  // Injetando 35 clientes de teste no histórico de entradas
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
  // ATUALIZANDO O SALVAR CLIENTE: (COM MODO EDIÇÃO E BANCO)
  // =======================================================
  document
    .getElementById("form-cadastro-cliente")
    .addEventListener("submit", function (evento) {
      evento.preventDefault();

      try {
        const formData = new FormData(this);
        const dadosCliente = Object.fromEntries(formData.entries());

        // Força o nome a ficar maiúsculo antes de salvar e vincula os carros
        dadosCliente.nome = (dadosCliente.nome || "").toUpperCase();
        dadosCliente.veiculos = veiculosTemporarios || [];

        // 👇 Puxa a posição do cliente lá daquele campo invisível
        const indexEdicao = document.getElementById("cad_cliente_index").value;

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
};

// ==========================================
// 9. CAPTURA E ENVIO DO FORMULÁRIO
// ==========================================
const formChecklist = document.getElementById("form-checklist");

formChecklist.addEventListener("submit", function (evento) {
  // 1. O preventDefault IMPEDE a página de recarregar (comportamento padrão do HTML)
  evento.preventDefault();

  // 2. O FormData é o "caminhão de mudança" do JS. Ele passa em todos os inputs
  // que têm o atributo "name" e empacota os valores automaticamente.
  const formData = new FormData(formChecklist);

  // 3. Transformamos esse pacote em um Objeto simples do JavaScript
  // Isso deixa os dados no formato perfeito para mandarmos pro Supabase depois!
  const dadosDoChecklist = Object.fromEntries(formData.entries());

  // 4. Vamos imprimir no console para vermos se deu certo
  console.log("✅ DADOS CAPTURADOS COM SUCESSO:");
  console.log(dadosDoChecklist);

  // Um aviso na tela só para sabermos que a função rodou
  alert("Dados capturados! Aperte F12 e olhe a aba Console.");
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
  const marcaInput = document.getElementById("temp_veiculo_marca");
  const modeloInput = document.getElementById("temp_veiculo_modelo");

  // Pega os valores e já deixa tudo maiúsculo
  const placa = placaInput.value.toUpperCase();
  const marca = marcaInput.value.toUpperCase();
  const modelo = modeloInput.value.toUpperCase();

  // Uma pequena validação: só adiciona se tiver pelo menos a Placa
  if (!placa) {
    alert("Digite pelo menos a placa para adicionar o veículo.");
    placaInput.focus();
    return;
  }

  // Joga o veículo novo para dentro da nossa lista
  veiculosTemporarios.push({ placa, marca, modelo });

  // Limpa as caixinhas para o usuário poder digitar o próximo carro
  placaInput.value = "";
  marcaInput.value = "";
  modeloInput.value = "";
  placaInput.focus();

  // Manda desenhar a tabela atualizada
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
    // Lista inicial (só roda na primeira vez)
    bancoClientesFalso = [
      {
        nome: "RAFAELA (EXEMPLO)",
        cpf: "422.050.358-78",
        telefone: "(15) 99700-9302",
        cep: "18274-882",
        endereco: "Silvio Almeida Sinisgali",
        numero: "153",
        bairro: "PACAEMBU",
        cidade: "Tatuí",
        veiculos: [{ placa: "ABC-1234", marca: "VW", modelo: "GOL" }],
      },
    ];
    salvarBancoClientes(); // Salva a Rafaela no navegador
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
