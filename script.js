// =================================
// ESTADO DO JOGO
// Cada jogador tem 2 slots (s1 e s2)
// Cada slot guarda os dados do Pokémon
// =================================
const estado = {
  1: { s1: null, s2: null },
  2: { s1: null, s2: null }
};

// =================================
// TABELA DE VANTAGEM DE TIPO
// Se o jogador tiver vantagem, ganha +15% nos stats finais
// =================================
const vantagemTipo = {
  fire:    ["grass", "ice", "bug", "steel"],
  water:   ["fire", "ground", "rock"],
  grass:   ["water", "ground", "rock"],
  electric:["water", "flying"],
  ice:     ["grass", "ground", "flying", "dragon"],
  fighting:["normal", "ice", "rock", "dark", "steel"],
  poison:  ["grass", "fairy"],
  ground:  ["fire", "electric", "poison", "rock", "steel"],
  flying:  ["grass", "fighting", "bug"],
  psychic: ["fighting", "poison"],
  bug:     ["grass", "psychic", "dark"],
  rock:    ["fire", "ice", "flying", "bug"],
  ghost:   ["psychic", "ghost"],
  dragon:  ["dragon"],
  dark:    ["psychic", "ghost"],
  steel:   ["ice", "rock", "fairy"],
  fairy:   ["fighting", "dragon", "dark"],
  normal:  [],
};

// =================================
// SONS
// =================================
const sounds = {
  battle:  new Audio("sounds/battle.mp3"),
  hit:     new Audio("sounds/hit.mp3"),
  victory: new Audio("sounds/victory.mp3"),
  click:   new Audio("sounds/click.mp3")
};
sounds.battle.loop = true;
sounds.battle.volume = 0.4;
sounds.hit.volume = 0.7;
sounds.victory.volume = 0.7;
sounds.click.volume = 0.5;

let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  Object.values(sounds).forEach(s => s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {}));
  audioUnlocked = true;
}
function playClick()   { sounds.click.currentTime = 0;   sounds.click.play().catch(() => {}); }
function playHit()     { sounds.hit.currentTime = 0;     sounds.hit.play().catch(() => {}); }
function playVictory() { stopBattleMusic(); sounds.victory.currentTime = 0; sounds.victory.play().catch(() => {}); }
function startBattleMusic() { sounds.battle.currentTime = 0; sounds.battle.play().catch(() => {}); }
function stopBattleMusic()  { sounds.battle.pause(); }

function playCry(name) {
  const cry = new Audio(`https://play.pokemonshowdown.com/audio/cries/${name.toLowerCase()}.mp3`);
  cry.volume = 0.6;
  cry.play().catch(() => {});
}

// =================================
// BUSCAR POKÉMON (por nome/id)
// =================================
async function buscarPokemon(player, slot) {
  unlockAudio();
  playClick();
  const input = document.getElementById(`input-p${player}-s${slot}`);
  const nome = input.value.toLowerCase().trim();

  if (!nome) {
    mostrarErro(player, slot, "⚠️ Digite um nome ou ID antes de buscar!");
    return;
  }
  await carregarPokemon(player, slot, nome);
}

// =================================
// POKÉMON ALEATÓRIO
// =================================
async function pokemonAleatorio(player, slot) {
  unlockAudio();
  playClick();
  const id = Math.floor(Math.random() * 1025) + 1;
  await carregarPokemon(player, slot, id);
}

