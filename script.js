const pieceLayer = document.getElementById("pieceLayer");
const boardWrap = document.getElementById("boardWrap");
const turnText = document.getElementById("turnText");

let currentPlayer = "red";
let selected = null;

let board = [];

const initialBoard = [
  ["b車","b馬","b象","b士","b將","b士","b象","b馬","b車"],
  [null,null,null,null,null,null,null,null,null],
  [null,"b炮",null,null,null,null,null,"b炮",null],
  ["b卒",null,"b卒",null,"b卒",null,"b卒",null,"b卒"],
  [null,null,null,null,null,null,null,null,null],
  [null,null,null,null,null,null,null,null,null],
  ["r兵",null,"r兵",null,"r兵",null,"r兵",null,"r兵"],
  [null,"r炮",null,null,null,null,null,"r炮",null],
  [null,null,null,null,null,null,null,null,null],
  ["r車","r馬","r相","r仕","r帥","r仕","r相","r馬","r車"]
];

function restartGame(){
  board = JSON.parse(JSON.stringify(initialBoard));
  currentPlayer = "red";
  selected = null;
  render();
}

function getBoardParams(){

  const w = boardWrap.clientWidth;

  const scale = w / 900;

  return {
    left: 50 * scale,
    top: 50 * scale,
    step: 100 * scale,
    piece: 70 * scale
  };
}

function render(){
  pieceLayer.innerHTML = "";
  const p = getBoardParams();

  // 先生成 10×9 个透明点击点
  for(let r=0;r<10;r++){
    for(let c=0;c<9;c++){
      const cell = document.createElement("div");
      cell.style.position = "absolute";
      cell.style.left = (p.left + c * p.step - p.piece / 2) + "px";
      cell.style.top = (p.top + r * p.step - p.piece / 2) + "px";
      cell.style.width = p.piece + "px";
      cell.style.height = p.piece + "px";
      cell.style.cursor = "pointer";
      cell.onclick = () => clickCell(r,c);
      pieceLayer.appendChild(cell);
    }
  }

  // 再生成棋子，盖在透明点击点上
  for(let r=0;r<10;r++){
    for(let c=0;c<9;c++){
      const code = board[r][c];
      if(!code) continue;

      const div = document.createElement("div");
      div.className = "piece " + (code[0]==="r" ? "red" : "black");

      if(selected && selected.r===r && selected.c===c){
        div.classList.add("selected");
      }

      div.innerText = code.substring(1);
      div.style.width = p.piece + "px";
      div.style.height = p.piece + "px";
      div.style.fontSize = p.piece * 0.55 + "px";
      div.style.left = (p.left + c * p.step) + "px";
      div.style.top  = (p.top  + r * p.step) + "px";

      div.onclick = () => clickCell(r,c);
      pieceLayer.appendChild(div);
    }
  }

  turnText.innerText = currentPlayer === "red" ? "红方走棋" : "黑方走棋";
}

function clickCell(r,c){
  const p = board[r][c];

  if(selected === null){
    if(!p) return;
    if(p[0] !== (currentPlayer === "red" ? "r" : "b")){
      alert("现在轮到" + (currentPlayer==="red" ? "红方" : "黑方") + "走棋");
      return;
    }
    selected = {r,c};
    render();
    return;
  }

  const from = selected;
  const moving = board[from.r][from.c];

  if(p && p[0] === moving[0]){
    selected = {r,c};
    render();
    return;
  }

  if(!isLegalMove(from.r, from.c, r, c)){
    alert("此走法不符合规则");
    selected = null;
    render();
    return;
  }

  board[r][c] = moving;
  board[from.r][from.c] = null;
  selected = null;
  currentPlayer = currentPlayer === "red" ? "black" : "red";
  render();
}

function isLegalMove(fr,fc,tr,tc){
  const piece = board[fr][fc];
  if(!piece) return false;

  const name = piece.substring(1);
  const color = piece[0];

  const dr = tr - fr;
  const dc = tc - fc;
  const adr = Math.abs(dr);
  const adc = Math.abs(dc);

  if(name==="車"){
    return (fr===tr || fc===tc) && clearPath(fr,fc,tr,tc);
  }

  if(name==="炮"){
    const count = countBetween(fr,fc,tr,tc);
    if(board[tr][tc]) return count === 1;
    return count === 0;
  }

  if(name==="馬"){
    if(!((adr===2 && adc===1) || (adr===1 && adc===2))) return false;
    if(adr===2 && board[fr + dr/2][fc]) return false;
    if(adc===2 && board[fr][fc + dc/2]) return false;
    return true;
  }

  if(name==="相" || name==="象"){
    if(!(adr===2 && adc===2)) return false;
    if(board[fr + dr/2][fc + dc/2]) return false;
    if(color==="r" && tr < 5) return false;
    if(color==="b" && tr > 4) return false;
    return true;
  }

  if(name==="仕" || name==="士"){
    if(!(adr===1 && adc===1)) return false;
    return inPalace(color,tr,tc);
  }

  if(name==="帥" || name==="將"){
    if(adr + adc !== 1) return false;
    return inPalace(color,tr,tc);
  }

  if(name==="兵" || name==="卒"){
    if(color==="r"){
      if(fr >= 5) return dr === -1 && dc === 0;
      return (dr === -1 && dc === 0) || (dr === 0 && adc === 1);
    }else{
      if(fr <= 4) return dr === 1 && dc === 0;
      return (dr === 1 && dc === 0) || (dr === 0 && adc === 1);
    }
  }

  return false;
}

function inPalace(color,r,c){
  if(c < 3 || c > 5) return false;
  if(color==="r") return r >= 7 && r <= 9;
  return r >= 0 && r <= 2;
}

function clearPath(fr,fc,tr,tc){
  return countBetween(fr,fc,tr,tc) === 0;
}

function countBetween(fr,fc,tr,tc){
  let count = 0;

  if(fr === tr){
    const min = Math.min(fc,tc);
    const max = Math.max(fc,tc);
    for(let c=min+1;c<max;c++){
      if(board[fr][c]) count++;
    }
    return count;
  }

  if(fc === tc){
    const min = Math.min(fr,tr);
    const max = Math.max(fr,tr);
    for(let r=min+1;r<max;r++){
      if(board[r][fc]) count++;
    }
    return count;
  }

  return 99;
}

window.addEventListener("resize", render);
restartGame();
