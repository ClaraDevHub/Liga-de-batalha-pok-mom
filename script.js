// =================================
// SISTEMA DE ÁUDIO UNIVERSAL
// funciona em TODOS navegadores
// =================================

const sounds = {
    battle: new Audio("sounds/battle.mp3"),
    hit: new Audio("sounds/hit.mp3"),
    victory: new Audio("sounds/victory.mp3"),
    click: new Audio("sounds/click.mp3")
};

sounds.battle.loop = true;
sounds.battle.volume = 0.4;
sounds.hit.volume = 0.7;
sounds.victory.volume = 0.7;
sounds.click.volume = 0.7;

// desbloqueia audio no primeiro clique
let audioUnlocked = false;
function unlockAudio() {
    if (audioUnlocked) return;
    Object.values(sounds).forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(() => { });
    });
    audioUnlocked = true;
}

// funções de som
function playClick() { sounds.click.currentTime = 0; sounds.click.play().catch(() => {}); }
function playCry(name) {
    const cry = new Audio(`https://play.pokemonshowdown.com/audio/cries/${name.toLowerCase()}.mp3`);
    cry.volume = 0.7;
    cry.play().catch(()=>{});
}
function startBattleMusic() { sounds.battle.currentTime = 0; sounds.battle.play().catch(()=>{}); }
function stopBattleMusic() { sounds.battle.pause(); }
function playHit() { sounds.hit.currentTime = 0; sounds.hit.play().catch(()=>{}); }
function playVictory() { stopBattleMusic(); sounds.victory.currentTime = 0; sounds.victory.play().catch(()=>{}); }

// =================================
// ESTADO
// =================================
let jogadores = {
    1: { hp: 0, maxHp: 0, selecionado: false, nome: "" },
    2: { hp: 0, maxHp: 0, selecionado: false, nome: "" }
};

// =================================
// BUSCAR POKEMON
// =================================
async function buscarPokemon(player){
    const input = document.getElementById(`input-p${player}`);
    const nome = input.value.toLowerCase().trim();

    if(!nome){
        alert("Digite um nome");
        return; // aqui já retorna, sem tocar som
    }

    unlockAudio();
    playClick();   // som de clique

    carregarPokemon(player, nome);
}

// =================================
// POKEMON ALEATORIO
// =================================
function pokemonAleatorio(player){
    unlockAudio();
    playClick();   // som de clique

    const id = Math.floor(Math.random()*1025)+1;
    carregarPokemon(player, id);
}

