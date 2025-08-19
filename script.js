// Parte de Renato (Sempre deixe 10 linhas de distancias para a parte do colega seguinte)
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



// Parte de Leonardo (Sempre deixe 10 linhas de distancias para a parte do colega seguinte)

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

}; //Fecha a função que Renato vai abrir, por enquanto vai dar erro!!!




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




// Parte de Victor.

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
const palavras = ["TERMO", "CRATO", "PLENA", "GRATO"];
const palavraEscolhida = palavras[Math.floor(Math.random() * palavras.length)];


// Vamos criar os botões que chamam as funções
const updateState = (estado, acao) => {

  //Botão tentar, chama a função tentarTermo
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
  document.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const novaAcao = btn.dataset.action === "tentar"
        ? { type: "tentar", payload: document.getElementById("entrada").value }
        : { type: "reiniciar" };
      app(updateState(estado, novaAcao));
    });
  });
};

// Start Game!
app(inicializarJogo(palavraEscolhida));


//.