// =================================
// CARREGAR POKÉMON DA POKEAPI
// Endpoint: GET https://pokeapi.co/api/v2/pokemon/{name ou id}
//
// Dados que usamos da resposta:
//   data.name           → nome do pokémon
//   data.types[]        → array de tipos (ex: [{type:{name:"fire"}}, ...])
//   data.stats[]        → array de stats na ordem:
//                         [0]=hp, [1]=attack, [2]=defense,
//                         [3]=special-attack, [4]=special-defense, [5]=speed
//   data.sprites.other["official-artwork"].front_default → imagem HD
//   data.cries.latest   → URL do som do pokémon (novo campo da API)
// =================================
async function carregarPokemon(player, slot, nomeOuId) {
  const display = document.getElementById(`display-p${player}-s${slot}`);

  // Loading state
  display.innerHTML = `
    <div class="loading">
      <div class="pokeball-spin">⚪</div>
      <p>Carregando...</p>
    </div>`;

  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${nomeOuId}`);

    if (!res.ok) {
      // API retornou erro (404 = não encontrado, etc.)
      mostrarErro(player, slot, "Pokémon não encontrado. Verifique o nome e tente novamente.");
      return;
    }

    const data = await res.json();

    // --- Extrai os tipos ---
    const tipos = data.types.map(t => t.type.name);

    // --- Calcula a soma dos base stats (todos os 6) ---
    const stats = {
      hp:             data.stats[0].base_stat,
      attack:         data.stats[1].base_stat,
      defense:        data.stats[2].base_stat,
      specialAttack:  data.stats[3].base_stat,
      specialDefense: data.stats[4].base_stat,
      speed:          data.stats[5].base_stat,
    };
    const totalStats = Object.values(stats).reduce((acc, val) => acc + val, 0);

    // --- Imagem (official artwork, fallback para sprite normal) ---
    const imagem =
      data.sprites.other?.["official-artwork"]?.front_default ||
      data.sprites.front_default ||
      "https://via.placeholder.com/150";

    // --- Salva no estado ---
    estado[player][`s${slot}`] = {
      nome: data.name,
      tipos,
      stats,
      totalStats,
      imagem,
    };

    // --- Renderiza o card do Pokémon ---
    display.innerHTML = `
      <div class="pokemon-card">
        <img src="${imagem}" alt="${data.name}" class="pokemon-img" />
        <h3 class="pokemon-name">${data.name.toUpperCase()}</h3>
        <div class="tipos">
          ${tipos.map(t => `<span class="tipo tipo-${t}">${traduzirTipo(t)}</span>`).join("")}
        </div>
        <div class="stats-list">
          ${renderizarStats(stats, totalStats)}
        </div>
        <p class="total-stats"> Total: <strong>${totalStats}</strong></p>
      </div>`;

    // Toca o som do Pokémon
    playCry(data.name);

    // Atualiza o total do jogador na tela
    atualizarTotalJogador(player);

    // Verifica se pode mostrar botão batalhar
    verificarBotao();

  } catch (err) {
    // Erro de rede ou outro erro inesperado
    mostrarErro(player, slot, " Erro de conexão. Verifique sua internet e tente novamente.");
  }
}

// =================================
// RENDERIZAR BARRAS DE STATS
// Cada stat tem uma barra colorida proporcional (max 255)
// =================================
function renderizarStats(stats, total) {
  const labels = {
    hp: "HP",
    attack: "ATK",
    defense: "DEF",
    specialAttack: "SpA",
    specialDefense: "SpD",
    speed: "VEL"
  };
  const cores = {
    hp: "#ff5959",
    attack: "#f5ac78",
    defense: "#fae078",
    specialAttack: "#9db7f5",
    specialDefense: "#a7db8d",
    speed: "#fa92b2"
  };

  return Object.entries(stats).map(([key, val]) => `
    <div class="stat-row">
      <span class="stat-label">${labels[key]}</span>
      <div class="stat-bar-bg">
        <div class="stat-bar" style="width:${Math.min((val/255)*100, 100)}%; background:${cores[key]};"></div>
      </div>
      <span class="stat-val">${val}</span>
    </div>
  `).join("");
}

// =================================
// TRADUZ TIPOS PARA PORTUGUÊS
// =================================
function traduzirTipo(tipo) {
  const traducoes = {
    fire:"Fogo", water:"Água", grass:"Planta", electric:"Elétrico",
    ice:"Gelo", fighting:"Lutador", poison:"Veneno", ground:"Terra",
    flying:"Voador", psychic:"Psíquico", bug:"Inseto", rock:"Pedra",
    ghost:"Fantasma", dragon:"Dragão", dark:"Sombrio", steel:"Aço",
    fairy:"Fada", normal:"Normal"
  };
  return traducoes[tipo] || tipo;
}

// =================================
// MOSTRA ERRO NO DISPLAY
// =================================
function mostrarErro(player, slot, msg) {
  const display = document.getElementById(`display-p${player}-s${slot}`);
  display.innerHTML = `<div class="error-msg">${msg}</div>`;
  estado[player][`s${slot}`] = null;
  atualizarTotalJogador(player);
  verificarBotao();
}

// =================================
// ATUALIZA O TOTAL DE STATS DO JOGADOR
// =================================
function atualizarTotalJogador(player) {
  const s1 = estado[player].s1;
  const s2 = estado[player].s2;
  const total = (s1 ? s1.totalStats : 0) + (s2 ? s2.totalStats : 0);
  const el = document.querySelector(`#total-p${player} span`);
  if (s1 || s2) {
    el.textContent = total;
  } else {
    el.textContent = "—";
  }
}

// =================================
// VERIFICA SE PODE MOSTRAR O BOTÃO BATALHAR
// Só aparece quando os 4 slots estão preenchidos
// =================================
function verificarBotao() {
  const tudo = estado[1].s1 && estado[1].s2 && estado[2].s1 && estado[2].s2;
  document.getElementById("btn-batalhar").classList.toggle("hidden", !tudo);
}

