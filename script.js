// Créditos: https://youtu.be/ceWOxPgw0pc?si=LSWMrGSbVDtYxlSx @pasquadev

// Registro de dados necessários para o jogo iniciar
const inicializarJogo = (palavra) => ({

//Colocar tudo que o jogador digitar em maiusculo para evitar problemas:
  palavra: palavra.toUpperCase(),


//Constante para verificar se o jogador ganhou ou perdeu o jogo
  tentativas: [],

//Definimos que o jogador tem no maximo 6 chances, logo:
  maxTentativas: 6
});

// Aqui inicia a logica do jogo
const verificarTentativa = (palavra, tentativa) => {

   // O objeitivo do jogo é a leitura das letras de uma palavra, vamos quebrar uma palavra em varias letras:
  const letrasIniciais = palavra.split("");


//A logica do jogo funcionará da seguinte forma: como o jogo está "preso" em um paradigma funcional, vamos abusar do uso de spreads para realizar cópias a todo momento e do reduce para acumular e armazenar temporariamente nossos resultados, ficando assim:

const { resultadoParcial, letrasRestantes } = tentativa.split("").reduce(
  (acc, letra, i) => {
    // Agora vamos acumular as tentativas dos jogadores em cópias para respeitar o paradigma funcional
    const novoResultado = [...acc.resultadoParcial];
    const novasLetrasRestantes = [...acc.letrasRestantes];

     //Verificando as palavras na condicional. Se ele acertar, vamos colocar no array de acerto e retirar das letras faltantes
    
    if (palavra[i] === letra) {
      novoResultado[i] = { letra, status: "correct" };
      novasLetrasRestantes[i] = null;
    }

    return {
      resultadoParcial: novoResultado,
      letrasRestantes: novasLetrasRestantes
    };
  },
  //Dessa forma terminamos de programar nosso acumulador

  //Essas sao as duas listas que vao rodar nosso jogo e fechamos nosso reduce com elas
  { resultadoParcial: [], letrasRestantes: [...letrasIniciais] }
);

// Com o acumulador e o reduce que sao a "alma" do jogo programado, faremos o return para fechar a função.

  return tentativa.split("").map((letra, i) => {

      //De forma simples, se for isso, retorne isso.
        //Esse if abaixo representará o melhor dos casos, letra certa na posição certa
    if (resultadoParcial[i]) return resultadoParcial[i];


    //Se a letra existir, mas estiver na posição errada, precisamos mostrar isso.
    
    const indexPresente = letrasRestantes.indexOf(letra);

     //Sabemos pelas listas de exercício: lista 5, questão 4 que o index de um elemento inexistente é -1, vamos usar isso.
    if (indexPresente !== -1) {
      //Aqui a logica usada é a seguinte, a letra existe, o jogador acertou, ta na posição errada, mas acertou, então precisamos retirar ela da lista letrasRestantes
      letrasRestantes[indexPresente] = null;
      return { letra, status: "present" };
    }
    // Se nada deu certo é porque a letra nem existe na palavra, então
    return { letra, status: "absent" };
  });

  //Fim da função   

}; 

//Agora vamos verificar se o jogador venceu ou perdeu o jogo ---


//Criar uma constante para verificar se uma letra digitada esta em seu lugar correto

const jogoVencido = (estado) =>
  estado.tentativas.some(t => t.every(c => c.status === "correct"));

//Para o jogador perder o jogador deve exceder 6 chances e a situacao ser diferente de venceu
const jogoPerdido = (estado) =>
  estado.tentativas.length >= estado.maxTentativas && !jogoVencido(estado);

// Vamos formalizar o jogo

const tentarPalavra = (estado, palavra) => {

  //primeiro precisamos que o jogador insira exatamente uma palavra com 5 letras, caso contrario a situacao dele permanece inalterada, dessa forma
  if (palavra.length !== estado.palavra.length) return estado;
  //Remover a situação onde jogador insere 5 caracteres vazios
  if (palavra == "     ") return estado;
  //Remover a situação onde há espaços depois e antes das strings
  if (palavra !== palavra.trim()) return estado;


// Primeiro tentamos remover os espaços manualmente, não conseguimos fazer com espaços entre strings, por isso tivemos que recorrer a um código REGEX para eliminição de espaços entre palavras.
  if (palavra !== palavra.replace(/\s/g, '')) return estado;


  //De forma similar, precisamos que o jogo acabe, ou seja, se o jogador perder ou vencer qualquer outra tentativa é ignorada
  if (jogoVencido(estado) || jogoPerdido(estado)) return estado;



   // Agora vamos fazer o jogo "rodar"!
    // Ela funciona com 2 parametros, entao precisamos adicionar 2 paramentros em verificar tentativa.
  const tentativaVerificada = verificarTentativa(estado.palavra, palavra.toUpperCase());

  //Por fim o retorno da funcao tentarTermo retornara o valor da lista situacao, visando o paradigma, fara copias das listas para respeitar o paradigma funcional
  return { ...estado, tentativas: [...estado.tentativas, tentativaVerificada] };
};

