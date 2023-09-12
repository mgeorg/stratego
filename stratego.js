
let canvas;
let ctx;
let gameRecord;
let gridWidth;
let gridHeight;
  
const _MARGIN = 5;
const _PIECE_X_MARGIN = 5;
const _PIECE_Y_MARGIN = 5;
const _STATUS_WIDTH = 10

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gridWidth = window.innerWidth - 2*_MARGIN;
  gridHeight = window.innerHeight - 2*_MARGIN;
  // canvas.width = document.documentElement.clientWidth;
  // canvas.height = document.documentElement.clientHeight;
  drawOnCanvas();
}

function load() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext("2d");

  canvas.addEventListener("click", click);
  window.addEventListener("keydown", keydown);
  window.addEventListener("resize", resize);

  if (!loadState('default')) {
    setupBoard();
  }
  resize();
}

function click(e) {
  grid_x = Math.floor((e.clientX - _MARGIN) / (gridWidth/10));
  grid_y = Math.floor((e.clientY - _MARGIN) / (gridHeight/10));
  if (grid_x < 0 || grid_x >= 10 ||
      grid_y < 0 || grid_y >= 10) {
    // console.log(`${grid_x} ${grid_y}`);
    return;
  }
  gameRecord.click(grid_x, grid_y);
}

function keydown(e) {
  gameRecord.keydown(e);
}

function drawOnCanvas() {
  ctx.resetTransform();
  ctx.fillStyle = "black";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 1;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  DrawGrid();
  gameRecord.cur().draw();
}

function setupBoard() {
  gameRecord = new Record();
  for (let x = 0; x < 10; ++x) {
    for (let y = 0; y < 4; ++y) {
      gameRecord.cur().pieces[x][y] = new Piece(x, y, '', false);
    }
  }
  for (let x = 0; x < 10; ++x) {
    for (let y = 6; y < 10; ++y) {
      gameRecord.cur().pieces[x][y] = new Piece(x, y, '', true);
    }
  }
}

function DrawGrid() {
  ctx.beginPath();
  for (let x = 0; x < 11; ++x) {
    ctx.moveTo(_MARGIN + gridWidth / 10 * x, _MARGIN);
    ctx.lineTo(_MARGIN + gridWidth / 10 * x, _MARGIN + gridHeight);
  }
  for (let y = 0; y < 11; ++y) {
    ctx.moveTo(_MARGIN, _MARGIN + gridHeight / 10 * y);
    ctx.lineTo(_MARGIN + gridWidth, _MARGIN + gridHeight / 10 * y);
  }
  ctx.stroke();
  ctx.fillRect(_MARGIN + gridWidth / 10 * 2,
               _MARGIN + gridHeight / 10 * 4,
               gridWidth / 10 * 2,
               gridHeight / 10 * 2);
  ctx.fillRect(_MARGIN + gridWidth / 10 * 6,
               _MARGIN + gridHeight / 10 * 4,
               gridWidth / 10 * 2,
               gridHeight / 10 * 2);
}

class Location {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static revive(saveObject) {
    if (!saveObject) {
      return null;
    }
    return new Location(saveObject.x, saveObject.y);
  }
}

class Piece {
  constructor(x, y, text, mine) {
    this.cur = new Location(x, y);
    this.path = [this.cur];
    this.text = text;
    this.mine = mine;
    this.moved = false;
    this.discovered = false;
  }