// =================================
// CALCULAR VANTAGEM DE TIPO
// Retorna o multiplicador (1.15 se tiver vantagem, senão 1.0)
// Lógica: se QUALQUER tipo de um dos pokémons do jogador tem vantagem
//         sobre QUALQUER tipo de um dos pokémons adversários
// =================================
function calcularMultiplicador(pokemonsAtacante, pokemonsDefensor) {
  const tiposAtacante = pokemonsAtacante.flatMap(p => p.tipos);
  const tiposDefensor = pokemonsDefensor.flatMap(p => p.tipos);

  let temVantagem = false;

  for (const tipoAtk of tiposAtacante) {
    const vantagens = vantagemTipo[tipoAtk] || [];
    if (vantagens.some(v => tiposDefensor.includes(v))) {
      temVantagem = true;
      break;
    }
  }

  return temVantagem ? 1.15 : 1.0;
}

// =================================
// BATALHAR
// =================================
function batalhar() {
  unlockAudio();
  playClick();

  const btn = document.getElementById("btn-batalhar");
  btn.disabled = true;
  btn.textContent = " Batalhando...";

  startBattleMusic();

 // Simula impacto visual + som antes do cálculo final
  let hits = 0;
  const totalHits = 4; // menos golpes
  const tempoEntreHits = 900; // mais lento (quase 1s)

  const efeito = setInterval(() => {

    playHit();

    document.querySelectorAll(".pokemon-img").forEach(img => {
      img.style.transform = "translateX(10px)";
      setTimeout(() => {
        img.style.transform = "translateX(-10px)";
      }, 150);
    });

    hits++;

    if (hits >= totalHits) {
      clearInterval(efeito);
      setTimeout(() => {
        calcularResultadoFinal();
      }, 600);
    }

  }, tempoEntreHits);
}

 function calcularResultadoFinal() {

    const p1 = [estado[1].s1, estado[1].s2];
    const p2 = [estado[2].s1, estado[2].s2];

    // Soma dos base stats de cada jogador
    const totalP1Raw = p1.reduce((acc, p) => acc + p.totalStats, 0);
    const totalP2Raw = p2.reduce((acc, p) => acc + p.totalStats, 0);

    // Calcula vantagem de tipo (bônus de 15%)
    const multP1 = calcularMultiplicador(p1, p2);
    const multP2 = calcularMultiplicador(p2, p1);

    const totalP1Final = Math.round(totalP1Raw * multP1);
    const totalP2Final = Math.round(totalP2Raw * multP2);

    playVictory();
  mostrarResultado(totalP1Final, totalP2Final, multP1, multP2, totalP1Raw, totalP2Raw);
}

// =================================
// MOSTRAR RESULTADO NO MODAL
// =================================
function mostrarResultado(totalP1, totalP2, multP1, multP2, rawP1, rawP2) {
  let titulo = "";
  let trophy = "";

  if (totalP1 > totalP2) {
    titulo = " Jogador 1 Venceu!";
    trophy = "";
  } else if (totalP2 > totalP1) {
    titulo = " Jogador 2 Venceu!";

  } else {
    titulo = " Empate!";
  }

  document.getElementById("resultado").textContent = titulo;
  document.getElementById("modal-trophy").textContent = trophy;

  // Monta as informações de pontuação com bônus de tipo se houver
  const bonusP1 = multP1 > 1 ? ` <span class="bonus-tag">+15% Vantagem de Tipo!</span>` : "";
  const bonusP2 = multP2 > 1 ? ` <span class="bonus-tag">+15% Vantagem de Tipo!</span>` : "";

  document.getElementById("modal-scores").innerHTML = `
    <div class="score-row">
      <span class="score-label"> Jogador 1</span>
      <span class="score-value">${rawP1}${multP1 > 1 ? ` → ${totalP1}` : ""}${bonusP1}</span>
    </div>
    <div class="score-row">
      <span class="score-label"> Jogador 2</span>
      <span class="score-value">${rawP2}${multP2 > 1 ? ` → ${totalP2}` : ""}${bonusP2}</span>
    </div>`;

  document.getElementById("modal").style.display = "flex";
}

// =================================
// REINICIAR O JOGO
// =================================
function reiniciar() {
  unlockAudio();
  playClick();
  stopBattleMusic();
  sounds.victory.pause();
  sounds.victory.currentTime = 0;

  // Reseta o estado
  estado[1] = { s1: null, s2: null };
  estado[2] = { s1: null, s2: null };

  // Limpa todos os displays e inputs
  [1, 2].forEach(p => {
    [1, 2].forEach(s => {
      document.getElementById(`display-p${p}-s${s}`).innerHTML = "";
      document.getElementById(`input-p${p}-s${s}`).value = "";
    });
    document.querySelector(`#total-p${p} span`).textContent = "—";
  });

  // Reseta botão batalhar
  const btn = document.getElementById("btn-batalhar");
  btn.classList.add("hidden");
  btn.disabled = false;
  btn.textContent = " INICIAR BATALHA ";

  // Fecha modal
  document.getElementById("modal").style.display = "none";
}

// =================================
// EVENTO: botão batalhar
// =================================
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("btn-batalhar").addEventListener("click", batalhar);
});