// =================================
// FUNÇÕES DE POKEMON
// =================================
async function carregarPokemon(player, nome) {
    const display = document.getElementById(`display-p${player}`);
    display.innerHTML = "Carregando...";

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nome}`);
        const data = await res.json();
        const hp = data.stats[0].base_stat;

        jogadores[player] = { hp, maxHp: hp, selecionado: true, nome: data.name };

        display.innerHTML = `<img src="${data.sprites.other["official-artwork"].front_default}">
        <h3>${data.name.toUpperCase()}</h3>
        <div class="hp-bar"><div class="hp" id="hp-${player}"></div></div>
        <span id="hp-text-${player}">${hp}/${hp}</span>`;

        atualizarHP(player);
        playCry(data.name);
        verificarBotao();

    }
    catch {
        display.innerHTML = "Erro ao carregar";
    }
}

// =================================
// HP
// =================================
function atualizarHP(player) {
    const j = jogadores[player];
    const percent = (j.hp / j.maxHp) * 100;
    document.getElementById(`hp-${player}`).style.width = percent + "%";
    document.getElementById(`hp-text-${player}`).innerText = `${Math.max(0, j.hp)}/${j.maxHp}`;
}

// =================================
// BOTÃO
// =================================
function verificarBotao() {
    if (jogadores[1].selecionado && jogadores[2].selecionado) {
        document.getElementById("btn-batalhar").classList.remove("hidden");
    }
}

// =================================
// BATALHA
// =================================
function batalhar() {
    startBattleMusic();

    const btn = document.getElementById("btn-batalhar");
    btn.disabled = true;
    btn.innerText = "Batalhando...";

    const loop = setInterval(() => {
        playHit();
        const dano1 = Math.floor(Math.random() * 18) + 5;
        const dano2 = Math.floor(Math.random() * 18) + 5;

        jogadores[1].hp -= dano2;
        jogadores[2].hp -= dano1;

        atualizarHP(1);
        atualizarHP(2);

        if (jogadores[1].hp <= 0 || jogadores[2].hp <= 0) {
            clearInterval(loop);
            finalizar();
        }

    }, 700);
}

// =================================
// FINAL
// =================================
function finalizar() {
    playVictory();
    let texto = "";
    if (jogadores[1].hp > jogadores[2].hp) texto = "Jogador 1 venceu!";
    else if (jogadores[2].hp > jogadores[1].hp) texto = "Jogador 2 venceu!";
    else texto = "Empate!";

    document.getElementById("resultado").innerText = texto;

    const modal = document.getElementById("modal");
    modal.style.display = "flex";

    // =================================
    // BOTÃO JOGAR NOVAMENTE
    // =================================
    const btnReiniciar = modal.querySelector("button");
    btnReiniciar.onclick = () => {
        unlockAudio();
        playClick();
        reiniciar();
    };
}

// =================================
// REINICIAR SEM RECARREGAR
// =================================
function reiniciar() {
    // Toca som de clique
    sounds.click.currentTime = 0;
    sounds.click.play().catch(()=>{});

    // Para todas as músicas
    stopBattleMusic();
    sounds.victory.pause();
    sounds.victory.currentTime = 0;

    // Reseta jogadores
    jogadores = {
        1: { hp: 0, maxHp: 0, selecionado: false, nome: "" },
        2: { hp: 0, maxHp: 0, selecionado: false, nome: "" }
    };

    // Limpa displays
    document.getElementById("display-p1").innerHTML = "";
    document.getElementById("display-p2").innerHTML = "";

    // Limpa inputs
    document.getElementById("input-p1").value = "";
    document.getElementById("input-p2").value = "";

    // Reseta botão batalha
    const btn = document.getElementById("btn-batalhar");
    btn.classList.add("hidden");
    btn.disabled = false;
    btn.innerText = "INICIAR BATALHA";

    // Fecha modal
    document.getElementById("modal").style.display = "none";
}

// =================================
// PARAR TODAS AS MÚSICAS
// =================================
function stopAllSounds() {
    stopBattleMusic();
    sounds.hit.pause();
    sounds.hit.currentTime = 0;
    sounds.victory.pause();
    sounds.victory.currentTime = 0;
}

// =================================
// EVENTO
// =================================
document.addEventListener("DOMContentLoaded", () => {

    // =================================
    // BOTÃO INICIAR BATALHA
    // =================================
    document.getElementById("btn-batalhar").onclick = batalhar;

    // =================================
    // BOTÕES BUSCAR e EU ESCOLHO VOCÊ
    // =================================
    const btnBuscar1 = document.querySelector('#input-p1 + button');
    const btnAleatorio1 = btnBuscar1.nextElementSibling;
    const btnBuscar2 = document.querySelector('#input-p2 + button');
    const btnAleatorio2 = btnBuscar2.nextElementSibling;

    [btnBuscar1, btnAleatorio1, btnBuscar2, btnAleatorio2].forEach(btn => {
        btn.addEventListener('click', () => {
            unlockAudio();
            playClick();
        });
    });

    // =================================
    // BOTÃO JOGAR NOVAMENTE (REINICIAR)
    // =================================
    const btnReiniciar = document.querySelector('#modal button');
    btnReiniciar.addEventListener('click', () => {
        unlockAudio();
        playClick();
        reiniciar();
    });

});