// Agora faremos a parte visual do dinamica que aparecera na pagina WEB, faremos via JS

// A logica da visualizacao WEB é simples, primeiro criamos linhas como máximo de tentativas que temos, ou seja, 6. Depois, criamos colunas com o maximo de letras do nosso termo. O map vai iterar nessas listas de modo funcional!

// Por fim, o join tem a funcao de juntar todo uma uma unica string, formando a palavra visualizada.

const view = (estado) => `
  <div class="grid">
    ${Array.from({ length: estado.maxTentativas }).map((_, row) => `
      ${Array.from({ length: estado.palavra.length }).map((_, col) => {
        const tentativa = estado.tentativas[row];
        const cell = tentativa ? tentativa[col] : { letra: "", status: "" };
        return `<div class="cell ${cell.status}">${cell.letra}</div>`;
      }).join("")}
    `).join("")}
  </div>
  ${jogoVencido(estado) || jogoPerdido(estado) ? `
    <p class="mensagem">
      ${jogoVencido(estado) ? "🎉 Você venceu!" : `💀 Você perdeu! A palavra era: ${estado.palavra}`}
    </p>
    <button data-action="reiniciar">🔄 Reiniciar</button>
  ` : `
    <input id="entrada" maxlength="${estado.palavra.length}" placeholder="Digite a palavra">
    <button data-action="tentar">Tentar</button>
  `}
`;

// A segunda metade do código de visualização é responsável pelas mensagens de vitória ou derrota, inclusive os botões de reiniciar e tentar

// Visando a dinamicidade do jogo, usamos uma função natural não pura, para misturar as palavras e ela não ficar de forma estática
const palavras = ["TERMO", "CRIME", "PLENA", "GRATO", "PIZZA", "PALMO", "AMPLA", "HIENA", "VELHO", "LAPSO", "TAMPA", "DENTE", "PALHA", "LUZES", "TECLA", "ZEBRA", "TIMES", "TRUTA", "FRUTA", "LUNAR", "PANOS", "CASAR", "CALHA", "TELHA", "BICOS", "OXIDO", "FALHA", "MARES", "FACAS", "FOLHA", "LABIO", "PARTO", "TIGRE", "NAVIO", "LENTE", "LEITE", "LINUX", "UREIA", "FEMUR", "OTITE", "PRUMO", "BRUTO", "PULSO", "PULSA", "SONAR", "CHAVE", "MEIAS", "ARARA", "VISOR", "TINTA", "SOLAR", "FERRO", "MISTO", "LIXOS", "TIROS", "PINTO", "MACHO"];

const palavraEscolhida = palavras[Math.floor(Math.random() * palavras.length)];


// Vamos criar os botões que chamam as funções
const updateState = (estado, acao) => {

  //Botão tentar, chama a função tentarPalavra
  if (acao.type === "tentar") {
    return tentarPalavra(estado, acao.payload);
  }

  //Botão reiniciar, reinicia o jogo.
  if (acao.type === "reiniciar") {
    return location.reload(true); // Sempre retorna a palavra fixa
  }
  return estado;
};


//Agora vamos implementar os codigos auxiliares criados.
const app = (estado) => {
  document.getElementById("app").innerHTML = view(estado);



//Acionar o addEventListener para os clicks nos botões tentar e reiniciar serem funcionais

// Função para executar a ação
function executarAcao(tipo, payload = null) {
  const novaAcao = tipo === "tentar" 
    ? { type: "tentar", payload: payload || document.getElementById("entrada").value }
    : { type: "reiniciar" };
  
  app(updateState(estado, novaAcao));
}

// Eventos dos botões
document.querySelectorAll("[data-action]").forEach(btn => {
  btn.addEventListener("click", () => {
    executarAcao(btn.dataset.action);
  });
});

// Evento da tecla Enter
document.getElementById("entrada").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    executarAcao("tentar");
  }
});
};




// Start Game!
app(inicializarJogo(palavraEscolhida));

