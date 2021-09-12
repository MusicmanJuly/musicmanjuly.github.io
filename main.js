
var saved;

function initSave()
{
  saved = {
    hp: CO.usermove.maxHP,//CO.usermove.initHP,
    maxhp: CO.usermove.maxHP,
    spawnX: 5, //MAPS.world1.spawnX,
    spawnY: 32, //MAPS.world1.spawnY,
    weapon: new W_Knife(),
    worldId: 2,
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
}

function run()
{
  let res = world.isCompletedAndCatchEvent();
  if (res >= 0)
  {
    startWorld();
  }
  world.action();
  world.render();
}


