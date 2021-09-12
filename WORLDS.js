
var worldmemories = {
    world1: {
        barricade1: false,
        barricade2: false,
    },
    world2: {
        barricade1: false,
        barricade2: false,
        barricade3: false,
    },
    weapon: {
        knife: false,
    }
}


class World
{
    constructor(map, startX, startY, weapon, hp0 = CO.usermove.maxHP)
    {
        // 
        dmgs = [];

        this.map = map;
        // console.log('init', startX, startY);
        this.july = new Character(map, weapon, createVector(startX, startY), hp0);
        this.entities = [];
        this.entities[0] = this.july;
        this.camera = new Camera(this.map, this.july);

        // -1:Fadein, 0:ok, 1:Fadeout, 2:Completed
        this.mapstate = -1;
        this.fadeinSpan = 60;
        this.fadeoutSpan = 60;
        this.maptimer = 0;

        // -1: undecided, 0:restart, 1,2,3,...: gotoWorld
        this.completeEvent = -1;
    }

    action()
    {
        this.transtate();

        // console.log(this.july.p.x, this.july.p.y);

        if (this.mapstate != 2)
        {

            // 攻击区的行为
            let i = 0;
            while (i<dmgs.length)
            {
                dmgs[i].action(this.entities);

                if (dmgs[i].isDisposed)
                    dmgs.splice(i, 1);
                else
                    i++;
            }

            // 实体的行为
            i = 0;
            while (i<this.entities.length)
            {
                this.entities[i].action(this.map);

                if (this.entities[i].basicstate == Entity.STATES.DISPOSED)
                {
                    this.entities[i].disposedAction(map);
                    if (i > 0)
                        this.entities.splice(i, 1);
                    else    // july disposed
                    {
                        this.completeEvent = 0;
                        i++;
                    }
                }
                else
                    i++;
            }
        }

        // 相机的行为
        this.camera.action();
    }

    transtate()
    {
        if (this.mapstate == -1 && this.maptimer >= this.fadeinSpan)
        {   // fadein -> ok
            this.mapstate = 0;
        }
        else if (this.mapstate == 0 && this.completeEvent != -1)
        {   // ok -> fadeout
            this.mapstate = 1;
            this.maptimer = 0;
        }
        else if (this.mapstate == 1 && this.maptimer >= this.fadeoutSpan)
        {   // fadeout -> complete
            this.mapstate = 2;
        }
        this.maptimer++;
    }

    isCompletedAndCatchEvent()
    {
        if (this.mapstate == 2)
            return this.completeEvent;
        else
            return -1;
    }

    render()
    {
        this.camera.renderMapBack(this.map);
        for (let i=this.entities.length-1; i>=0; i--)
            this.entities[i].render(this.camera);
        if (CO.debug)
            for (let i=0; i<dmgs.length; i++)
                dmgs[i].debugShow(this.camera);
        this.camera.renderMapFore(this.map);

        for (let i=this.entities.length-1; i>=0; i--)
            this.entities[i].renderUpper(this.camera);
        
        this.camera.renderUpper(this.map);
        
        if (this.mapstate == -1)
            this.drawBlackScreen(parseFloat(this.maptimer)/this.fadeinSpan);
        else if (this.mapstate == 1)
            this.drawBlackScreen(1 - parseFloat(this.maptimer)/this.fadeoutSpan);
        else if (this.mapstate == 2)
            this.drawBlackScreen(0);
    }

    drawBlackScreen(contentAlpha)  // 0.0 (totally black) to 1.0 (visible)
    {
        push();
        noStroke();
        fill(0, 255 - contentAlpha*255);
        rect(0, 0, CO.display.x, CO.display.y);
        pop();
    }
}

