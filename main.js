
var saved;

function initSave()
{
  saved = {
    hp: CO.usermove.initHP,
    maxhp: CO.usermove.maxHP,
    spawnX: MAPS.world1.spawnX,
    spawnY: MAPS.world1.spawnY,
    weapon: new W_Dagger(),
    worldId: 1,
    completed: false,
  };
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
var p49 = false;
var p50 = false;
var p51 = false;

function cheatcode()
{
  if (keyIsDown(192) && !p192)
    CO.debug = !CO.debug;

  if (keyIsDown(16) && keyIsDown(49) && !p49)
  {
    saved = {
      hp: CO.usermove.initHP,
      maxhp: CO.usermove.maxHP,
      spawnX: MAPS.world1.spawnX,
      spawnY: MAPS.world1.spawnY,
      weapon: new W_Dagger(),
      worldId: 1,
      completed: false,
    };
    world.mapstate = 2;
    world.completeEvent = 0;
  }

  if (keyIsDown(16) && keyIsDown(50) && !p50)
  {
    saved = {
      hp: CO.usermove.maxHP,
      maxhp: CO.usermove.maxHP,
      spawnX: MAPS.world2.spawnX,
      spawnY: MAPS.world2.spawnY,
      weapon: new W_Knife(),
      worldId: 2,
      completed: false,
    };
    world.mapstate = 2;
    world.completeEvent = 0;
  }

  if (keyIsDown(16) && keyIsDown(51) && !p51)
  {
    saved = {
      hp: CO.usermove.maxHP,
      maxhp: CO.usermove.maxHP,
      spawnX: MAPS.congrat.spawnX,
      spawnY: MAPS.congrat.spawnY,
      weapon: new W_Clap(),
      worldId: -1,
      completed: true,
    };
    world.mapstate = 2;
    world.completeEvent = 0;
  }

  p192 = keyIsDown(192);
  p49 = keyIsDown(49);
  p50 = keyIsDown(50);
  p51 = keyIsDown(51);
}
