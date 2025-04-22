// === Variables Globales ===
let nb_joueurs = 6;
let player_position = new Array(nb_joueurs).fill(0);
let player_lastroll = new Array(nb_joueurs).fill(0);
let player_state = new Array(nb_joueurs).fill(0);
let player_turns = new Array(nb_joueurs).fill(0);
let player_color = [];
let totalCases = 64;
let positions = [];
let positions_current = [];
let positions_target = [];
let player_img = [];
let x_offset = 600;
let y_offset = 200;
let cellSize = 60;
let gridSize = 14;
let dice1 = 1;
let dice2 = 1;
let offset_leftpanel_x = 80;
let offset_leftpanel_y = 180;

// Logs
let offset_logs_x = 90;
let offset_logs_y = 730;
let logs_lines = 6;
let logs = new Array(logs_lines).fill("");

// Animation dés
let rollDice = false;
let dice1_temp = 1;
let dice2_temp = 1;
let startAnimation;
let timeAnimation = 500;
let intervalChangement = 160;
let dernierChangement = 0;

// Puit
let puit_rempli = false;
let puit_player = 0;

// Prison
let prison_remplie = false;
let prison_player = 0;

// Vainqueur
let game_finished = false;
let player_win = -1;

let img_oie, img_hotel, img_laby, img_prison, img_puit, img_tdm;
let dice_img = [];
let background_img;
let pancarte, pancarte_left;
let confettis = [];

// === Chargement des images ===
function preload() {

  // Pions joueurs
  for (let i = 0; i < 6; i++) dice_img[i] = loadImage(`data/dice1_${i+1}.png`);
  for (let i = 0; i < 9; i++) player_img[i] = loadImage(`data/player-${i+1}.png`);

  // Image de fond
  background_img = loadImage("data/background_papet.png");

  // Autres images
  pancarte = loadImage("data/pancarte_small.png");
  pancarte_left = loadImage("data/pancarte_left.png");
  confettis.push(loadImage("data/confettis_1.png"));
  confettis.push(loadImage("data/confettis_2.png"));

  // Cases spéciales
  img_oie = loadImage("data/case_oie_txt.png");
  img_hotel = loadImage("data/case_hotel_txt2.png");
  img_laby = loadImage("data/case_laby_txt.png");
  img_prison = loadImage("data/case_prison_txt.png");
  img_puit = loadImage("data/case_puit_txt.png");
  img_tdm = loadImage("data/case_tdm.png");
}

// === Initialisation ===
function setup() {
  createCanvas(1535, 900);
  textSize(24);

  // Initialisation des couleurs pour les différents joueurs
  player_color[0] = "#ff0000"; // RED
  player_color[1] = "#0000ff"; // BLUE
  player_color[2] = "#00ff00"; // GREEN
  player_color[3] = "#ffffff"; // WHITE
  player_color[4] = "#ff00ff"; // FUCHSIA
  player_color[5] = "#00ffff"; // AQUA
  player_color[6] = "#ffff00"; // YELLOW
  player_color[7] = "#ff9933"; // ORANGE
  player_color[8] = "#9966ff"; // PURPLE
  player_color[9] = "#990033"; // BORDEAUX

  for (let i = 0; i < nb_joueurs; i++) {
    positions_current[i] = createVector(0, 0);
    positions_target[i] = createVector(0, 0);
  }

  calcPositions();

  for (let i = 0; i < nb_joueurs; i++) {
    positions_current[i] = positions[0].copy();
    positions_target[i] = positions[0].copy();
  }

  logs[0] = "DEBUT DE LA PARTIE";
}

// === Boucle de dessin ===
function draw() {

  background(background_img);
  image(pancarte, 550, 0);
  drawBoard();
  drawLeftPanel();
  drawDices();
  drawLogs();

  for (let i = 0; i < nb_joueurs; i++) {
    draw_positionPlayer(i);
    positions_current[i] = p5.Vector.lerp(positions_current[i], positions_target[i], 0.1);
    image(player_img[i], positions_current[i].x, positions_current[i].y);
  }

  if (game_finished && frameCount % 60 > 40) drawEndScreen(player_win);

}

// === Contrôle clavier ===
function keyPressed() {
  if (!game_finished && keyCode >= 97 && keyCode < 97 + nb_joueurs) {
    newRound(keyCode - 97);
  }
}

// === Fonctions ===

function addLogs(newlog) {
  for (let i = logs_lines - 1; i > 0; i--) {
    logs[i] = logs[i - 1];
  }
  logs[0] = newlog;
}

// Dessine le plateau de jeu (serpentin)
function drawBoard() {
  for (let i = 0; i < totalCases; i++) {
    let pos = positions[i];
    fill(255, 230, 200);
    stroke(0);
    rect(pos.x, pos.y, cellSize, cellSize);
    if (i % 9 === 0 && i < 63 && i > 0) image(img_oie, pos.x, pos.y, cellSize, cellSize);
    else if (i === 19) image(img_hotel, pos.x, pos.y, cellSize, cellSize);
    else if (i === 3) image(img_puit, pos.x, pos.y, cellSize, cellSize);
    else if (i === 42) image(img_laby, pos.x, pos.y, cellSize, cellSize);
    else if (i === 52) image(img_prison, pos.x, pos.y, cellSize, cellSize);
    else if (i === 58) image(img_tdm, pos.x, pos.y, cellSize, cellSize);
    else {
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(20);
      text(i, pos.x + cellSize / 2, pos.y + cellSize / 2);
    }
  }
}

// Dessine le panneau de gauche (pancarte)
function drawLeftPanel() {
  image(pancarte_left, offset_leftpanel_x, offset_leftpanel_y);
  fill(0);
  textSize(32);
  textAlign(LEFT);
  text(`Dés : ${dice1} + ${dice2} = ${dice1 + dice2}`, offset_leftpanel_x + 50, offset_leftpanel_y + 260);
}

