function make2DArray(cols, rows){
  let arr = new Array(cols);
  for(let i = 0 ; i < arr.length ; i++){
    arr[i] = new Array(rows);
  }
  return arr;
}

function makeCellGrid(cols, rows){
  let grid = make2DArray(cols, rows);
  for(let i = 0 ; i < cols ; i++){
    for(let j = 0 ; j < rows ; j++){
      grid[i][j] = new Cell(STATES.EMPTY);
    }
  }
  return grid;
}

class Cell {

  constructor(state, has_updated=false){
    this.state = state;
    this.has_updated = has_updated;
  }

  is(state){
    return this.state === state && !this.has_updated;
  }

}

class Generator {
  constructor(i, j, delay){
    this.delay = delay;
    this.delayCounter = 0;
    this.i = i;
    this.j = j;
  }

  isReady(){
    return this.delayCounter >= this.delay;
  }

  getCell(){
    let p = random();
    if(p < .2)
      return new Cell(STATES.SAND);
    else
      return new Cell(STATES.WATER);
  }
}

let grid;
let cols;
let rows;
let fps = 24;
let resolution = 10;
var isPlaying = false;
let brush_on = false;

let states_data = [
  'black',
  'brown',
  '#c2b280',
  'blue',
]

let generators = [];
var cellRenderSize = resolution;
var cellRenderSizeMax = resolution;
var brush_types = ['Empty', 'Brick', 'Sand', 'Water'];
var brush = ['Empty', 'Brick', 'Sand', 'Water'];

const STATES = {
  EMPTY: 0,
  BRICK: 1,
  SAND: 2,
  WATER: 3,
}

let brush_type = 0;

var gui;
function setup() {
  createCanvas(floor(displayWidth/1.5), floor(displayHeight/1.5));
  cols = floor(width / resolution);
  rows = floor(height / resolution);
  grid = make2DArray(cols, rows);

  for(let i = 0 ; i < cols ; i++){
    generators.push(new Generator(i, 0, floor(random(6, 10))));
  }
  
  for(let i = 0 ; i < cols ; i++){
    for(let j = 0 ; j < rows ; j++){
      let p = random()
      if(j >= floor(rows/4) && p > .8) 
        grid[i][j] = new Cell(STATES.BRICK)
      else
        grid[i][j] = new Cell(STATES.EMPTY);
    }
  }
  gui = createGui('Settings');
  gui.addGlobals('brush', 'cellRenderSize');
  frameRate(fps);
  // Wait for input start simulation
  noLoop();

}

function renderGrid(){
  background(0);
  noStroke();

  for(let i = 0 ; i < cols ; i++){
    for(let j = 0 ; j < rows ; j++){
      let x = i * resolution
      let y = j * resolution
      if(grid[i][j].state != 0){
        fill(states_data[grid[i][j].state]);
        rect(x, y, cellRenderSize, cellRenderSize);
      }
    }
  }
}

function draw() {
  brush_type = brush_types.indexOf(brush);
  
  renderGrid();
  if(!isPlaying) return;
  
  generators.forEach(gen => {
    if(gen.isReady()){
      grid[gen.i][gen.j] = gen.getCell();
      gen.delayCounter = 0;
      gen.delay = floor(random(5, 10));
    } else {
      gen.delayCounter += 1;
    }
  })
  
  for(let j = 0 ; j < rows ; j++){
    for(let i = 0 ; i < cols ; i++){
      let cell = grid[i][j];

      if(cell.has_updated) continue;

      switch (cell.state) {
        case STATES.SAND:
          updateSand(grid, i, j);
          break;
        case STATES.WATER:
          updateWater(grid, i, j);
          break;
      }
    }
  }
  
  for(let i = 0 ; i < cols ; i++){
    for(let j = 0 ; j < rows ; j++){
      grid[i][j].has_updated = false;
    }
  }
}

function play(){
  isPlaying = true;
  if(!isLooping())
    loop();
}

function pause(){
  isPlaying = false;
  if(isLooping())
    noLoop();
}

function keyPressed(){
  if(keyCode === DOWN_ARROW){
    brush_type =  (brush_type + 1) % states_data.length;
  }

  else if(keyCode === RIGHT_ARROW && !isPlaying){
    isPlaying = true;
    draw();
    isPlaying = false;
  }
}

function clearGrid(){
  for(let i = 0 ; i < cols ; i++){
    for(let j = 0 ; j < rows ; j++){
      grid[i][j] = new Cell(STATES.EMPTY);
    }
  }
  isPlaying = false;
  draw();
  noLoop();
}

function mousePressed(event){
  if(event.target.className === 'p5Canvas'){
    brush_on = true;
    let col = floor(mouseX / resolution);
    let row = floor(mouseY / resolution);
    grid[col][row] = new Cell(brush_type);

    renderGrid();
  }
}

function mouseDragged(event){
  if(brush_on && event.target.className === 'p5Canvas'){
    let col = floor(mouseX / resolution);
    let row = floor(mouseY / resolution);
    grid[col][row] = new Cell(brush_type);

    renderGrid();
  }
}

function getNeighbors(grid, x, y){
  let neighbors = make2DArray(3, 3);
  for(let i = -1 ; i < 2 ; i++){
    for(let j = -1 ; j < 2 ; j++){
      let col = x + i;
      let row = y + j;
      if(col < 0 || col >= cols || row < 0 || row >= rows)
        neighbors[j+1][i+1] = new Cell(-1);
      else{
        neighbors[j+1][i+1] = grid[col][row];
      }
    }
  }
  return neighbors;
}

function updateSand(grid, i, j){
  let cell = grid[i][j];
  let neighbors = getNeighbors(grid,i,j);
  
  grid[i][j] = new Cell(STATES.EMPTY, true);
  if(neighbors[2][1].is(STATES.EMPTY) || neighbors[2][1].is(STATES.WATER)){
    grid[i][j] = new Cell(neighbors[2][1].state, true);
    grid[i][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[2][0].is(STATES.EMPTY) || neighbors[2][0].is(STATES.WATER)){
    grid[i][j] = new Cell(neighbors[2][0].state, true);
    grid[i-1][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[2][2].is(STATES.EMPTY) || neighbors[2][2].is(STATES.WATER)){
    grid[i][j] = new Cell(neighbors[2][2].state, true);
    grid[i+1][j+1] = new Cell(cell.state, true);
  }
  else {
    grid[i][j] = new Cell(cell.state, true);
  }
}

function updateWater(grid, i, j){
  let cell = grid[i][j];
  let neighbors = getNeighbors(grid,i,j);
  
  grid[i][j] = new Cell(STATES.EMPTY, true);
  if(neighbors[2][1].is(STATES.EMPTY)){
    grid[i][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[2][1].is(STATES.EMPTY)){
    grid[i][j] = new Cell(neighbors[2][1].state, true);
    grid[i][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[2][0].is(STATES.EMPTY)){
    grid[i-1][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[2][2].is(STATES.EMPTY)){
    grid[i+1][j+1] = new Cell(cell.state, true);
  }
  else if(neighbors[1][0].is(STATES.EMPTY)){
    grid[i-1][j] = new Cell(cell.state, true);
  }
  else if(neighbors[1][2].is(STATES.EMPTY)){
    grid[i+1][j] = new Cell(cell.state, true);
  }
  else {
    grid[i][j] = new Cell(cell.state, true);
  }
}