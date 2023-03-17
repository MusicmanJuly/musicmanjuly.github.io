
// Global Properties
var pmouseIsPressed = false;
var curEntitiyID = 0;

// Scene Setting
var gameOnGoing = true;

function preload()
{
  initCO();
  console.log('completed: initCO');
  initENTITIES();
  console.log('completed: initENTITIES');
  initDISPLAYS();
  console.log('completed: initDISPLAYS');
  initMAPS();
  console.log('completed: initMAPS');
  initMusicSound();
  console.log('completed: initMusicSound');
}

function setup()
{
  createCanvas(CO.display.x, CO.display.y);
  frameRate(CO.display.framerate);
  imageMode(CORNER);

  analyzeMAPS();
  console.log('completed: analyzeMAPS');
  analyzeENTITIES();
  console.log('completed: analyzeENTITIES');

  initSave();
  console.log('completed: initSave');
  startWorld();
  console.log('completed: initGame');

}

function draw()
{
  background(220);

  run();
  pmouseIsPressed = mouseIsPressed;
}