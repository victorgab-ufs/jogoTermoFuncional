const TAMANHO_PALAVRA = 5;
const MAX_TENTATIVAS = 6;
const TECLADO_LINHAS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "APAGAR"]
];
const PRIORIDADE_STATUS = {
  absent: 1,
  present: 2,
  correct: 3
};
const DICIONARIO_URLS = [
  "https://raw.githubusercontent.com/pythonprobr/palavras/master/palavras.txt",
  "https://raw.githubusercontent.com/izak-ag/Gerador-Palavras-Portugues/master/pt_BR.dic"
];
const CACHE_DICIONARIO = "termo-dicionario-ptbr-5-letras-v2";

const palavrasFallback = [
  "TERMO", "CRIME", "PLENA", "GRATO", "PIZZA", "PALMO", "AMPLA", "HIENA",
  "VELHO", "LAPSO", "TAMPA", "DENTE", "PALHA", "LUZES", "TECLA", "ZEBRA",
  "TIMES", "TRUTA", "FRUTA", "LUNAR", "PANOS", "CASAR", "CALHA", "TELHA",
  "BICOS", "OXIDO", "FALHA", "MARES", "FACAS", "FOLHA", "LABIO", "PARTO",
  "TIGRE", "NAVIO", "LENTE", "LEITE", "LINUX", "UREIA", "FEMUR", "OTITE",
  "PRUMO", "BRUTO", "PULSO", "PULSA", "SONAR", "CHAVE", "MEIAS", "ARARA",
  "VISOR", "TINTA", "SOLAR", "FERRO", "MISTO", "LIXOS", "TIROS", "PINTO",
  "MACHO"
];

//resolve alguns problemas que o usuário pode inserir, como acentos. 
// Pega palavras sem sentido e faz um replace por palavras vazias, eliminando alucinações que não fazem parte do jogo
const normalizarPalavra = (valor) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();

//Aqui fazemos uma comparação, elas tem que ter exatamente o mesmo tamanho. PalavraValida e a palavra
const palavraValida = (palavra) =>
  palavra.length === TAMANHO_PALAVRA && /^[A-Z]+$/.test(palavra);

const extrairPalavrasDoDicionario = (texto) => {
  const palavras = texto
    .split(/\r?\n/)
    .map((linha) => linha.split("/")[0])
    .map(normalizarPalavra)
    .filter(palavraValida);

  return [...new Set(palavras)];
};

const sortearIndice = (limite) => {
  if (window.crypto?.getRandomValues) {
    const valores = new Uint32Array(1);
    window.crypto.getRandomValues(valores);
    return valores[0] % limite;
  }

  return Date.now() % limite;
};

const sortearPalavra = (palavras) => palavras[sortearIndice(palavras.length)];

const carregarPalavras = async () => {
  try {
    const cache = localStorage.getItem(CACHE_DICIONARIO);

    if (cache) {
      const palavras = JSON.parse(cache);
      if (Array.isArray(palavras) && palavras.length > palavrasFallback.length) {
        return { palavras, fonte: "api" };
      }
    }

    for (const url of DICIONARIO_URLS) {
      try {
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("Resposta invalida do dicionario.");

        const texto = await resposta.text();
        const palavras = extrairPalavrasDoDicionario(texto);

        if (palavras.length <= palavrasFallback.length) {
          throw new Error("O dicionario retornou poucas palavras.");
        }

        try {
          localStorage.setItem(CACHE_DICIONARIO, JSON.stringify(palavras));
        } catch (erroCache) {
          console.warn("Nao foi possivel salvar o cache do dicionario.", erroCache);
        }

        return { palavras, fonte: "api" };
      } catch (erroFonte) {
        console.warn(`Falha ao carregar ${url}.`, erroFonte);
      }
    }

    throw new Error("Nenhuma fonte remota respondeu.");
  } catch (erro) {
    console.warn("Usando lista local de palavras.", erro);
    return { palavras: palavrasFallback, fonte: "local" };
  }
};

const inicializarJogo = (palavra, bancoPalavras, fonte) => ({
  palavra: palavra.toUpperCase(),
  bancoPalavras,
  dicionario: new Set(bancoPalavras),
  fonte,
  tentativas: [],
  entradaAtual: Array(TAMANHO_PALAVRA).fill(""),
  cursor: 0,
  mensagem: "",
  maxTentativas: MAX_TENTATIVAS
});  

