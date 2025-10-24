// --- No topo do script.js ---
// COLOQUE AS MESMAS CHAVES DO login.js
const SUPABASE_URL = 'https://kdjpboltryumsteldayy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanBib2x0cnl1bXN0ZWxkYXl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMzQ5MDIsImV4cCI6MjA3NjkxMDkwMn0.pVOVUAfyxywkLPiDe9OTJVg3VJBwL1LA0fotPVmj8sU';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null; // Vamos guardar o usuário logado aqui
let userProfile = null; // Guardará dados da tabela 'profiles'

// Aguarda o DOM carregar
document.addEventListener("DOMContentLoaded", () => {

    /**
     * Carrega componentes HTML reutilizáveis (nav e footer) e os injeta na página.
     */
    async function carregarComponentes() {
        // Define os placeholders
        const navPlaceholder = document.getElementById("main-nav-placeholder");
        const footerPlaceholder = document.getElementById("main-footer-placeholder");

        if (!navPlaceholder || !footerPlaceholder) return;

        // Detecta se estamos na raiz (index.html) ou em /pages/
        const pathPrefix = (window.location.pathname.includes("/pages/")) ? "../" : "";

        try {
            // Busca os dois arquivos em paralelo
            const [navRes, footerRes] = await Promise.all([
                fetch(`${pathPrefix}_nav.html`),
                fetch(`${pathPrefix}_footer.html`)
            ]);

            const navHtml = await navRes.text();
            const footerHtml = await footerRes.text();

            // --- Correção de Caminho ---
            // Os links em _nav.html e _footer.html foram escritos para a pasta /pages/
            // (ex: href="../index.html"). Isso quebra no index.html (que está na raiz).
            // Vamos corrigir isso dinamicamente.

            let finalNavHtml, finalFooterHtml;

            if (pathPrefix === "") {
                // Estamos na raiz (index.html)
                // Removemos "../" e mudamos "pagina.html" para "pages/pagina.html"
                finalNavHtml = navHtml
                    .replace(/href="\.\.\/index\.html"/g, 'href="index.html"')
                    .replace(/href="diario\.html"/g, 'href="pages/diario.html"')
                    .replace(/href="banco\.html"/g, 'href="pages/banco.html"')
                    .replace(/href="conquistas\.html"/g, 'href="pages/conquistas.html"')
                    .replace(/href="loja\.html"/g, 'href="pages/loja.html"')
                    .replace(/href="historico\.html"/g, 'href="pages/historico.html"');

                finalFooterHtml = footerHtml
                    .replace(/href="\.\.\/index\.html"/g, 'href="index.html"')
                    .replace(/href="diario\.html"/g, 'href="pages/diario.html"')
                    .replace(/href="banco\.html"/g, 'href="pages/banco.html"')
                    .replace(/href="conquistas\.html"/g, 'href="pages/conquistas.html"')
                    .replace(/href="loja\.html"/g, 'href="pages/loja.html"')
                    .replace(/href="historico\.html"/g, 'href="pages/historico.html"')
                    .replace(/href="sobre\.html"/g, 'href="pages/sobre.html"')
                    // Links Informativos
                    .replace(/href="politica-privacidade\.html"/g, 'href="pages/politica-privacidade.html"')
                    .replace(/href="termo-privacidade\.html"/g, 'href="pages/termo-privacidade.html"');
            } else {
                // Estamos em /pages/, os links estão corretos
                finalNavHtml = navHtml;
                finalFooterHtml = footerHtml;
            }

            // Injeta o HTML corrigido na página
            navPlaceholder.innerHTML = finalNavHtml;
            footerPlaceholder.innerHTML = finalFooterHtml;

        } catch (error) {
            console.error("Erro ao carregar componentes:", error);
            navPlaceholder.innerHTML = "<p>Erro ao carregar menu.</p>";
            footerPlaceholder.innerHTML = "<p>Erro ao carregar rodapé.</p>";
        }
    }

    // 1. DEFINIÇÃO DO ESTADO DO JOGO E PILARES
    // (Definindo os pilares e seus multiplicadores conforme PDF 1) 
    const pilaresConfig = {
        "nenhum": { nome: "Nenhum", multiplicador: 1.0 },
        "construcao": { nome: "Pilar da Construção", multiplicador: 1.5 },
        "logica": { nome: "Pilar da Lógica", multiplicador: 1.2 },
        "criatividade": { nome: "Pilar da Criatividade", multiplicador: 1.2 }
    };

    let gameState = {};

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
        // Lista de missões ativas
        missoesDiarias: [],
        // Histórico de missões concluídas
        historico: [],
        // Conquistas
        conquistas: {
            "consistencia_7d": {
                nome: "Consistência de Aço",
                descricao: "Completar 7 dias de missões",
                desbloqueada: false,
                recompensaXP: 1000
            }
            // ... outras conquistas do PDF U.P.T. [cite: 23]
        },
        // Itens da Loja
        loja: [
            { id: 1, nome: "Assistir um Filme", custoPR: 50, quantidade: 0 },
            { id: 2, nome: "Noite de Karaokê", custoPR: 150, quantidade: 0 },
            { id: 3, nome: "Viajar", custoPR: 1000, quantidade: 0 }
        ],
        bancoMissoes: []
    };

    /**
 * Busca os dados do perfil (display_name) do usuário logado na tabela 'profiles'.
 */
    async function fetchProfileData() {
        if (!currentUser) return; // Precisa estar logado

        console.log("Buscando dados do perfil...");
        const { data, error } = await _supabase
            .from('profiles')
            .select('display_name') // Queremos o nome
            .eq('id', currentUser.id) // Onde o ID do perfil é igual ao ID do usuário logado
            .single(); // Espera apenas um resultado

        if (error) {
            console.error("Erro ao buscar perfil:", error.message);
            userProfile = { display_name: "Usuário" }; // Nome padrão em caso de erro
        } else if (data) {
            console.log("Perfil encontrado:", data);
            userProfile = data;
        } else {
            console.log("Nenhum perfil encontrado para o usuário, usando padrão.");
            userProfile = { display_name: "Novo Usuário" }; // Nome padrão se não houver perfil
        }
    }

    async function runAppLogic() {
        console.log("runAppLogic iniciada para:", currentUser?.email);

        // Carrega os dados do jogo
        await carregarGame();

        // >>> NOVO: Busca os dados do perfil <<<
        await fetchProfileData();

        // Carrega os componentes (nav e footer)
        await carregarComponentes();

        // ... (resto da função: setupMenuToggles, atualizarNavAtiva, lógica da página) ...
        setupMenuToggles();
        atualizarNavAtiva();
        // ... Lógica if/else das páginas (Não muda) ...
        const path = window.location.pathname;
        if (path.endsWith("/") || path.endsWith("/index.html") || path === "/") {
            atualizarPainelPrincipal();
            // ... resto do if/else ...
        }
        // ...
    }

    // 2. FUNÇÕES DE PERSISTÊNCIA (localstorage)

    /**
     * Salva o estado do jogo NO BACKEND (Supabase)
     */
    async function salvarGame() {
        if (!currentUser) return; // Não salva se não houver usuário

        console.log("Salvando progresso na nuvem...");

        const { error } = await _supabase
            .from('user_game_state') // Nome da tabela que criamos
            .update({
                game_state: gameState, // A coluna do tipo JSONB
                updated_at: new Date()
            })
            .eq('user_id', currentUser.id); // Onde o ID do usuário for o nosso

        if (error) {
            // Se deu erro (ex: usuário ainda não tem uma linha), tenta INSERIR
            if (error.code === '23502' || error.code === 'PGRST116') { // Erro de "não encontrado"
                const { insertError } = await _supabase
                    .from('user_game_state')
                    .insert({
                        user_id: currentUser.id,
                        game_state: gameState
                    });
                if (insertError) console.error("Erro ao INSERIR game state:", insertError);
            } else {
                console.error("Erro ao ATUALIZAR game state:", error);
            }
        }
    }

    /**
     * Carrega o estado do jogo DO BACKEND (Supabase)
     */
    async function carregarGame() {
        if (!currentUser) return; // Não carrega se não houver usuário

        console.log("Carregando progresso da nuvem...");

        const { data, error } = await _supabase
            .from('user_game_state')
            .select('game_state') // Queremos apenas a coluna com o JSON
            .eq('user_id', currentUser.id)
            .single(); // Pega apenas um resultado

        if (error || !data || !data.game_state) {
            // Se der erro ou o usuário for novo (sem dados)
            console.log("Nenhum progresso na nuvem. Usando estado padrão.");
            gameState = { ...defaultState };

            // Salva o estado padrão na nuvem pela primeira vez
            await salvarGame();
        } else {
            // Encontrou dados!
            console.log("Progresso encontrado!");
            gameState = data.game_state;
        }

        // Garante que o estado local tenha sempre as chaves mais recentes
        for (let key in defaultState) {
            if (!gameState.hasOwnProperty(key)) {
                gameState[key] = defaultState[key];
            }
        }
    }

    // 3. FUNÇÕES DE ATUALIZAÇÃO DA UI (PAINEL PRINCIPAL)
    // (Função da Etapa anterior, sem modificações)
    function atualizarPainelPrincipal() {
        // Seleciona os novos elementos
        const elUserAvatar = document.getElementById("user-avatar");
        const elUserName = document.getElementById("user-name");

        // Seleciona os elementos antigos
        const elNivel = document.getElementById("nivel"); // Agora dentro de .user-level
        const elXpTotal = document.getElementById("xp-total");
        const elPrTotal = document.getElementById("pr-total");
        const elProgressoNivel = document.getElementById("progresso-nivel");
        const elProgressoNivelTexto = document.getElementById("progresso-nivel-texto");

        // --- Atualização do Perfil ---
        if (userProfile && elUserName) {
            elUserName.textContent = userProfile.display_name || "Usuário";
        }
        // Avatar: Por enquanto usamos o default. Poderíamos buscar 'avatar_url' do Supabase Auth se usássemos OAuth.
        // if (userProfile && userProfile.avatar_url && elUserAvatar) {
        //     elUserAvatar.src = userProfile.avatar_url;
        // } else if (elUserAvatar) {
        //     elUserAvatar.src = "assets/images/default-avatar.png"; // Garante o default
        // }


        // --- Atualização de Nível/Stats (sem mudanças na lógica, só IDs) ---
        if (elNivel) elNivel.textContent = gameState.nivel;
        if (elXpTotal) elXpTotal.textContent = gameState.xpTotal;
        if (elPrTotal) elPrTotal.textContent = gameState.prTotal;

        if (elProgressoNivelTexto) {
            elProgressoNivelTexto.textContent = `${gameState.xpAtual.toFixed(0)} / ${gameState.xpParaProximoNivel} XP`;
        }
        if (elProgressoNivel) {
            const porcentagem = gameState.xpParaProximoNivel > 0 ? (gameState.xpAtual / gameState.xpParaProximoNivel) * 100 : 0;
            elProgressoNivel.style.width = Math.min(porcentagem, 100) + "%"; // Garante max 100%
        }

        const atributos = gameState.atributos;

        const elSaudeMentalVal = document.getElementById("saude-mental-value");
        const elSaudeMentalProg = document.getElementById("saude-mental-progress");
        if (elSaudeMentalVal) elSaudeMentalVal.textContent = atributos["Saude Mental"];
        if (elSaudeMentalProg) elSaudeMentalProg.style.width = (atributos["Saude Mental"] % 100) + "%";

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

    // --- NOVAS FUNÇÕES (ETAPA 6) ---

    // 4. FUNÇÕES DO REGISTRO DIÁRIO

    /**
     * Renderiza a lista de missões diárias no HTML.
     */
    function renderizarDiario() {
        const listaContainer = document.getElementById("lista-missoes-diarias");
        if (!listaContainer) return; // Sai se não estiver na página 'diario.html'

        listaContainer.innerHTML = ""; // Limpa a lista antes de renderizar

        if (gameState.missoesDiarias.length === 0) {
            listaContainer.innerHTML = "<p>Nenhuma missão para hoje. Adicione uma acima!</p>";
            return;
        }

        gameState.missoesDiarias.forEach(missao => {
            const pilar = pilaresConfig[missao.pilar] || pilaresConfig["nenhum"];

            // Cria o elemento da missão
            const missaoEl = document.createElement("div");
            missaoEl.className = "missao-item glass-effect";
            missaoEl.innerHTML = `
                <input type="checkbox" class="checkbox-missao" data-id="${missao.id}">
                <div class="missao-info">
                    <h3>${missao.nome}</h3>
                    <p>${missao.atributo} (Pilar: ${pilar.nome})</p>
                </div>
                <div class="missao-recompensas">
                    <span class="xp">+${missao.xp * pilar.multiplicador} XP</span>
                    <span class="pr">+${missao.pr * pilar.multiplicador} PR</span>
                </div>
            `;

            // Adiciona o listener para o "Ritual Automatizado"
            missaoEl.querySelector(".checkbox-missao").addEventListener("change", (e) => {
                // Adiciona um pequeno delay para o usuário ver o check
                setTimeout(() => {
                    completarMissao(missao.id);
                }, 300);
            });

            listaContainer.appendChild(missaoEl);
        });
    }

    /**
     * Lida com o submit do formulário de nova missão.
     */
    function handleAdicionarMissao(event) {
        event.preventDefault(); // Impede o recarregamento da página

        // Pega os valores do formulário
        const nome = document.getElementById("missao-nome").value;
        const xp = parseInt(document.getElementById("missao-xp").value);
        const pr = parseInt(document.getElementById("missao-pr").value);
        const atributo = document.getElementById("missao-atributo").value;
        const pilar = document.getElementById("missao-pilar").value;
        const repetivel = document.getElementById("missao-repetivel").checked;

        // Cria o novo objeto missão
        const novaMissao = {
            id: Date.now().toString(), // ID único
            nome: nome,
            xp: xp,
            pr: pr,
            atributo: atributo,
            pilar: pilar,
            repetivel: repetivel
        };

        // Adiciona ao estado
        gameState.missoesDiarias.push(novaMissao);

        salvarGame(); // Salva
        renderizarDiario(); // Re-renderiza a lista

        // Limpa o formulário
        document.getElementById("form-adicionar-missao").reset();
    }

    /**
     * O "RITUAL DE SALVAMENTO" AUTOMATIZADO
     * Chamado quando um checkbox é marcado.
     */
    function completarMissao(missaoId) {
        // 1. Encontrar a missão no estado
        const missaoIndex = gameState.missoesDiarias.findIndex(m => m.id === missaoId);
        if (missaoIndex === -1) return; // Missão não encontrada

        const missao = gameState.missoesDiarias[missaoIndex];

        // 2. Aplicar Ponderação (Bônus dos Pilares) [cite: 72]
        const pilar = pilaresConfig[missao.pilar] || pilaresConfig["nenhum"];
        const multiplicador = pilar.multiplicador;
        const xpGanho = missao.xp * multiplicador;
        const prGanho = missao.pr * multiplicador;

        // 3. Adicionar valores ao total
        gameState.xpTotal += xpGanho;
        gameState.prTotal += prGanho;

        // 4. Adicionar ao atributo
        if (gameState.atributos.hasOwnProperty(missao.atributo)) {
            gameState.atributos[missao.atributo] += xpGanho;
        }

        // 5. Mover para o Histórico [cite: 113, 116]
        gameState.historico.push({
            data: new Date().toLocaleDateString("pt-BR"),
            nome: missao.nome,
            xpGanho: xpGanho,
            prGanho: prGanho,
            atributo: missao.atributo
        });

        // 6. Limpar missão (se não for repetível)
        if (!missao.repetivel) {
            gameState.missoesDiarias.splice(missaoIndex, 1);
        }

        // 7. Checar se alguma conquista foi desbloqueada
        checarConquistas();

        // 8. Salvar o estado
        salvarGame();

        // 9. Re-renderizar a lista do diário (a missão sumirá)
        renderizarDiario();

        // (Opcional) Poderíamos redirecionar ao Painel, mas
        // é melhor ficar no diário para adicionar/completar mais missões.
        // O Painel Principal será atualizado na próxima vez que for carregado.
    }

    /**
     * Verifica se alguma conquista foi desbloqueada (Ex: Consistência) [cite: 23]
     */
    function checarConquistas() {
        // Exemplo: Checar "Consistência de Aço" (7 dias de missões) [cite: 23]
        // Esta lógica é um exemplo; uma checagem real de "dias"
        // exigiria salvar a data da última missão e comparar.
        // Por agora, vamos checar 7 missões *totais* no histórico.

        const conquista = gameState.conquistas["consistencia_7d"];

        if (!conquista.desbloqueada && gameState.historico.length >= 7) {
            conquista.desbloqueada = true;
            gameState.xpTotal += conquista.recompensaXP;

            // Usamos 'alert' por simplicidade. No futuro, isso seria um modal.
            alert(`CONQUISTA DESBLOQUEADA: ${conquista.nome}! Você ganhou +${conquista.recompensaXP} XP EXTRA!`);
        }

        // Outras checagens (ex: Boss Finais) [cite: 23] podem ser adicionadas aqui.
    }

    /**
     * Renderiza os itens da loja no HTML.
     */
    function renderizarLoja() {
        const listaContainer = document.getElementById("lista-loja");
        if (!listaContainer) return; // Sai se não estiver na página

        // Atualiza o saldo de PR
        document.getElementById("pr-saldo").textContent = gameState.prTotal;

        listaContainer.innerHTML = ""; // Limpa a lista

        gameState.loja.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "loja-item glass-effect";

            const podeComprar = gameState.prTotal >= item.custoPR;

            itemEl.innerHTML = `
                <h3>${item.nome}</h3>
                <span class="custo">${item.custoPR} PR</span>
                <button class="btn-comprar" data-id="${item.id}" ${!podeComprar ? 'disabled' : ''}>
                    Resgatar
                </button>
            `;

            // Adiciona listener ao botão de comprar
            itemEl.querySelector(".btn-comprar").addEventListener("click", () => {
                comprarItem(item.id);
            });

            listaContainer.appendChild(itemEl);
        });
    }

    /**
     * Lógica para comprar um item da loja.
     */
    function comprarItem(itemId) {
        const item = gameState.loja.find(i => i.id === itemId);
        if (!item) return;

        if (gameState.prTotal >= item.custoPR) {
            // Subtrai o PR
            gameState.prTotal -= item.custoPR;
            item.quantidade += 1; // Incrementa a quantidade comprada

            alert(`Recompensa "${item.nome}" resgatada! Aproveite!`);

            salvarGame();
            renderizarLoja(); // Re-renderiza a loja com o novo saldo
        } else {
            alert("Pontos de Recompensa (PR) insuficientes!");
        }
    }

    /**
     * Renderiza as conquistas (Mural e Boss Finais) [cite: 23]
     */
    function renderizarConquistas() {
        const bossContainer = document.getElementById("lista-boss-finais");
        const muralContainer = document.getElementById("lista-mural-conquistas");
        if (!muralContainer) return; // Sai se não estiver na página

        // Limpa containers
        bossContainer.innerHTML = "";
        muralContainer.innerHTML = "";

        // Simplesmente iteramos sobre o objeto de conquistas do gameState
        // (No futuro, poderíamos separar "Boss" de "Mural" no gameState)

        for (const key in gameState.conquistas) {
            const conquista = gameState.conquistas[key];

            const conquistaEl = document.createElement("div");
            conquistaEl.className = "conquista-item glass-effect";
            if (conquista.desbloqueada) {
                conquistaEl.classList.add("desbloqueada");
            }

            conquistaEl.innerHTML = `
                <h3>${conquista.nome} ${conquista.desbloqueada ? '✅' : '🔒'}</h3>
                <p>${conquista.descricao}</p>
                <span class="recompensa">+${conquista.recompensaXP} XP EXTRA</span>
            `;

            // Adiciona no container (aqui poderíamos ter uma lógica
            // para separar Boss e Mural, mas por ora usamos um só)
            muralContainer.appendChild(conquistaEl);
        }
    }

    /**
     * Renderiza o histórico de missões concluídas.
     */
    function renderizarHistorico() {
        const listaContainer = document.getElementById("lista-historico");
        if (!listaContainer) return; // Sai se não estiver na página

        listaContainer.innerHTML = "";

        // Pega o histórico e inverte (para mostrar os mais recentes primeiro)
        const historicoReverso = [...gameState.historico].reverse();

        if (historicoReverso.length === 0) {
            listaContainer.innerHTML = "<p>Nenhuma missão concluída ainda.</p>";
            return;
        }

        historicoReverso.forEach(item => {
            const itemEl = document.createElement("div");
            itemEl.className = "historico-item glass-effect";
            itemEl.innerHTML = `
                <span class="data">${item.data}</span>
                <div class="info">
                    <h3>${item.nome}</h3>
                    <p>${item.atributo}</p>
                </div>
                <div class="recompensas">
                    <span class="xp">+${item.xpGanho.toFixed(0)} XP</span>
                    <span class="pr">+${item.prGanho.toFixed(0)} PR</span>
                </div>
            `;
            listaContainer.appendChild(itemEl);
        });
    }

    /**
     * Renderiza os modelos de missão salvos no Banco.
     */
    function renderizarBanco() {
        const listaContainer = document.getElementById("lista-modelos-banco");
        if (!listaContainer) return;

        listaContainer.innerHTML = "";

        if (gameState.bancoMissoes.length === 0) {
            listaContainer.innerHTML = "<p>Nenhum modelo salvo. Crie um acima!</p>";
            return;
        }

        gameState.bancoMissoes.forEach(modelo => {
            const pilar = pilaresConfig[modelo.pilar] || pilaresConfig["nenhum"];
            const xpCalculado = modelo.xp * pilar.multiplicador;
            const prCalculado = modelo.pr * pilar.multiplicador;

            const itemEl = document.createElement("div");
            itemEl.className = "banco-item glass-effect";
            itemEl.innerHTML = `
                <div class="info">
                    <h3>${modelo.nome}</h3>
                    <p>${modelo.atributo} (Pilar: ${pilar.nome})</p>
                    <div class="recompensas">
                        <span class="xp">+${xpCalculado.toFixed(0)} XP</span>
                        <span class="pr">+${prCalculado.toFixed(0)} PR</span>
                    </div>
                </div>
                <button class="btn-ativar" data-id="${modelo.id}">Ativar</button>
            `;

            // Listener para o botão "Ativar"
            itemEl.querySelector(".btn-ativar").addEventListener("click", () => {
                handleAtivarModelo(modelo.id);
            });

            listaContainer.appendChild(itemEl);
        });
    }

    /**
     * Salva um novo modelo de missão no banco.
     */
    function handleAdicionarModelo(event) {
        event.preventDefault(); // Impede o recarregamento

        // Pega os valores do formulário do banco
        const nome = document.getElementById("modelo-nome").value;
        const xp = parseInt(document.getElementById("modelo-xp").value);
        const pr = parseInt(document.getElementById("modelo-pr").value);
        const atributo = document.getElementById("modelo-atributo").value;
        const pilar = document.getElementById("modelo-pilar").value;

        // Cria o novo objeto modelo
        const novoModelo = {
            id: Date.now().toString(), // ID único
            nome: nome,
            xp: xp,
            pr: pr,
            atributo: atributo,
            pilar: pilar
            // Note que 'repetivel' não está aqui; 
            // isso é definido no 'diario.html' ao adicionar
        };

        // Adiciona ao estado
        gameState.bancoMissoes.push(novoModelo);

        salvarGame(); // Salva
        renderizarBanco(); // Re-renderiza a lista de modelos

        // Limpa o formulário
        document.getElementById("form-adicionar-modelo").reset();
    }

    /**
     * "Ativa" um modelo: copia-o para as missões diárias e redireciona.
     */
    function handleAtivarModelo(modeloId) {
        const modelo = gameState.bancoMissoes.find(m => m.id === modeloId);
        if (!modelo) return;

        // Cria uma nova missão baseada no modelo
        const novaMissao = {
            ...modelo, // Copia nome, xp, pr, atributo, pilar
            id: Date.now().toString(), // Dá um novo ID único para a instância diária
            repetivel: false // Por padrão, não é repetível. O usuário pode criar uma versão "repetível" no diário.
        };

        gameState.missoesDiarias.push(novaMissao);
        salvarGame();

        // Informa o usuário e redireciona
        alert(`Missão "${modelo.nome}" adicionada ao seu Diário!`);
        window.location.href = "diario.html"; // Redireciona para a página do diário
    }

    /**
     * Ativa o link de navegação correto nos componentes carregados.
     */
    function atualizarNavAtiva() {
        const path = window.location.pathname;
        // Seleciona os links DENTRO dos placeholders
        const navItems = document.querySelectorAll("#main-nav-placeholder .nav-item, #main-footer-placeholder .nav-item");

        navItems.forEach(item => {
            const pageName = item.getAttribute("data-page");
            if (path.includes(pageName)) {
                item.classList.add("active");
            }
            // Caso especial para o Painel Principal (index.html ou /)
            const isIndex = (path === "/" || path.endsWith("/") || path.endsWith("/index.html"));
            if (isIndex && pageName === "index.html") {
                item.classList.add("active");
            }
        });
    }

    // 5. INICIALIZAÇÃO PRINCIPAL (Agora Assíncrona)
    async function inicializarApp() {
        // --- INÍCIO: GUARDA DE SEGURANÇA ---
        const { data: { session }, error } = await _supabase.auth.getSession();

        if (error) {
            console.error("Erro ao pegar sessão:", error);
            // Não conseguimos verificar, manda para o login
            window.location.href = 'login.html';
            return;
        }

        if (!session) {
            // NÃO HÁ SESSÃO. Usuário não está logado.
            console.log("Nenhum usuário logado. Redirecionando...");
            window.location.href = 'login.html';
            return; // Para a execução do script
        }

        // Se chegamos aqui, o usuário ESTÁ LOGADO
        currentUser = session.user;
        console.log("Usuário logado:", currentUser.email);
        // --- FIM: GUARDA DE SEGURANÇA ---

        // Agora o resto do seu código roda, sabendo que o usuário existe

        // Primeiro, carrega os dados do jogo (AGORA DO BACKEND)
        await carregarGame(); // <- Modificada para AWAIT

        // Depois, carrega os componentes (nav e footer)
        await carregarComponentes();

        // Configura os toggles DOPOIS de carregar os componentes
        setupMenuToggles();

        // Ativa o link correto DEPOIS de carregar
        atualizarNavAtiva();

        // Agora, executa a lógica específica da página
        const path = window.location.pathname;

        if (path.endsWith("/") || path.endsWith("/index.html") || path === "/") {
            // Painel Principal
            atualizarPainelPrincipal();

        } else if (path.includes("diario.html")) {
            // Registro Diário
            renderizarDiario();
            const form = document.getElementById("form-adicionar-missao");
            if (form) {
                form.addEventListener("submit", handleAdicionarMissao);
            }

        } else if (path.includes("loja.html")) {
            // Loja
            renderizarLoja();

        } else if (path.includes("conquistas.html")) {
            // Conquistas
            renderizarConquistas();

        } else if (path.includes("historico.html")) {
            // Histórico
            renderizarHistorico();

        } else if (path.includes("banco.html")) {
            // Banco de Modelos
            renderizarBanco();
            const form = document.getElementById("form-adicionar-modelo");
            if (form) {
                form.addEventListener("submit", handleAdicionarModelo);
            }
        }

        // (Poderíamos adicionar pages/sobre.html aqui)
    }

    // --- Fim do Bloco de Substituição ---

    // Finalmente, chame a nova função de inicialização
    inicializarApp();

    /**
 * Configura os event listeners para o menu mobile (hamburguer).
 */
    function setupMenuToggles() {
        // Seleciona os botões de dentro do placeholder
        const toggleBtn = document.getElementById("menu-toggle-btn");
        const closeBtn = document.getElementById("menu-close-btn");
        const overlay = document.getElementById("mobile-menu-overlay");

        if (toggleBtn && closeBtn && overlay) {
            // Abrir menu
            toggleBtn.addEventListener("click", () => {
                document.body.classList.add("menu-open");
            });

            // Fechar menu (pelo botão 'X')
            closeBtn.addEventListener("click", () => {
                document.body.classList.remove("menu-open");
            });

            // Fechar menu (clicando fora do painel, no overlay)
            overlay.addEventListener("click", (e) => {
                // Verifica se o clique foi no overlay e não no painel
                if (e.target === overlay) {
                    document.body.classList.remove("menu-open");
                }
            });
        }
    }

    /**
     * Ativa o link de navegação correto.
     */
    function atualizarNavAtiva() {
        const path = window.location.pathname;
        // Seleciona links do menu desktop, menu mobile, e footer
        const navItems = document.querySelectorAll(
            ".desktop-nav-container .nav-item, " +
            ".mobile-menu-panel .nav-item, " +
            "#main-footer-placeholder .nav-item"
        );

        navItems.forEach(item => {
            const pageName = item.getAttribute("data-page");
            if (path.includes(pageName)) {
                item.classList.add("active");
            }
            // Caso especial para o Painel Principal (index.html ou /)
            if ((path === "/" || path.endsWith("/index.html")) && pageName === "index.html") {
                item.classList.add("active");
            }
        });
    }

    atualizarNavAtiva(); // Chama a função na inicialização
});