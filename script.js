/* =========================
   ESTADO DO JOGO
========================= */
let jogadores = {
    1: { hp: 0, maxHp: 0, selecionado: false },
    2: { hp: 0, maxHp: 0, selecionado: false }
};

/* =========================
   BUSCAR POKÉMON (API)
========================= */
async function buscarParaJogador(playerNum) {
    const input = document.getElementById(`input-p${playerNum}`);
    const display = document.getElementById(`display-p${playerNum}`);
    const nomePokemon = input.value.toLowerCase().trim();

    if (!nomePokemon) {
        alert("Digite o nome de um Pokémon!");
        return;
    }

    try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${nomePokemon}`);

        if (!response.ok) {
            throw new Error("Pokémon não encontrado!");
        }

        const data = await response.json();
        const hp = data.stats[0].base_stat;

        // Atualiza o estado
        jogadores[playerNum].hp = hp;
        jogadores[playerNum].maxHp = hp;
        jogadores[playerNum].selecionado = true;

        // Renderiza o Card
        display.innerHTML = `
            <div class="card">
                <img src="${data.sprites.front_default}" alt="${data.name}" width="150">
                <h3>${data.name.toUpperCase()}</h3>
                <p>Tipo: ${data.types.map(t => t.type.name).join(', ')}</p>
                <div class="hp-bar">
                    <div class="hp-fill" id="hp-fill-p${playerNum}"></div>
                </div>
                <p><strong>HP: <span id="hp-text-p${playerNum}">${hp}</span></strong></p>
            </div>
        `;

        atualizarBarraHP(playerNum);
        verificarBotaoBatalha();

    } catch (erro) {
        display.innerHTML = `<p style="color:red;">${erro.message}</p>`;
    }
}

/* =========================
   ATUALIZAR BARRA HP
========================= */
function atualizarBarraHP(playerNum) {
    const jogador = jogadores[playerNum];
    const porcentagem = (jogador.hp / jogador.maxHp) * 100;

    const barra = document.getElementById(`hp-fill-p${playerNum}`);
    const textoHP = document.getElementById(`hp-text-p${playerNum}`);

    if (!barra) return;

    barra.style.width = porcentagem + "%";
    textoHP.innerText = Math.max(0, jogador.hp); // Garante que não mostre HP negativo

    // Cores da barra baseadas na vida
    if (porcentagem > 50) {
        barra.style.backgroundColor = "#4caf50"; // Verde
    } else if (porcentagem > 20) {
        barra.style.backgroundColor = "#ff9800"; // Laranja
    } else {
        barra.style.backgroundColor = "#f44336"; // Vermelho
    }
}

/* =========================
   REGRAS DE INTERFACE
========================= */
function verificarBotaoBatalha() {
    const btn = document.getElementById('btn-batalhar');
    if (jogadores[1].selecionado && jogadores[2].selecionado) {
        btn.classList.remove('hidden');
    }
}

/* =========================
   SISTEMA DE BATALHA (LÓGICA DE TURNO)
========================= */
function batalhar() {
    const btn = document.getElementById('btn-batalhar');
    btn.disabled = true; // Impede cliques duplos durante a luta
    btn.innerText = "Lutando...";

    // Loop de ataques automáticos
    const intervaloBatalha = setInterval(() => {
        // Cálculo de dano aleatório entre 8 e 25
        const danoP1 = Math.floor(Math.random() * 18) + 8;
        const danoP2 = Math.floor(Math.random() * 18) + 8;

        // Ambos atacam ao mesmo tempo
        jogadores[1].hp -= danoP2;
        jogadores[2].hp -= danoP1;

        // Atualiza a tela
        atualizarBarraHP(1);
        atualizarBarraHP(2);

        // Verifica se alguém chegou a zero
        if (jogadores[1].hp <= 0 || jogadores[2].hp <= 0) {
            clearInterval(intervaloBatalha);
            finalizarBatalha();
        }
    }, 600); // Tempo entre os golpes (600ms)
}

function finalizarBatalha() {
    let resultado;
    const p1 = jogadores[1].hp;
    const p2 = jogadores[2].hp;

    if (p1 > p2) {
        resultado = "O Jogador 1 Venceu! 🏆";
    } else if (p2 > p1) {
        resultado = "O Jogador 2 Venceu! 🏆";
    } else {
        resultado = "Empate Técnico! 🤝";
    }

    document.getElementById("winner-text").innerText = resultado;
    document.getElementById("score-text").innerText = `HP Final: P1(${Math.max(0, p1)}) vs P2(${Math.max(0, p2)})`;
    document.getElementById("modal-result").classList.add("show");
}

/* =========================
   REINICIAR JOGO
========================= */
function reiniciarJogo() {
    jogadores = {
        1: { hp: 0, maxHp: 0, selecionado: false },
        2: { hp: 0, maxHp: 0, selecionado: false }
    };

    // Limpar campos e displays
    document.getElementById('display-p1').innerHTML = "";
    document.getElementById('display-p2').innerHTML = "";
    document.getElementById('input-p1').value = "";
    document.getElementById('input-p2').value = "";

    // Resetar botões e modal
    const btn = document.getElementById('btn-batalhar');
    btn.classList.add('hidden');
    btn.disabled = false;
    btn.innerText = "BATALHAR!";
    document.getElementById('modal-result').classList.remove('show');
}

/* =========================
   INICIALIZAÇÃO DE EVENTOS
========================= */
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btn-p1').addEventListener('click', () => buscarParaJogador(1));
    document.getElementById('btn-p2').addEventListener('click', () => buscarParaJogador(2));
    document.getElementById('btn-batalhar').addEventListener('click', batalhar);
    document.getElementById('btn-reiniciar').addEventListener('click', reiniciarJogo);
});