class World1 extends World
{
    constructor(startX, startY, weapon, hp0 = CO.usermove.maxHP)
    {
        super(MAPS.world1, startX, startY, weapon, hp0);

        this.july.setAppearAni(ENTITIES.july.appearSpan, ENTITIES.july.textures.awake);

        this.slime1 = this.entities[this.entities.length] =
            new Slime(createVector(90, 20),
            this.july, [76, 117, 6, 40], createVector(90, 20));

        this.sofa = this.entities[this.entities.length] = 
            new Display(createVector(11, 29), DISPLAYS.sofa.grey);
        
        this.knife = this.entities[this.entities.length] = 
            new Display(createVector(140, 52.5), DISPLAYS.knife.on);

        this.barricade1 = this.entities[this.entities.length] = 
            new Barricade(createVector(113.5, 31), 8, this.map, [this.slime1]);
        if (worldmemories.world1.barricade1)
            this.barricade1.toDEAD();
        
        this.barricade2 = this.entities[this.entities.length] = 
            new Barricade(createVector(179.5, 48), 8, this.map, [], false);
        if (worldmemories.world1.barricade2)
            this.barricade2.toDEAD();

        this.hpbottle1 = this.entities[this.entities.length] = 
            new HPBottle(createVector(129, 46.5), [this.july]);

        this.slime2 = this.slime3 = this.slime4 = null;
        this.hpbottle2 = null;
        this.niu = null;

        // 史莱姆和牛头人的试炼
        // 0: not start
        // 1: slimes
        // 2: niu
        // 3: clear
        this.progress = 0;

        this.gotKnife = false;
        this.gothpbottle = false;
        this.gothpbottle2 = false;

        this.isout = false;

        musicTo(MUSICSOUND.bgm_world1, this.camera, "♪　Smiling Memories - Music therapy");
    }

    action()
    {
        if (this.barricade1.basicstate == Entity.STATES.DISPOSED)
            worldmemories.world1.barricade1 = true;

        if (this.july.p.copy().dist(this.knife.p) <= 30 && !this.gotKnife)
        {
            MUSICSOUND.get.play();
            this.knife.setTexture(DISPLAYS.knife.off);
            this.july.basicstate = Entity.STATES.APPEAR;
            this.july.setAppearAni(60, ENTITIES.july.textures.get_knife);
            this.july.basictimer = 0;
            this.july.weapon.rewind();
            this.july.weapon = new W_Knife();
            this.gotKnife = true;
            this.progress = 1;

            saved.weapon = new W_Knife();

            let region = [134, 187, 21, 55];
            let homepoint = createVector(172, 52);
            this.slime2 = this.entities[this.entities.length] = 
                new Slime(createVector(158, 31), this.july, region, homepoint, 6);
            this.slime3 = this.entities[this.entities.length] = 
                new Slime(createVector(162, 21), this.july, region, homepoint, 10);
            this.slime4 = this.entities[this.entities.length] = 
                new Slime(createVector(165, 11), this.july, region, homepoint, 14);
            this.slime5 = this.entities[this.entities.length] = 
                new Slime(createVector(168, 4), this.july, region, homepoint, 18);
        }

        if (this.progress == 1 && 
            this.slime2 != null && this.slime3 != null && this.slime4 != null &&
            this.slime5 != null &&
            this.slime2.basicstate == Entity.STATES.DISPOSED &&
            this.slime3.basicstate == Entity.STATES.DISPOSED &&
            this.slime4.basicstate == Entity.STATES.DISPOSED &&
            this.slime5.basicstate == Entity.STATES.DISPOSED)
        {
            MUSICSOUND.get.play();
            this.hpbottle2 = this.entities[this.entities.length] = 
                new HPBottle(createVector(140, 52), [this.july]);
            this.progress = 2;
        }

        if (this.hpbottle2 != null && this.hpbottle2.basicstate == Entity.STATES.DISPOSED)
        {
            let region = [134, 187, 21, 55];
            let homepoint = createVector(172, 52);

            this.niu = this.entities[this.entities.length] = 
                new Niu(createVector(160, 52), this.july, region, homepoint);
            this.barricade2.addBinds(this.niu);
            this.barricade2.checkBinds = true;

            musicTo(MUSICSOUND.bgm_boss1, this.camera, "♪  情動カタルシス", 0.4);
        }

        if (this.barricade2.basicstate == Entity.STATES.DISPOSED)
            worldmemories.world1.barricade2 = true;

        if (CO.utility.isin(this.july.p, [206*32, 210*32, 30*32, 49*32]) && !this.isout)
        {
            this.completeEvent = 2;

            this.mapstate = 1;
            this.maptimer = 0;
            this.isout = true;

            saved.spawnX = MAPS.world2.spawnX;
            saved.spawnY = MAPS.world2.spawnY;
            saved.hp = CO.usermove.maxHP;
            saved.worldId = 2;

            // console.log(saved);

            this.july.setAppearAni(0, null);
        }

        super.action();
    }
}

