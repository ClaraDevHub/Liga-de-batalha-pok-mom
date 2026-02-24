// =================================
// SISTEMA DE ÁUDIO UNIVERSAL
// =================================

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const sounds = {
    battle: new Audio("sounds/battle.mp3"),
    hit: new Audio("sounds/hit.mp3"),
    victory: new Audio("sounds/victory.mp3"),
    click: new Audio("sounds/click.mp3")
};

sounds.battle.loop = true;
sounds.battle.volume = 0.4;
sounds.hit.volume = 0.5;
sounds.victory.volume = 0.6;
sounds.click.volume = 0.7;


let audioUnlocked = false;

function unlockAudio() {
    if (audioUnlocked) return;

    Object.values(sounds).forEach(sound => {
        sound.play()
            .then(() => {
                sound.pause();
                sound.currentTime = 0;
            })
            .catch(() => { });
    });

    audioUnlocked = true;
}

function playClick() {
    sounds.click.currentTime = 0;
    sounds.click.play().catch(() => { });
}

function playCry(name) {
    const cry = new Audio(
        `https://play.pokemonshowdown.com/audio/cries/${name}.mp3`
    );
    cry.volume = 0.4;
    cry.play().catch(() => { });
}

function startBattleMusic() {
    sounds.battle.currentTime = 0;
    sounds.battle.play().catch(() => { });
}

function stopBattleMusic() {
    sounds.battle.pause();
    sounds.battle.currentTime = 0;
}

function playHit() {
    sounds.hit.currentTime = 0;
    sounds.hit.play().catch(() => { });
}

function playVictory() {
    stopBattleMusic();
    sounds.victory.currentTime = 0;
    sounds.victory.play().catch(() => { });
}


// =================================
// ESTADO GLOBAL
// =================================

let jogadores;
let battleInterval = null;
let batalhaAtiva = false;

function criarEstadoInicial() {

    return {

        1: {
            1: { hp: 0, maxHp: 0, selecionado: false, nome: "" },
            2: { hp: 0, maxHp: 0, selecionado: false, nome: "" }
        },

        2: {
            1: { hp: 0, maxHp: 0, selecionado: false, nome: "" },
            2: { hp: 0, maxHp: 0, selecionado: false, nome: "" }
        }

    };

}

jogadores = criarEstadoInicial();


// =================================
// BUSCAR
// =================================

async function buscarPokemon(player, slot) {

    const input =
        document.getElementById(`input-p${player}-${slot}`);

    const nome =
        input.value.toLowerCase().trim();

    if (!nome) {

        alert("Digite um nome");
        return;

    }

    unlockAudio();
    playClick();

    carregarPokemon(player, slot, nome);

}


// =================================
// ALEATORIO
// =================================

function pokemonAleatorio(player, slot) {

    unlockAudio();
    playClick();

    const id =
        Math.floor(Math.random() * 1025) + 1;

    carregarPokemon(player, slot, id);

}


// =================================
// CARREGAR
// =================================

async function carregarPokemon(player, slot, nome) {

    const display =
        document.getElementById(`display-p${player}-${slot}`);

    display.innerHTML = "Carregando...";

    try {

        const res =
            await fetch(
                `https://pokeapi.co/api/v2/pokemon/${nome}`
            );

        const data =
            await res.json();

        const hp =
            data.stats[0].base_stat;

        jogadores[player][slot] = {

            hp,
            maxHp: hp,
            selecionado: true,
            nome: data.name

        };

        display.innerHTML = `

        <img src="${data.sprites.other["official-artwork"].front_default}">

        <h3>${data.name.toUpperCase()}</h3>

        <div class="hp-bar">
            <div class="hp"
            id="hp-${player}-${slot}"
            style="width:100%"></div>
        </div>

        <span id="hp-text-${player}-${slot}">
        ${hp}/${hp}
        </span>

        `;

        await delay(650); // tempo entre click e cry
        playCry(data.name);

        verificarBotao();


    }
    catch {

        display.innerHTML = "Erro";

    }

}