// Dessine l'animation des dés animés
function drawDices() {
  let bounce1 = 0;
  let bounce2 = 0;
  if (rollDice && frameCount % 5 === 0) {
    let progress = (millis() - startAnimation) / timeAnimation;
    if (progress > 1) {
      rollDice = false;
      dice1_temp = dice1;
      dice2_temp = dice2;
    } else {
      if (millis() - dernierChangement > intervalChangement) {
        dice1_temp = int(random(1, 7));
        dice2_temp = int(random(1, 7));
        dernierChangement = millis();
      }
      bounce1 = sin(millis() * 0.02) * 15;
      bounce2 = sin(millis() * 0.02 + PI / 2) * 15;
    }
  }
  image(dice_img[dice1_temp - 1], 200, 460 + bounce1, 96, 96);
  image(dice_img[dice2_temp - 1], 300, 460 + bounce2, 96, 96);
}

// Dessine le panneau de logs
function drawLogs() {
  // Carré de fond noir
  fill(0);
  rect(offset_logs_x, offset_logs_y, 500, 150);

  // Texte
  fill(255);
  textSize(18);
  textAlign(LEFT);
  for (let i = 0; i < logs_lines; i++) {
    text(logs[i], offset_logs_x + 10, (offset_logs_y + 140) - (i * 23));
  }
}

function draw_positionPlayer(i) {
  textAlign(LEFT);
  textSize(32);
  fill(player_color[i]);
  text(`Joueur ${i + 1} : ${player_position[i]}`, 40 + offset_leftpanel_x, 50 + (30 * i) + offset_leftpanel_y);
  let change = player_lastroll[i];
  text((change >= 0 ? " + " : " - ") + abs(change), 250 + offset_leftpanel_x, 50 + (30 * i) + offset_leftpanel_y);
}

function drawEndScreen(p) {
  image(confettis[0], 390, 40, 350, 350);
  fill("#ffd7b3");
  rect(550, 300, 600, 100);
  fill(player_color[p]);
  textSize(64);
  textAlign(LEFT);
  text(`J${p + 1} : VICTOIRE !`, 580, 370);
}

function switchPos(p1, p2) {
  player_lastroll[p2] = player_position[p1] - player_position[p2];
  player_position[p2] = player_position[p1];
  positions_target[p2] = positions[player_position[p2]].copy();
}

//=== Initialisation du plateau ===
function calcPositions() {
  let caseCount = 0, line = 0, sens_gauche = false;
  while (caseCount < totalCases) {
    for (let i = 0; i < gridSize && caseCount < totalCases; i++) {
      let x = sens_gauche ? gridSize - 1 - i : i;
      positions[caseCount++] = createVector((x * cellSize) + x_offset, (10 + line * cellSize) + y_offset);
    }
    if (caseCount < totalCases) {
      let x = sens_gauche ? 0 : gridSize - 1;
      positions[caseCount++] = createVector((x * cellSize) + x_offset, (10 + (line + 1) * cellSize) + y_offset);
    }
    line += 2;
    sens_gauche = !sens_gauche;
  }
}

//=== BOUCLE PRINCIPALE ===
function newRound(p) {
  dice1 = int(random(1, 7));
  dice2 = int(random(1, 7));
  let total = dice1 + dice2;
  let pos = player_position[p];
  let log = `[J${p + 1}] Dés : ${dice1} + ${dice2} = ${total}`;

  if (pos === 0) {
    if (total === 9 && (dice1 === 6 || dice2 === 6)) pos = 26;
    else if (total === 9 && (dice1 === 4 || dice2 === 4)) pos = 53;
    else if (total === 6) pos = 12;
    else pos += total;
  } else {
    pos += total;
    if (pos % 9 === 0 && pos < 63) {
      pos += total;
      addLogs(`OIE x2 ! Avance de nouveau`);
    }
    if (pos === 3) {
      if (puit_rempli) {
        addLogs(`J${p + 1} libère J${puit_player + 1} du PUITS`);
        player_state[puit_player] = 0;
        puit_rempli = false;
      } else {
        addLogs(`J${p + 1} tombe dans le PUITS`);
        player_state[p] = 2;
        puit_rempli = true;
        puit_player = p;
      }
    } else if (pos === 19) {
      player_state[p] = 1;
      player_turns[p] = 2;
      addLogs(`J${p + 1} prend des vacances à l'HOTEL`);
    } else if (pos === 42) {
      pos = 30;
      addLogs(`J${p + 1} se perd dans le LABY`);
    } else if (pos === 52) {
      if (prison_remplie) {
        addLogs(`J${p + 1} libère J${prison_player + 1}`);
        player_state[prison_player] = 0;
        prison_remplie = false;
      } else {
        player_state[p] = 3;
        prison_remplie = true;
        prison_player = p;
        addLogs(`J${p + 1} en PRISON`);
      }
    } else if (pos === 58) {
      pos = 0;
      addLogs(`J${p + 1} rencontre la MORT 💀`);
    }
  }

  if (pos > 63) pos = 63 - (pos - 63);
  for (let i = 0; i < nb_joueurs; i++) {
    if (i !== p && player_position[i] === pos) {
      addLogs(`Switch J${p + 1} <-> J${i + 1}`);
      switchPos(p, i);
    }
  }

  player_lastroll[p] = pos - player_position[p];
  player_position[p] = pos;
  positions_target[p] = positions[pos].copy();
  addLogs(log);

  if (pos === 63) {
    addLogs(`🎉 J${p + 1} a gagné !`);
    game_finished = true;
    player_win = p;
  }

  startAnimation = millis();
  rollDice = true;
}