class Display extends Entity
{
    constructor(p0, texture, interactive = true)
    {
        super('pbcenter', p0);
        
        this.setTexture(texture);

        this.gravity = 0;
        this.mapCollision = false;
    }
}

class Barricade extends Entity
{
    /**
     * @param {MAP} map 
     */
    constructor(p0, halfh, map, binds, check = true)
    {
        super('pbcenter', p0)
        {
            this.l = p0.x - 1;
            this.r = p0.x + 1;
            this.u = p0.y - halfh;
            this.d = p0.y + halfh;
            this.binds = binds;

            this.map = map;
            this.setTexture(DISPLAYS.barricade.on, createVector(4, 4));
            this.setDeadAni(100, DISPLAYS.barricade.dead);

            // 是否开启对 binds 生物的检查，
            // 一般用于要 binds 的生物未生成但是也要关着门的时候
            this.checkBinds = check;

            for (var i=parseInt(this.l)+1; i<=this.r; i++)
                for (var j=parseInt(this.u)+1; j<=this.d; j++)
                    this.map.addedsolids[i][j] = true;
        }
    }

    addBinds(entityID)
    {
        this.binds[this.binds.length] = entityID;
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        // 检查绑定的物体的状态
        if (this.checkBinds)
        {
            let hasAlive = false;
            for (var i=0; i<this.binds.length; i++)
                if (this.binds[i].basicstate != Entity.STATES.DISPOSED)
                    hasAlive = true;

            if (!hasAlive)
            {
                MUSICSOUND.get.play();
                this.toDEAD();
            }
        }
    }

    disposedAction(map)
    {
        for (var i=parseInt(this.l)+1; i<=this.r; i++)
            for (var j=parseInt(this.u)+1; j<=this.d; j++)
                this.map.addedsolids[i][j] = false;
    }
}

class HPBottle extends Display
{
    // target 指可以
    constructor(p0, targets)
    {
        super(p0, DISPLAYS.hpbottle.main);
        this.enabled = true;
        this.targets = targets;
    }

    action()
    {
        for (var i=0; i<this.targets.length; i++)
        {
            let target = this.targets[i];
            if (target.p.copy().dist(this.p) <= 20 && this.basicstate == Entity.STATES.ACTIVE)
            {
                target.recoverHP();
                this.toDISPOSED();
            }
        }
        super.action();
    }
}