  draw(highlighted) {
    let saveStyle = ctx.fillStyle;

    let piece_start_x = 
        _MARGIN + _PIECE_X_MARGIN + gridWidth / 10 * this.cur.x;
    let piece_width = gridWidth / 10 - 2 * _PIECE_X_MARGIN - _STATUS_WIDTH;
    let piece_start_y = 
        _MARGIN + _PIECE_Y_MARGIN + gridHeight / 10 * this.cur.y;
    let piece_height = gridHeight / 10 - 2 * _PIECE_Y_MARGIN;

    if (highlighted) {
      ctx.fillStyle = "#FFFF00";
      ctx.fillRect(_MARGIN + gridWidth / 10 * this.cur.x,
                   _MARGIN + gridHeight / 10 * this.cur.y,
                   gridWidth / 10,
                   gridHeight / 10);
    }
    if (this.mine) {
      ctx.fillStyle = "#DD8888";
    } else {
      ctx.fillStyle = "#88DDDD";
    }
    ctx.fillRect(piece_start_x, piece_start_y, piece_width, piece_height);

    if (this.text) {
      ctx.font = "25px Arial";
      let measure = ctx.measureText(this.text);
      let text_height =
          measure.fontBoundingBoxAscent + measure.fontBoundingBoxDescent;
      ctx.fillStyle = "black";
      ctx.fillText(
          this.text,
          piece_start_x + piece_width / 2 - measure.width/2,
          piece_start_y + piece_height / 2 + text_height/2);
    }

    if (this.moved) {
      ctx.fillStyle = "green";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillRect(piece_start_x + piece_width,
                 piece_start_y,
                 _STATUS_WIDTH, Math.floor(piece_height/2));

    if (this.discovered) {
      ctx.fillStyle = "green";
    } else {
      ctx.fillStyle = "red";
    }
    ctx.fillRect(piece_start_x + piece_width,
                 piece_start_y + Math.floor(piece_height/2),
                 _STATUS_WIDTH, piece_height - Math.floor(piece_height/2));

    if (highlighted) {
      if (this.moved) {
        ctx.beginPath();
        ctx.ellipse(
            _MARGIN + gridWidth / 10 * this.path[0].x + gridWidth / 20,
            _MARGIN + gridHeight / 10 * this.path[0].y + gridHeight / 20,
            gridWidth / 20,
            gridHeight / 20,
            0,
            0,
            2 * Math.PI)
        // ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(_MARGIN + gridWidth / 10 * this.path[0].x + gridWidth / 20,
                 _MARGIN + gridHeight / 10 * this.path[0].y + gridHeight / 20);
      for (let i = 1; i < this.path.length; ++i) {
        ctx.lineTo(
            _MARGIN + gridWidth / 10 * this.path[i].x + gridWidth / 20,
            _MARGIN + gridHeight / 10 * this.path[i].y + gridHeight / 20);
      }
      ctx.stroke();
    }

    ctx.fillStyle = saveStyle;
  }

  hasRank() {
    return this.rank() !== null;
  }

  rank() {
    if (!this.text) {
      return null;
    } else if (this.text == '1') {
      return 1;
    } else if (this.text == '2') {
      return 2;
    } else if (this.text == '3') {
      return 3;
    } else if (this.text == '4') {
      return 4;
    } else if (this.text == '5') {
      return 5;
    } else if (this.text == '6') {
      return 6;
    } else if (this.text == '7') {
      return 7;
    } else if (this.text == '8') {
      return 8;
    } else if (this.text == '9') {
      return 9;
    } else if (this.text == '10') {
      return 10;
    } else if (['f', 'flag'].indexOf(this.text.toLowerCase()) >= 0) {
      return 'f';
    } else if (['b', 'bomb'].indexOf(this.text.toLowerCase()) >= 0) {
      return 'b';
    }
    return null;
  }

  move(x, y) {
    this.cur = new Location(x, y);
    this.path.push(this.cur);
    this.moved = true;
  }

  static revive(saveObject) {
    if (!saveObject) {
      return null;
    }
    let p = new Piece(
        saveObject.cur.x, saveObject.cur.y, saveObject.text, saveObject.mine);
    p.moved = saveObject.moved;
    p.discovered = saveObject.discovered;
    p.path = [];
    for (let i = 0; i < saveObject.path.length; ++i) {
      p.path.push(Location.revive(saveObject.path[i]));
    }
    return p;
  }
}

function inLake(x, y) {
  return (x == 2 || x == 3 || x == 6 || x == 7) && (y == 4 || y == 5);
}

function canMove(curX, curY, newX, newY, is_scout) {
  if (newX < 0 || newX >= 10) {
    return false;
  }
  if (newY < 0 || newY >= 10) {
    return false;
  }
  if (inLake(newX, newY)) {
    return false;
  }

  if (curX == newX && (newY == curY + 1 || newY == curY - 1)) {
    return true;
  }
  if (curY == newY && (newX == curX + 1 || newX == curX - 1)) {
    return true;
  }
  if (is_scout) {
    if (curX == newX) {
      if (curY < newY) {
        for (let i = 1; i < newY - curY; ++i) {
          if (gameRecord.cur().pieces[curX][curY + i]) {
            return false;
          }
          if (inLake(curX, curY + i)) {
            return false;
          }
        }
        return true;
      } else {
        for (let i = -1; i > newY - curY; --i) {
          if (gameRecord.cur().pieces[curX][curY + i]) {
            return false;
          }
          if (inLake(curX, curY + i)) {
            return false;
          }
        }
        return true;
      }
    }
    
    if (curY == newY) {
      if (curX < newX) {
        for (let i = 1; i < newX - curX; ++i) {
          if (gameRecord.cur().pieces[curX + i][curY]) {
            return false;
          }
          if (inLake(curX + i, curY)) {
            return false;
          }
        }
        return true;
      } else {
        for (let i = -1; i > newX - curX; --i) {
          if (gameRecord.cur().pieces[curX + i][curY]) {
            return false;
          }
          if (inLake(curX + i, curY)) {
            return false;
          }
        }
        return true;
      }
    }
    
  }
  return false;
}

function canCapture(from, to) {
  let to_rank = to.rank();
  let from_rank = from.rank();
  if (to_rank == 'f') {
    return 1;
  }
  if (to_rank == 'b') {
    if (from_rank == 3) {
      // Defuse bomb.
      return 1;
    }
  }
  if (from_rank == 1 && to_rank == 10) {
    return 1;
  }
  if (from_rank ==  to_rank) {
    return 0;
  }
  if (from_rank > to_rank) {
    return 1;
  }
  return -1;
}

class Board {
  constructor() {
    this.pieces = [
         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],

         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],

         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null],
         [null, null, null, null, null, null, null, null, null, null]];
    this.highlight = null;
    this.pendingAttack = null;
    this.typing = null;
  }

  draw() {
    for (let x = 0; x < 10; ++x) {
      for (let y = 0; y < 10; ++y) {
        let p = this.pieces[x][y];
        if (p) {
          p.draw((this.highlight &&
                  this.highlight.x == x &&
                  this.highlight.y == y) ||
                 (this.pendingAttack &&
                  this.pendingAttack.x == x &&
                  this.pendingAttack.y == y));
        }
      }
    }
  }

  canMakePendingAttack() {
    let from = this.pieces[this.highlight.x][this.highlight.y];
    let to = this.pieces[this.pendingAttack.x][this.pendingAttack.y];
    if (!from.hasRank() || !to.hasRank()) {
      return false;
    }
    return true;
  }

  makePendingAttack() {
    let from = this.pieces[this.highlight.x][this.highlight.y];
    let to = this.pieces[this.pendingAttack.x][this.pendingAttack.y];
    if (!from.hasRank() || !to.hasRank()) {
      this.highlight = null;
      this.pendingAttack = null;
      this.typing = null;
      drawOnCanvas();
      return;
    }
    let win = canCapture(from, to);
    if (win > 0) {
      this.pieces[this.pendingAttack.x][this.pendingAttack.y] = from;
      this.pieces[this.highlight.x][this.highlight.y] = null;
      from.move(this.pendingAttack.x, this.pendingAttack.y);
      this.highlight = null;
      this.pendingAttack = null;
      from.discovered = true;
    } else if(win == 0) {
      this.pieces[this.highlight.x][this.highlight.y] = null;
      this.pieces[this.pendingAttack.x][this.pendingAttack.y] = null;
      this.highlight = null;
      this.pendingAttack = null;
      this.typing = null;
    } else {
      this.pieces[this.highlight.x][this.highlight.y] = null;
      this.highlight = null;
      this.pendingAttack = null;
      this.typing = null;
      to.discovered = true;
    }
    drawOnCanvas();
  }

  freeze() {
    this.frozen = true;
    this.highlight = null;
    this.pendingAttack = null;
    this.typing = null;
  }

  static revive(saveObject) {
    let b = new Board();
    for (let x = 0; x < 10; ++x) {
      for (let y = 0; y < 10; ++y) {
        b.pieces[x][y] = Piece.revive(saveObject.pieces[x][y]);
      }
    }
    b.frozen = saveObject.frozen;
    b.highlight = Location.revive(saveObject.highlight);
    b.pendingAttack = Location.revive(saveObject.pendingAttack);
    b.typing = saveObject.typing;
    return b;
  }
}