const verificarTentativa = (palavra, tentativa) => {
  const letrasIniciais = palavra.split("");

  const { resultadoParcial, letrasRestantes } = tentativa.split("").reduce(
    (acc, letra, i) => {
      const novoResultado = [...acc.resultadoParcial];
      const novasLetrasRestantes = [...acc.letrasRestantes];

      if (palavra[i] === letra) {
        novoResultado[i] = { letra, status: "correct" };
        novasLetrasRestantes[i] = null;
      }

      return {
        resultadoParcial: novoResultado,
        letrasRestantes: novasLetrasRestantes
      };
    },
    { resultadoParcial: [], letrasRestantes: [...letrasIniciais] }
  );

  return tentativa.split("").map((letra, i) => {
    if (resultadoParcial[i]) return resultadoParcial[i];

    const indexPresente = letrasRestantes.indexOf(letra);

    if (indexPresente !== -1) {
      letrasRestantes[indexPresente] = null;
      return { letra, status: "present" };
    }

    return { letra, status: "absent" };
  });
};

const jogoVencido = (estado) =>
  estado.tentativas.some((tentativa) =>
    tentativa.every((celula) => celula.status === "correct")
  );

const jogoPerdido = (estado) =>
  estado.tentativas.length >= estado.maxTentativas && !jogoVencido(estado);

const jogoFinalizado = (estado) => jogoVencido(estado) || jogoPerdido(estado);

const moverCursor = (estado, direcao) => ({
  ...estado,
  cursor: Math.max(0, Math.min(TAMANHO_PALAVRA - 1, estado.cursor + direcao))
});

const posicionarCursor = (estado, cursor) => ({
  ...estado,
  cursor: Math.max(0, Math.min(TAMANHO_PALAVRA - 1, cursor))
});

const digitarLetra = (estado, letra) => {
  if (jogoFinalizado(estado)) return estado;

  const entradaAtual = [...estado.entradaAtual];
  entradaAtual[estado.cursor] = letra;

  return {
    ...estado,
    entradaAtual,
    cursor: Math.min(estado.cursor + 1, TAMANHO_PALAVRA - 1),
    mensagem: ""
  };
};

const apagarLetra = (estado) => {
  if (jogoFinalizado(estado)) return estado;

  const entradaAtual = [...estado.entradaAtual];
  const cursor = entradaAtual[estado.cursor] ? estado.cursor : Math.max(0, estado.cursor - 1);
  entradaAtual[cursor] = "";

  return {
    ...estado,
    entradaAtual,
    cursor,
    mensagem: ""
  };
};

const tentarPalavra = (estado) => {
  if (jogoFinalizado(estado)) return estado;

  const tentativa = estado.entradaAtual.join("");

  if (!palavraValida(tentativa)) {
    return { ...estado, mensagem: "Preencha as 5 letras." };
  }

  if (!estado.dicionario.has(tentativa)) {
    return { ...estado, mensagem: "Palavra nao encontrada no dicionario." };
  }

  const tentativaVerificada = verificarTentativa(estado.palavra, tentativa);

  return {
    ...estado,
    tentativas: [...estado.tentativas, tentativaVerificada],
    entradaAtual: Array(TAMANHO_PALAVRA).fill(""),
    cursor: 0,
    mensagem: ""
  };
};

const reiniciarJogo = (estado) =>
  inicializarJogo(sortearPalavra(estado.bancoPalavras), estado.bancoPalavras, estado.fonte);

const updateState = (estado, acao) => {
  if (acao.type === "letra") return digitarLetra(estado, acao.payload);
  if (acao.type === "apagar") return apagarLetra(estado);
  if (acao.type === "mover") return moverCursor(estado, acao.payload);
  if (acao.type === "cursor") return posicionarCursor(estado, acao.payload);
  if (acao.type === "tentar") return tentarPalavra(estado);
  if (acao.type === "reiniciar") return reiniciarJogo(estado);

  return estado;
};

const obterStatusTeclado = (estado) =>
  estado.tentativas.reduce((statusLetras, tentativa) => {
    tentativa.forEach(({ letra, status }) => {
      const statusAtual = statusLetras[letra];

      if (!statusAtual || PRIORIDADE_STATUS[status] > PRIORIDADE_STATUS[statusAtual]) {
        statusLetras[letra] = status;
      }
    });

    return statusLetras;
  }, {});

const renderizarCelula = (estado, row, col) => {
  const tentativa = estado.tentativas[row];
  const linhaAtual = row === estado.tentativas.length && !jogoFinalizado(estado);
  const celula = tentativa
    ? tentativa[col]
    : { letra: linhaAtual ? estado.entradaAtual[col] : "", status: "" };
  const ativa = linhaAtual && col === estado.cursor;
  const editavel = linhaAtual ? "editable" : "";
  const selecionada = ativa ? "active" : "";
  const preenchida = celula.letra ? "filled" : "";

  return `
    <button
      class="cell ${celula.status} ${editavel} ${selecionada} ${preenchida}"
      ${linhaAtual ? `data-action="cursor" data-col="${col}"` : ""}
      ${linhaAtual ? "" : "tabindex=\"-1\""}
      aria-label="Letra ${col + 1}"
      type="button"
    >
      ${celula.letra}
    </button>
  `;
};