class World2 extends World
{
    constructor(startX, startY, weapon, hp0 = CO.usermove.maxHP)
    {
        super(MAPS.world2, startX, startY, weapon, hp0);

        musicTo(MUSICSOUND.bgm_world2, this.camera, "♪　Dungeon8 (Sequel blight BGM) - はきか");
        
        this.kgear1 = this.entities[this.entities.length] = 
            new KillerGear(createVector(60, 32), [], 1.5, false, 
            [createVector(60, 32).mult(32), createVector(60, 26).mult(32)], 2);
        this.kgear2 = this.entities[this.entities.length] = 
            new KillerGear(createVector(62, 32), [], 3.2, true, 
            [createVector(62, 32).mult(32), createVector(62, 26).mult(32)], 2);

        this.kgear3 = this.entities[this.entities.length] = 
            new KillerGear(createVector(92, 35), [], 3.0, true, 
            [createVector(92, 35).mult(32), createVector(92, 44).mult(32),
                createVector(100, 44).mult(32)], 2);
        this.kgear4 = this.entities[this.entities.length] = 
            new KillerGear(createVector(100, 46), [], 1.5, false, 
            [createVector(100, 46).mult(32), createVector(100, 35).mult(32),
                createVector(105, 35).mult(32), createVector(105, 46).mult(32)], 2);
        this.kgear5 = this.entities[this.entities.length] = 
            new KillerGear(createVector(103, 44), [], 0.2, false, 
            [createVector(103, 44).mult(32)], 2);
        this.kgear6 = this.entities[this.entities.length] = 
            new KillerGear(createVector(92, 44), [], 0.2, false, 
            [createVector(92, 44).mult(32)], 2);
        this.kgear7 = this.entities[this.entities.length] = 
            new KillerGear(createVector(92, 36), [], 0.2, false, 
            [createVector(92, 36).mult(32)], 2);

        this.slime = this.entities[this.entities.length] = 
            new Slime(createVector(128, 35), this.july, [114, 152, 24, 43], createVector(128, 35), 10);
        
        this.floorpad = this.entities[this.entities.length] = 
            new Display(createVector(40, 49.5), DISPLAYS.floorpad.main);
        
        this.niu = this.entities[this.entities.length] = 
            new Niu(createVector(198, 54), this.july,
                [138, 234, 31, 59], createVector(198, 54), 200);

        this.zombie = this.entities[this.entities.length] = 
            new Zombie(createVector(102, 31), this.july,
                [92, 114, 21, 32], createVector(102, 31));

        this.hpbottle1 = this.entities[this.entities.length] = 
            new HPBottle(createVector(35, 51.5), [this.july]);
        this.hpbottle2 = this.entities[this.entities.length] = 
            new HPBottle(createVector(33, 51.5), [this.july]);

        this.chestLocation = createVector(70, 51.8);
        this.key = this.entities[this.entities.length] = 
            new Key('key', createVector(155, 23), DISPLAYS.key.main,
                this.july, this.chestLocation.copy().mult(32), -0.1, 150);
        this.chest = this.entities[this.entities.length] = 
            new Display(this.chestLocation, DISPLAYS.chest.closed);

        this.gateLocation = createVector(223.5, 32);
        this.jade_right = this.entities[this.entities.length] = 
            new Key("jright", createVector(231, 53), 
                DISPLAYS.jade.right, this.july, this.gateLocation.copy().add(0, -8).mult(32), 0, 350);
        this.jade_left = this.entities[this.entities.length] = 
            new Key("jleft", createVector(110, 31), 
                DISPLAYS.jade.left, this.july, this.gateLocation.copy().add(0, -8).mult(32), 0, 350);

        this.barri1 = this.entities[this.entities.length] = 
            new Barricade(createVector(48.5, 30), 30, this.map, [], false);
        if (worldmemories.world2.barricade1)
            this.barri1.toDEAD();
        
        this.barri2 = this.entities[this.entities.length] = 
            new Barricade(createVector(89.5, 19), 12, this.map, [this.zombie], true);
        this.barri2.mirrored = true;
        if (worldmemories.world2.barricade2)
            this.barri2.toDEAD();

        this.barri3 = this.entities[this.entities.length] = 
            new Barricade(createVector(224.5, 52), 12, this.map, [this.niu], true);
        if (worldmemories.world2.barricade3)
            this.barri3.toDEAD();

        this.paddoor = this.entities[this.entities.length] = 
            new PadDoor(createVector(113.5, 42.6), this.map, this.july);

        this.gate = this.entities[this.entities.length] = 
            new Gate(this.gateLocation, this.map, this.july);

        this.puzzle1Solved = false;
        this.chestOpened = false;
        this.jleftGot = false;
        this.jrightGot = false;
        this.isout = false;

        this.bomb = null;
    }