class Record {
  constructor() {
    this.history = [new Board()];
    this.viewing = 0;
  }

  cur() {
    return this.history[this.viewing];
  }

  advanceHistory() {
    console.log('advanceHistory()');
    let cur = this.history.pop();
    let copy = Board.revive(cur);
    copy.freeze();
    this.history.push(copy);
    this.history.push(cur);
    this.viewing = this.history.length-1;
  }

  click(x, y) {
    let board = this.cur();
    if (board.frozen) {
      board.highlight = new Location(x, y);
      drawOnCanvas();
      return;
    }
    if (board.typing && (x != board.typing.x || y != board.typing.y)) {
      board.typing = null;
    }
    let p = board.pieces[x][y];
    if (board.highlight) {
      // We have a highlight already.
      if (board.highlight.x == x && board.highlight.y == y) {
        // Clicking on the highlighted piece.
        board.highlight = null;
        board.pendingAttack = null;
        board.typing = null;
        drawOnCanvas();
        return;
      }
      if (board.pendingAttack && board.pendingAttack.x == x &&
          board.pendingAttack.y == y) {
        // Clicking on the pending attack piece.
        if(board.canMakePendingAttack()) {
          this.advanceHistory();
        }
        board.makePendingAttack();
        return;
      }
      let from = board.pieces[board.highlight.x][board.highlight.y];
      if (p) {
        if (from.mine == p.mine) {
          // New piece is on the same team, change highlight.
          board.highlight = new Location(x, y);
          board.typing = null;
          drawOnCanvas();
          return;
        }
        if (!canMove(from.cur.x, from.cur.y, x, y, from.rank() == 2)) {
          board.highlight = new Location(x, y);
          board.typing = null;
          drawOnCanvas();
          return
        }
        if (!from.hasRank() || !p.hasRank()) {
          board.pendingAttack = new Location(x, y);
          return;
        }
        // Capture.
        this.advanceHistory();
        let win = canCapture(from, p);
        if (win > 0) {
          board.pieces[x][y] = from;
          board.pieces[board.highlight.x][board.highlight.y] = null;
          board.highlight = null;
          board.pendingAttack = null;
          from.move(x, y);
          from.discovered = true;
        } else if(win == 0) {
          board.pieces[board.highlight.x][board.highlight.y] = null;
          board.pieces[x][y] = null;
          board.highlight = null;
          board.pendingAttack = null;
          board.typing = null;
        } else {
          board.pieces[board.highlight.x][board.highlight.y] = null;
          board.highlight = null;
          board.pendingAttack = null;
          board.typing = null;
          p.discovered = true;
        }
      } else {
        // Move.
        if (canMove(from.cur.x, from.cur.y, x, y, from.rank() == 2)) {
          this.advanceHistory();
          if (from.rank() == 2 &&
              !canMove(from.cur.x, from.cur.y, x, y, false)) {
            from.discovered = true;
          }
          board = this.cur();
          board.pieces[x][y] = from;
          board.pieces[board.highlight.x][board.highlight.y] = null;
          from.move(x, y);
        }
        board.highlight = null;  // Clear the highlight.
        board.pendingAttack = null;
        board.typing = null;
      }
    } else {
      // No piece currently highlighted.
      if (p) {
        // Highlight a new piece.
        board.highlight = new Location(x, y);
        board.typing = null;
      } else {
        board.highlight = null;
        board.pendingAttack = null;
        board.typing = null;
      }
    }
    drawOnCanvas();
  }