const mensagemFinal = (estado) => {
  if (jogoVencido(estado)) return "Voce venceu!";
  if (jogoPerdido(estado)) return `Voce perdeu! A palavra era: ${estado.palavra}`;
  return estado.mensagem;
};

const renderizarTecla = (tecla, statusLetras) => {
  const teclaEspecial = tecla === "ENTER" || tecla === "APAGAR";
  const action = tecla === "ENTER"
    ? "tentar"
    : tecla === "APAGAR"
      ? "apagar"
      : "letra";
  const payload = teclaEspecial ? "" : `data-key="${tecla}"`;
  const classeStatus = teclaEspecial ? "" : statusLetras[tecla] || "";
  const label = tecla === "APAGAR" ? "⌫" : tecla;
  const ariaLabel = tecla === "APAGAR" ? "Apagar letra" : tecla;

  return `
    <button
      class="key ${teclaEspecial ? "wide" : ""} ${classeStatus}"
      data-action="${action}"
      ${payload}
      type="button"
      aria-label="${ariaLabel}"
    >
      ${label}
    </button>
  `;
};

const renderizarTeclado = (estado) => {
  const statusLetras = obterStatusTeclado(estado);

  return `
    <div class="keyboard" aria-label="Teclado virtual">
      ${TECLADO_LINHAS.map((linha) => `
        <div class="keyboard-row">
          ${linha.map((tecla) => renderizarTecla(tecla, statusLetras)).join("")}
        </div>
      `).join("")}
    </div>
  `;
};

const view = (estado) => `
  <div class="grid" role="grid">
    ${Array.from({ length: estado.maxTentativas }).map((_, row) => `
      <div class="row" role="row">
        ${Array.from({ length: TAMANHO_PALAVRA }).map((_, col) =>
          renderizarCelula(estado, row, col)
        ).join("")}
      </div>
    `).join("")}
  </div>

  <p class="mensagem ${mensagemFinal(estado) ? "" : "empty"}" aria-live="polite">
    ${mensagemFinal(estado)}
  </p>

  ${renderizarTeclado(estado)}

  <div class="actions">
    ${jogoFinalizado(estado)
      ? `<button data-action="reiniciar" type="button">Reiniciar</button>`
      : ""}
  </div>
`;

const atualizarEscuridao = (estado) => {
  const tentativasUsadas = estado.tentativas.length;
  const estaNaUltimaChance = Math.max(1, estado.maxTentativas - 1);
  const intensidade = jogoVencido(estado)
    ? 0
    : Math.min(0.62, (tentativasUsadas / estaNaUltimaChance) * 0.62);

  document.body.style.setProperty("--darkness", intensidade.toFixed(2));
};

const focarCelulaAtiva = () => {
  document.querySelector(".cell.active")?.focus();
};

const app = (estado) => {
  const container = document.getElementById("app");

  atualizarEscuridao(estado);
  container.innerHTML = view(estado);

  const executarAcao = (acao) => app(updateState(estado, acao));

  container.querySelectorAll("[data-action]").forEach((elemento) => {
    elemento.addEventListener("click", () => {
      const action = elemento.dataset.action;

      if (action === "cursor") {
        executarAcao({ type: "cursor", payload: Number(elemento.dataset.col) });
        return;
      }

      if (action === "letra") {
        executarAcao({ type: "letra", payload: elemento.dataset.key });
        return;
      }

      executarAcao({ type: action });
    });
  });

  document.onkeydown = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const letra = normalizarPalavra(event.key);

    if (letra.length === 1 && /^[A-Z]$/.test(letra)) {
      event.preventDefault();
      executarAcao({ type: "letra", payload: letra });
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      executarAcao({ type: "apagar" });
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      executarAcao({ type: "mover", payload: -1 });
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      executarAcao({ type: "mover", payload: 1 });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      executarAcao({ type: "tentar" });
    }
  };

  focarCelulaAtiva();
};

const renderizarCarregamento = () => {
  document.getElementById("app").innerHTML = `
    <p class="mensagem">Carregando dicionario...</p>
  `;
};

const iniciar = async () => {
  renderizarCarregamento();
  const { palavras, fonte } = await carregarPalavras();
  app(inicializarJogo(sortearPalavra(palavras), palavras, fonte));
};

iniciar();