    action()
    {

        if (this.july.p.dist(createVector(40, 49.5).mult(32)) <= 100 &&
            this.july.weapon != null && 
            this.july.weapon instanceof W_Knife && 
            this.july.weapon.isState(W_Knife.STATES.CRIT) &&
            !this.puzzle1Solved)
            {
                MUSICSOUND.get.play();
                this.barri1.toDEAD();
                this.puzzle1Solved = true;
                worldmemories.world2.barricade1 = true;
            }
        
        if (this.barri2.basicstate == Entity.STATES.DISPOSED)
            worldmemories.world2.barricade2 = true;
        
        // console.log(this.chestOpened, this.key.basicstate, this.key.p.dist(this.key.destination));
        if (!this.chestOpened && this.key.basicstate == Entity.STATES.DISPOSED)
        {
            // console.log('***');
            this.bomb = this.entities[this.entities.length] = 
                new Bomb("bomb", this.chestLocation.copy().add(0, -4), 
               this.july, this.niu, +0.1, 150);
            this.chestOpened = true;
        }

        console.log(this.jade_left, this.jade_left.basicstate, this.jleftGot);
        if (this.jade_left != null && this.jade_left.basicstate == Entity.STATES.DISPOSED
            && !this.jleftGot)
        {
            console.log('left');
            if (!this.gate.right)
                this.gate.setTexture(DISPLAYS.gate.left);
            this.gate.left = true;
            this.jleftGot = true;
        }

        console.log(this.jade_right, this.jade_right.basicstate, this.jrightGot);
        if (this.jade_right != null && this.jade_right.basicstate == Entity.STATES.DISPOSED
            && !this.jrightGot)
        {
            console.log('right');
            if (!this.gate.left)
                this.gate.setTexture(DISPLAYS.gate.right);
            this.gate.right = true;
            this.jrightGot = true;
        }

        if (CO.utility.isin(this.july.p, [247*32, 249*32, 7*32, 32*32]) && !this.isout)
        {
            this.completeEvent = 3;

            this.mapstate = 1;
            this.maptimer = 0;
            this.isout = true;

            saved.completed = true;

            // console.log(saved);

            this.july.setAppearAni(0, null);
        }

        super.action();
    }
}

class KillerGear extends Display
{
    // workpath: [v1, v2, v3, ...], px
    constructor(p0, distargetIDs, speed, isFast, workpath, atk)
    {
        super(p0, (isFast ? DISPLAYS.killergear.fast : DISPLAYS.killergear.main));

        this.atk = atk;
        this.distargetIDs = distargetIDs;
        this.speed = speed;
        this.workpath = workpath;
        this.workpathp = 0;

        this.target = this.workpath[0].copy();
    }

    action(map)
    {
        if (this.p.dist(this.target) <= this.speed * 1.2)
        {
            this.workpathp = (this.workpathp + 1) % this.workpath.length;
            this.target = this.workpath[this.workpathp].copy();
        }

        super.action(map);
    }

    followTarget()
    {
        let path = this.target.copy().sub(this.p.copy());
        this.dp.add(path.setMag(this.speed));
    }

    updateV()
    {   // 这部分和mobAction很像
        let dmga1 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 6, 6, 0, 0, 6, 12, -10, -3, this.distargetIDs);
        let dmga2 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 0, 6, 0, 0, 6, 12, 10, -3, this.distargetIDs);
        super.updateV();
    }

    
}

class Key extends Display
{
    /**
     * @param {String} name 
     * @param {*} p0 
     * @param {Texture} texture 
     * @param {Entity} follow 
     * @param {*} destination px
     */
    constructor(name, p0, texture, follow, destination, dangle, dis)
    {
        super(p0, texture);

        this.follow = follow;
        this.isFollowing = false;
        this.destination = destination;

        this.dangle = dangle;

        this.dis = dis

        this.movemiu = 0.004;
        this.friction = 0.98;

        // 0: stay, 1: follow, 2: called 
        this.state = 0;

        this.name = name;
    }

    action()
    {
        if (this.state == 2 && this.p.dist(this.destination) <= 50)
        {
            // 2 -> DISPOSED
            this.toDEAD();
        }
        else if (this.state == 1 && this.p.dist(this.destination) <= this.dis)
        {   // 1 -> 2
            this.target = this.destination;
            this.isFollowing = false;
            this.state = 2;
        }
        else if (this.state == 0 && this.p.dist(this.follow.p.copy().add(createVector(0, -80))) <= 100)
        {   // 0 -> 1
            this.isFollowing = true;
            this.state = 1;
        }

        // update
        if (this.state == 1)
            this.target = this.follow.p; 
        else if (this.state == 2)
            this.target = this.destination;
        else
            this.target = null;

        super.action();
    }