  keydown(e) {
    // console.log(e);
    if (e.keyCode == 37) {  // LeftArrow
      this.viewing -= 1;
      if (this.viewing < 0) {
        this.viewing = 0;
      }
      drawOnCanvas();
      return;
    }
    if (e.keyCode == 39) {  // RightArrow
      this.viewing += 1;
      if (this.viewing >= this.history.length) {
        this.viewing = this.history.length - 1;
      }
      drawOnCanvas();
      return;
    }
    let board = this.cur();
    if (board.frozen) {
      return;
    }
    if (!board.highlight) {
      return;
    }
    let p;
    if (board.typing) {
      p = board.pieces[board.typing.x][board.typing.y];
    } else {
      p = board.pieces[board.highlight.x][board.highlight.y];
      if (p.hasRank() && board.pendingAttack) {
        p = board.pieces[board.pendingAttack.x][board.pendingAttack.y];
      }
    }
    if (e.keyCode == 8) {  // Backspace
      p.text = p.text.slice(0, -1);
      drawOnCanvas();
      return;
    }
    if (e.keyCode == 13) {  // Enter
      if (board.pendingAttack) {
        let rank = p.rank();
        if (rank !== null && rank != 1) {
          this.advanceHistory();
          board.makePendingAttack();
          return;
        }
      } else {
        board.highlight = null;
        board.typing = null;
        drawOnCanvas();
      }
      return;
    }
    if (e.key.length > 1) {
      return;
    }

    if (board.typing) {
      p.text += e.key;
    } else {
      p.text = e.key;
    }
    if (board.pendingAttack) {
      let rank = p.rank();
      if (rank !== null && rank != 1) {
        // We have a complete rank, 
        this.advanceHistory();
        board.makePendingAttack();
        return;
      }
    }
    if (!board.typing) {
      board.typing = Location.revive(p.cur);
      console.log(board.typing);
    }
    drawOnCanvas();
  }

  static revive(saveObject) {
    let r = new Record();
    r.history = [];
    for (let i = 0; i < saveObject.history.length; ++i) {
      r.history.push(Board.revive(saveObject.history[i]));
    }
    r.viewing = r.history.length-1;
    return r;
  }
}

function saveState(name) {
  localStorage.setItem(name, JSON.stringify(gameRecord));
}

function loadState(name) {
  let data = localStorage.getItem(name);
  if (!data) {
    return false;
  }
  let saveObject = JSON.parse(data);
  gameRecord = Record.revive(saveObject);
  drawOnCanvas();
  return true;
}

window.addEventListener('load', load);

