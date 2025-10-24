// Aguarda o DOM (estrutura HTML) carregar antes de executar o script
document.addEventListener("DOMContentLoaded", () => {
    
    // 1. DEFINIÇÃO DO ESTADO DO JOGO
    // Este objeto 'gameState' será o cérebro de tudo.
    // Vamos salvá-lo e carregá-lo do localStorage.
    let gameState = {};

    // Estado padrão para um novo jogador
    const defaultState = {
        nivel: 1,
        xpTotal: 0,
        prTotal: 0,
        atributos: {
            "Saude Mental": 0,
            "Saude Fisica": 0,
            "Espirito": 0,
            "Dinheiro": 0,
            "Objetivos": 0,
            "Conexoes": 0
        },
        missoesDiarias: [
            // Isso virá da página 'diario.html'
            // Ex: { id: 1, nome: "Fazer caminhada 36 min", atributo: "Saude Fisica", xp: 15, pr: 5, completa: false }
        ],
        historico: [
            // Isso virá do "Ritual de Salvamento" 
            // Ex: { data: "24/10/2025", nome: "Fazer caminhada 36 min", xp: 15, pr: 5, atributo: "Saude Fisica" }
        ],
        conquistas: {
            // Ex: { id: "consistencia_7d", nome: "Consistência de Aço", desbloqueada: false } 
        },
        loja: [
            { id: 1, nome: "Assistir um Filme", custoPR: 50, quantidade: 0 }
        ],
        bancoMissoes: [
            { id: 1, nome: "Ir na Igreja", atributo: "Espirito", xp: 15, pr: 5 } 
            // ... mais missões do banco [cite: 26]
        ],
    };

    // 2. FUNÇÕES DE PERSISTÊNCIA (localStorage)
    
    function salvarGame() {
        // Converte o objeto JS em uma string JSON e salva no localStorage
        localStorage.setItem("eseKosmoState", JSON.stringify(gameState));
    }

    function carregarGame() {
        // Tenta pegar os dados salvos
        const dadosSalvos = localStorage.getItem("eseKosmoState");
        
        if (dadosSalvos) {
            // Se encontrou dados, converte de volta para objeto
            gameState = JSON.parse(dadosSalvos);
        } else {
            // Se não, usa o estado padrão (novo jogador)
            gameState = { ...defaultState };
        }
        
        // Garante que todas as chaves principais existam, caso o defaultState mude
        // (Isso é bom para migrações futuras)
        for (let key in defaultState) {
            if (!gameState.hasOwnProperty(key)) {
                gameState[key] = defaultState[key];
            }
        }
        
        console.log("Jogo Carregado:", gameState);
    }

    // 3. FUNÇÃO DE ATUALIZAÇÃO DA UI (Interface do Usuário)
    // Lê os dados do 'gameState' e atualiza o HTML
    
    function atualizarPainelPrincipal() {
        // Seleciona os elementos do HTML pelos IDs
        const elNivel = document.getElementById("nivel");
        const elXpTotal = document.getElementById("xp-total");
        const elPrTotal = document.getElementById("pr-total");
        
        // Atualiza os status principais 
        if (elNivel) elNivel.textContent = gameState.nivel;
        if (elXpTotal) elXpTotal.textContent = gameState.xpTotal;
        if (elPrTotal) elPrTotal.textContent = gameState.prTotal;

        // Atualiza os atributos 
        // (Nota: a "barra de progresso" aqui é simbólica, 
        //  você precisará definir uma meta de XP para ela encher 100%)
        // Por enquanto, vamos fazer ela crescer um pouco a cada ponto.
        
        const atributos = gameState.atributos;
        
        const elSaudeMentalVal = document.getElementById("saude-mental-value");
        const elSaudeMentalProg = document.getElementById("saude-mental-progress");
        if (elSaudeMentalVal) elSaudeMentalVal.textContent = atributos["Saude Mental"];
        if (elSaudeMentalProg) elSaudeMentalProg.style.width = (atributos["Saude Mental"] % 100) + "%"; // Ex: loop a cada 100 XP

        const elSaudeFisicaVal = document.getElementById("saude-fisica-value");
        const elSaudeFisicaProg = document.getElementById("saude-fisica-progress");
        if (elSaudeFisicaVal) elSaudeFisicaVal.textContent = atributos["Saude Fisica"];
        if (elSaudeFisicaProg) elSaudeFisicaProg.style.width = (atributos["Saude Fisica"] % 100) + "%";

        const elEspiritoVal = document.getElementById("espirito-value");
        const elEspiritoProg = document.getElementById("espirito-progress");
        if (elEspiritoVal) elEspiritoVal.textContent = atributos["Espirito"];
        if (elEspiritoProg) elEspiritoProg.style.width = (atributos["Espirito"] % 100) + "%";
        
        const elDinheiroVal = document.getElementById("dinheiro-value");
        const elDinheiroProg = document.getElementById("dinheiro-progress");
        if (elDinheiroVal) elDinheiroVal.textContent = atributos["Dinheiro"];
        if (elDinheiroProg) elDinheiroProg.style.width = (atributos["Dinheiro"] % 100) + "%";
        
        const elObjetivosVal = document.getElementById("objetivos-value");
        const elObjetivosProg = document.getElementById("objetivos-progress");
        if (elObjetivosVal) elObjetivosVal.textContent = atributos["Objetivos"];
        if (elObjetivosProg) elObjetivosProg.style.width = (atributos["Objetivos"] % 100) + "%";
        
        const elConexoesVal = document.getElementById("conexoes-value");
        const elConexoesProg = document.getElementById("conexoes-progress");
        if (elConexoesVal) elConexoesVal.textContent = atributos["Conexoes"];
        if (elConexoesProg) elConexoesProg.style.width = (atributos["Conexoes"] % 100) + "%";
    }


    // 4. INICIALIZAÇÃO
    // Verifica qual página estamos
    // (Isso permite usar o mesmo script.js em todas as páginas)
    
    carregarGame(); // Carrega os dados do localStorage

    const path = window.location.pathname;
    
    if (path.endsWith("/") || path.endsWith("index.html")) {
        // Estamos no Painel Principal
        atualizarPainelPrincipal();
    } 
    // else if (path.endsWith("diario.html")) {
    //     // Lógica para a página de diário (Próximo Passo)
    // } 
    // ... e assim por diante para as outras páginas

});