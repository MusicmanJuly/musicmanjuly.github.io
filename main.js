
var saved;

function initSave()
{
  /*
  saved = {
    hp: CO.usermove.initHP,
    maxhp: CO.usermove.maxHP,
    spawnX: MAPS.world1.spawnX,
    spawnY: MAPS.world1.spawnY,
    weapon: new W_Dagger(),
    worldId: 1,
    completed: false,
  };
  */

  // 第二关的存档
  saved = {
    hp: CO.usermove.maxHP,
    maxhp: CO.usermove.maxHP,
    spawnX: MAPS.world2.spawnX,
    spawnY: MAPS.world2.spawnY,
    weapon: new W_Knife(),
    worldId: 2,
    completed: false,
  };
  

  /* 通关场景的存档
  saved = {
    hp: CO.usermove.maxHP,
    maxhp: CO.usermove.maxHP,
    spawnX: MAPS.congrat.spawnX,
    spawnY: MAPS.congrat.spawnY,
    weapon: new W_Clap(),
    worldId: -1,
    completed: true,
  };
  */
}

var world;
var dmgs = [];

function startWorld()
{
  if (saved.worldId == 1)
    world = new World1(saved.spawnX, saved.spawnY, saved.weapon, saved.hp);
  else if (saved.worldId == 2)
    world = new World2(saved.spawnX, saved.spawnY, saved.weapon, saved.hp);
  else if (saved.worldId == -1)
    world = new WorldC();
}

function run()
{
  cheatcode();  
  let res = world.isCompletedAndCatchEvent();
  if (res >= 0)
  {
    startWorld();
  }
  world.action();
  world.render();
}

var p192 = false;

function cheatcode()
{
  if (keyIsDown(192) && !p192)
    CO.debug = !CO.debug;

  p192 = keyIsDown(192);
}