// =================================
// ATUALIZAR HP INDIVIDUAL
// =================================

function atualizarHP(player, slot) {

    const p =
        jogadores[player][slot];

    const percent =
        Math.max(0, (p.hp / p.maxHp) * 100);

    document.getElementById(
        `hp-${player}-${slot}`
    ).style.width =
        percent + "%";

    document.getElementById(
        `hp-text-${player}-${slot}`
    ).innerText =
        `${Math.max(0, p.hp)}/${p.maxHp}`;

}


// =================================
// SOMA TOTAL HP
// =================================

function totalHP(player) {

    return (
        jogadores[player][1].hp +
        jogadores[player][2].hp
    );

}


// =================================
// VALIDAR BOTÃO
// =================================

function todosSelecionados() {

    return (

        jogadores[1][1].selecionado &&
        jogadores[1][2].selecionado &&
        jogadores[2][1].selecionado &&
        jogadores[2][2].selecionado

    );

}

function verificarBotao() {

    const btn =
        document.getElementById("btn-batalhar");

    if (todosSelecionados()) {

        btn.classList.remove("hidden");

    }
    else {

        btn.classList.add("hidden");

    }

}


// =================================
// BATALHA 2v2 REAL
// =================================

function batalhar() {

    if (!todosSelecionados()) {

        alert("Escolha todos os pokémons!");
        return;

    }

    if (batalhaAtiva) return;

    batalhaAtiva = true;

    unlockAudio();
    startBattleMusic();

    const btn =
        document.getElementById("btn-batalhar");

    btn.disabled = true;
    btn.innerText = "Batalhando...";

    battleInterval =
        setInterval(() => {

            atacar(1, 2);
            atacar(2, 1);

            if (totalHP(1) <= 0 || totalHP(2) <= 0) {

                finalizar();

            }

        }, 800);

}


// =================================
// ATAQUE SIMULTÂNEO
// =================================

function atacar(atacante, defensor) {

    for (let slot = 1; slot <= 2; slot++) {

        const alvo =
            jogadores[defensor][slot];

        if (alvo.hp <= 0) continue;

        const dano =
            Math.floor(Math.random() * 15) + 5;

        alvo.hp -= dano;

        atualizarHP(defensor, slot);

        playHit();

    }

}


// =================================
// FINALIZAR
// =================================

function finalizar() {

    clearInterval(battleInterval);

    batalhaAtiva = false;

    playVictory();

    let texto = "";

    const hp1 = totalHP(1);
    const hp2 = totalHP(2);

    if (hp1 > hp2)
        texto = "Jogador 1 venceu!";

    else if (hp2 > hp1)
        texto = "Jogador 2 venceu!";

    else
        texto = "Empate!";

    document.getElementById(
        "resultado"
    ).innerText = texto;

    document.getElementById(
        "modal"
    ).style.display = "flex";

}


// =================================
// REINICIAR
// =================================

function reiniciar() {

    clearInterval(battleInterval);

    batalhaAtiva = false;

    stopBattleMusic();

    sounds.victory.pause();
    sounds.victory.currentTime = 0;

    jogadores =
        criarEstadoInicial();

    for (let p = 1; p <= 2; p++) {

        for (let s = 1; s <= 2; s++) {

            document.getElementById(
                `display-p${p}-${s}`
            ).innerHTML = "";

            document.getElementById(
                `input-p${p}-${s}`
            ).value = "";

        }

    }

    const btn =
        document.getElementById("btn-batalhar");

    btn.disabled = false;
    btn.innerText = "INICIAR BATALHA";
    btn.classList.add("hidden");

    document.getElementById(
        "modal"
    ).style.display = "none";

}


// =================================
// EVENTOS
// =================================

document.addEventListener(
    "DOMContentLoaded", () => {

        document.getElementById(
            "btn-batalhar"
        ).onclick = batalhar;

        document.getElementById(
            "btn-reiniciar"
        ).onclick = () => {
            unlockAudio();
            playClick();
            reiniciar();
        };

    });