    followTarget()
    {
        let path = this.target.copy().sub(this.p.copy());
        this.dv.add(path.mult(this.movemiu).rotate(this.dangle));
        this.v.mult(this.friction);
    }
}

class Bomb extends Key
{
    constructor(name, p0, july, enemy, dangle, dis)
    {
        super(name, p0, DISPLAYS.bomb.main, july, enemy.p, dangle, dis);

        this.enemy = enemy;

        this.setDeadAni(92, DISPLAYS.bomb.boom);
    }

    action(map)
    {
        this.destination = this.enemy.p;
        super.action(map);
    }

    toDEAD()
    {
        this.enemy.hp = 0;
        this.enemy.toDEAD();
        MUSICSOUND.boom.play();
        super.toDEAD();
    }
}

class PadDoor extends Display
{
    /**
     * @param {MAP} map 
     */
    constructor(p0, map, july)
    {
        super(p0, DISPLAYS.paddoor.off)
        {
            this.x = parseInt(p0.x + 1);
            this.u = parseInt(p0.y) - 4;
            this.d = parseInt(p0.y);

            this.july = july;

            this.map = map;
            this.time = 0;
            this.timeSpan = 60;

            this.off();
        }
    }

    addBinds(entityID)
    {
        this.binds[this.binds.length] = entityID;
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        // console.log(this.time);
        if (this.time > 0)
        {
            this.time--;
        }
        else // this.time <= 0
        {
            if (!CO.utility.checkCollapseBox(this.july.getColli(), 
                CO.utility.boxmul([this.x, this.x + 1, this.u, this.d], 32)))
            {
                this.off();
            }
        }

        if (CO.utility.checkCollapseBox(this.july.getColli(),
            CO.utility.boxmul([this.x-1.8, this.x-0.2, this.d-0.1, this.d], 32)))
        {
            this.on();
            this.time = this.timeSpan;
        }
    }

    off()
    {
        this.setTexture(DISPLAYS.paddoor.off);
        for (var j=this.u+1; j<=this.d; j++)
            this.map.addedsolids[this.x][j] = true;
        for (var j=this.u+1; j<=this.d; j++)
            this.map.addedsolids[this.x+1][j] = true;
    }
    
    on()
    {
        this.setTexture(DISPLAYS.paddoor.on);
        for (var j=this.u+1; j<=this.d; j++)
            this.map.addedsolids[this.x][j] = false;
        for (var j=this.u+1; j<=this.d; j++)
            this.map.addedsolids[this.x+1][j] = false;
    }
}

class Gate extends Display
{
    /**
     * @param {MAP} map 
     */
    constructor(p0, map, july)
    {
        super(p0, DISPLAYS.gate.off);
        
        this.l = parseInt(p0.x - 6);
        this.r = parseInt(p0.x + 6);
        this.u = parseInt(p0.y - 16);
        this.d = parseInt(p0.y);

        this.july = july;

        this.map = map;

        this.left = false;
        this.right = false;

        this.setTexture(DISPLAYS.gate.off);
        this.setDeadAni(50, DISPLAYS.gate.move);
        for (var i=parseInt(this.l)+1; i<=this.r; i++)
            for (var j=parseInt(this.u)+1; j<=this.d; j++)
                this.map.addedsolids[i][j] = true;
        
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        console.log(this.left, this.right);
        if (this.left && this.right)
        {
            MUSICSOUND.get.play();
            this.toDEAD();
        }
    }
    
    disposedAction()
    {
        for (var i=parseInt(this.l)+1; i<=this.r; i++)
            for (var j=parseInt(this.u)+1; j<=this.d; j++)
                this.map.addedsolids[i][j] = false;
    }
}