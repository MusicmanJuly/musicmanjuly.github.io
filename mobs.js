class Mob extends Entity
{
    constructor(ptype, p0, char, atk = 0, hp0 = CO.entity.defaultHP,
        weight = 1.0, dmgtime = CO.entity.defaultDamagedTime,
        region = null, homepoint = null,
        maxvx0 = CO.entity.defaultMaxVX, maxvy0 = CO.entity.defaultMaxVY)
    {
        super(ptype, p0, hp0, weight, hp0, CO.vector.zero.copy(), maxvx0, maxvy0, dmgtime);

        this.atk = atk;

        // 可能成为怪物目标的玩家
        this.playerTarget = char;
        // 怪物会对领域中的敌人产生兴趣。默认 null 表示全局。
        if (region != null)
            this.region = CO.utility.boxmul(region, CO.units.pbpx);
        else
            this.region = null;
        // 怪物对敌人失去兴趣则会回到家园点。默认 null 表示无家园点。
        if (homepoint != null)
            this.homepoint = homepoint.copy().mult(CO.units.pbpx);
        else
            this.homepoint = null;

        // 渲染时血条高度
        this.hpBarOffsetY = -10;
    }

    updateStatus(map)
    {
        this.updateTarget();
        super.updateStatus(map);
    }

    updateTarget()
    {
        if (this.region == null || CO.utility.isin(this.playerTarget.p, this.region))
            this.target = this.playerTarget.p;
        else if (this.homepoint != null && this.p.dist(this.homepoint) >= 200)
            this.target = this.homepoint;
        else
            this.target = null;
    }

    updateV()
    {
        this.mobAction();
        super.updateV();
    }

    mobAction()
    {
    }

    renderUpper(camera)
    {
        if (this.visible)
        {
            let worldLUX = this.p.x;
            let worldLUY = this.p.y - this.hpBarOffsetY;
            camera.renderHPBar(worldLUX, worldLUY, this.hp);
        }

        super.renderUpper(camera)
    }
}

class Slime extends Mob
{
    constructor(p0, char, region = null, homepoint = null,
        hp0 = ENTITIES.slime.hp,
        atk = ENTITIES.slime.atk, dmgtime = ENTITIES.slime.dmgtime)
    {
        super('pbground', p0, char, atk, hp0, ENTITIES.slime.weight,
            dmgtime, region, homepoint);

        // A001 检测是否处于地面
        this.ponGround = false;
        this.onGround = false;

        // 状态指示变量
        this.slimestate = 0;  // 0: REST, 1: JUMP, 2: WAIT
        this.slimetimer = 0;
        this.restSpan = 60;
        this.jumpSpan = 10;

        // 跳跃高度循环参数及其指针
        this.jumpYCycle = [0.7, 1.2, 1.5];
        this.jumpYCycleP = 0;

        // 跳跃远度约束与比例
        this.jumpXCon = 1;
        this.jumpXMiu = 0.02;

        this.setCollider(ENTITIES.slime.colli);
        this.setDeadAni(ENTITIES.slime.deadSpan, ENTITIES.slime.textures.dead);
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        // A001 检测是否处于地面
        this.ponGround = this.onGround;
        this.onGround = (this.warnD && this.distDown > 0 && this.distDown < 0.2);
        
        this.updateTexture();
    }

    updateTexture()
    {
        if (!this.onGround)
            this.setTexture(ENTITIES.slime.textures.jump);
        else
            this.setTexture(ENTITIES.slime.textures.stand);
    }

    mobAction()
    {
        // console.log('mob', this.p.x, this.p.y);
        this.switchState();

        // A001.1 施加摩擦力(持续因素)到 dv
        if (this.onGround)
            this.v.x *= ENTITIES.slime.groundFrictionMiu;
        else
            this.v.x *= ENTITIES.slime.airFrictionMiu;
        
        let dmga1 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 7, 10, 0, -3, 7, 10, -10, -3, [this.id]);
        let dmga2 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 0, 10, 0, -3, 7, 10, 10, -3, [this.id]);
    }

    followTarget()
    {
        // 调用时已经确定拥有非 null 的 this.target
        if (this.slimestate == 1)
        {
            let dvy = -this.jumpYCycle[this.jumpYCycleP];
            let dvx = constrain((this.target.x - this.p.x) * this.jumpXMiu,
                -this.jumpXCon, this.jumpXCon);
            this.dv.y += dvy;
            this.dv.x += dvx;
        }
    }

    switchState()
    {
        if (this.slimestate == 0 && this.slimetimer >= this.restSpan && this.onGround)
        {   // REST -> JUMP
            this.slimestate = 1;
            this.slimetimer = 0;
        }
        else if (this.slimestate == 1 && this.slimetimer >= this.jumpSpan)
        {   // JUMP -> WAIT
            this.slimestate = 2;
            this.jumpYCycleP = (this.jumpYCycleP+1) % this.jumpYCycle.length;
        }
        else if (this.slimestate == 2 && this.slimetimer && this.onGround)
        {   // WAIT -> REST
            this.slimestate = 0;
            this.slimetimer = 0;
        }
        this.slimetimer++;
    }

    inflictedDamage(dmg)
    {
        MUSICSOUND.slime_hurt.play();
        super.inflictedDamage(dmg);
    }
}

class Niu extends Mob
{
    constructor(p0, char, region = null, homepoint = null,
        hp0 = ENTITIES.niu.hp,
        atk = ENTITIES.niu.atk, dmgtime = ENTITIES.niu.dmgtime)
    {
        super('pbground', p0, char, atk, hp0, ENTITIES.niu.weight,
            dmgtime, region, homepoint);

        // A001 检测是否处于地面
        this.ponGround = false;
        this.onGround = false;

        // A003 检测是否靠墙
        this.leftwall = false;
        this.rightwall = false;

        this.critMiu = ENTITIES.niu.critMiu;

        // 状态指示变量
        this.niustate = Niu.NIUSTATES.APPROACH;  // 0: REST, 1: JUMP, 2: WAIT
        this.niutimer = 0;
        this.hitSpan = 10;
        this.freeSpan = 15;
        this.jumpfreezeSpac = 60;
        this.jumpfreezeTimer = 0;
        this.approachDist = 80;
        this.approachPointOffsetX = -12 * 4; // remember mirrored
        this.approachPointOffsetY = -8 * 4;
        this.niuhitcounter = 0;

        // 跳跃高度循环参数及其指针
        this.hitTimesCycle = [4, 6, 4, 10];
        this.hitTimesCycleP = 0;

        // 移动变量
        this.jumpSpan = 4;
        this.jumpDV = 3;
        this.approachDV = 0.4;

        this.setCollider(ENTITIES.niu.colli);
        this.setAppearAni(ENTITIES.niu.appearSpan, ENTITIES.niu.textures.appear);
        this.setDeadAni(ENTITIES.niu.deadSpan, ENTITIES.niu.textures.dead);
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        // A001 检测是否处于地面
        this.ponGround = this.onGround;
        this.onGround = (this.warnD && this.distDown > 0 && this.distDown < 0.2);
        
        // A003 检测是否靠墙
        this.leftwall = (this.warnL && this.distLeft > 0 && this.distLeft < 16);
        this.rightwall = (this.warnR && this.distRight > 0 && this.distRight < 16);

        // 切换方向
        if (this.v.x > 0.5)
            this.mirrored = true;
        else if (this.v.x < -0.5)
            this.mirrored = false;

        this.updateTexture();
    }

    updateTexture()
    {
        if (this.niustate == Niu.NIUSTATES.APPROACH ||
            this.niustate == Niu.NIUSTATES.JUMP)
            this.setTexture(ENTITIES.niu.textures.approach);
        else if (this.niustate == Niu.NIUSTATES.HIT)
            this.setTexture(ENTITIES.niu.textures.hit_keep);
        else    // HIT_FREE
            this.setTexture(ENTITIES.niu.textures.hit_free);
    }

    switchState()
    {
        if (this.niustate == Niu.NIUSTATES.APPROACH &&
            ((this.mirrored && this.rightwall) || (!this.mirrored && this.leftwall)) &&
            this.jumpfreezeTimer <= 0)
        {   // APPROACH -> JUMP
            this.niutimer = 0;
            this.niustate = Niu.NIUSTATES.JUMP;
        }
        else if (this.niustate == Niu.NIUSTATES.JUMP && this.niutimer >= this.jumpSpan)
        {   // JUMP -> APPROACH
            this.niustate = Niu.NIUSTATES.APPROACH;
            this.jumpfreezeTimer = this.jumpfreezeSpac;
        }
        else if (this.niustate == Niu.NIUSTATES.APPROACH &&
            this.target != null &&
            this.target.dist(this.p.copy().add(
                createVector(this.approachPointOffsetX *
                    (this.mirrored ? -1 : 1),
                this.approachPointOffsetY)
            )) <= this.approachDist)
        {   // APPROACH -> HIT
            this.niustate = Niu.NIUSTATES.HIT;
            this.niutimer = 0;
            this.niuhitcounter = this.hitTimesCycle[this.hitTimesCycleP];
            this.hitTimesCycleP = (this.hitTimesCycleP + 1) % this.hitTimesCycle.length;
        }
        else if (this.niustate == Niu.NIUSTATES.HIT &&
            this.niutimer >= this.hitSpan)
        {   // HIT -> HIT_BREAK, APPROACH
            if (this.niuhitcounter >= 0)
            {   // HIT -> HIT_BREAK
                this.niustate = Niu.NIUSTATES.HIT_BREAK;
                this.niutimer = 0;
                this.niuhitcounter--;
            }
            else
            {   // HIT -> APPROACH
                this.niustate = Niu.NIUSTATES.APPROACH;
            }
        }
        else if (this.niustate == Niu.NIUSTATES.HIT_BREAK &&
            this.niutimer >= this.freeSpan)
        {   // HIT_BREAK -> HIT
            this.niustate = Niu.NIUSTATES.HIT;
            this.niutimer = 0;
        }

        if (this.niustate == Niu.NIUSTATES.APPROACH)
            this.jumpfreezeTimer--;

        this.niutimer++;
    }

    followTarget()
    {   // A004 X接近
        // 调用时已经确定拥有非 null 的 this.target
        if (this.niustate == Niu.NIUSTATES.APPROACH)
        {
            if (this.target.x - this.p.x > 0)
                this.mirrored = true;
            else
                this.mirrored = false;
            
            this.dv.x += -(this.mirrored ? -1 : 1) * this.approachDV;
        }
    }

    mobAction()
    {
        this.switchState();

        // A001.1 施加摩擦力(持续因素)到 dv
        if (this.onGround)
            this.v.x *= ENTITIES.niu.groundFrictionMiu;
        else
            this.v.x *= ENTITIES.niu.airFrictionMiu;

        // A003.1 跳跃
        if (this.niustate == Niu.NIUSTATES.JUMP)
            this.v.y -= this.jumpDV;

        if (this.niustate == Niu.NIUSTATES.HIT)
        {
            let dmga1 = new DamageArea(dmgs, this.atk * this.critMiu, this.p.x, this.p.y, 0, 0, -20, -19, 11, 9, -20, -8, [this.id], this.mirrored);
            let dmga2 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 0, 0, -9, -20, 12, 22, -15, -6, [this.id], this.mirrored);
        }
    }

    inflictedDamage(dmg)
    {
        MUSICSOUND.slime_hurt.play();
        super.inflictedDamage(dmg);
    }

    /*
    render(camera)
    {
        super.render(camera);

        let asd = this.p.copy().add(
            createVector(this.approachPointOffsetX *
                (this.mirrored ? -1 : 1),
            this.approachPointOffsetY)
        );
        
        camera.renderPoint(asd.x, asd.y);
    }
    */
}

Niu.NIUSTATES = {
    APPROACH: 0, 
    JUMP: 1,
    HIT: 2,
    HIT_BREAK: 3,
}

class Zombie extends Mob
{
    constructor(p0, char, region = null, homepoint = null,
        hp0 = ENTITIES.zombie.hp, atk = ENTITIES.zombie.atk, 
        dmgtime = ENTITIES.zombie.dmgtime)
    {
        super('pbground', p0, char, atk, hp0, ENTITIES.zombie.weight,
            dmgtime, region, homepoint);

        this.target = this.playerTarget;
        this.gear = new Boomerang(p0, [this.id], this.atk, this);
        
        // 状态指示
        // 0: WALK, 1: WAIT
        this.state = 0;
        this.timer = 0;
        this.walkSpan = 180;

        this.critMiu = ENTITIES.zombie.critMiu;

        this.setCollider(ENTITIES.zombie.colli);
        this.setDeadAni(ENTITIES.zombie.deadSpan, ENTITIES.zombie.textures.dead);
    }

    mobAction(map)
    {
        this.statework();

        let dmga1 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 4, 23, 0, 0, 4, 23, -12, -5, [this.id]);
        let dmga2 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 0, 23, 0, 0, 4, 23, 12, -5, [this.id]);

        this.gear.action(map);

        if (this.state == 0)
        {
            let off = createVector((this.mirrored ? 1 : -1) * 18, -36);
            this.gear.p = this.p.copy().add(off);
        }

        this.v.mult(ENTITIES.zombie.groundFrictionMiu);
    }

    followTarget()
    {   // A004 X接近
        if (this.state == 0)
        {
            if (this.target.x - this.p.x > 0)
                this.mirrored = true;
            else
                this.mirrored = false;
            
            this.dv.x += -(this.mirrored ? -1 : 1) * ENTITIES.zombie.walkamiu;
        }
    }

    statework()
    {
        // console.log('zombie', this.state, this.timer);
        if (this.state == 0 && this.timer >= this.walkSpan)
        {   // WALK -> WAIT
            // console.log("WALK -> WAIT");
            this.state = 1;
            this.setTexture(ENTITIES.zombie.textures.stand);

            // gear: HOLD -> OUT
            // console.log("HOLD -> OUT");
            let path = this.playerTarget.p.copy().sub(this.p.copy());
            this.gear.dv.add(path.setMag(this.gear.outSpeed));
            this.gear.state = 1;
            this.gear.timer = 0;
        }
        // WAIT -> WALK 由gear发出
        this.timer++;
    }

    render(camera)
    {
        this.gear.render(camera);
        super.render(camera);
    }

    toDEAD()
    {
        this.gear.toDEAD();
        super.toDEAD();
    }
}

class Boomerang extends Display
{
    constructor(p0, distargetIDs, atk, master)
    {
        super(p0, DISPLAYS.killergear.fast);

        this.atk = atk;
        this.distargetIDs = distargetIDs;

        this.outSpeed = 6;
        this.outTime = 140;

        this.backMiu = 0.005;
        this.airFrictionMiu = 0.90;

        // HOLD: 0, OUT: 1, BACK: 2.
        this.state = 0;
        this.timer = 0;

        this.master = master;
    }

    action(map)
    {
        this.statework();
        super.action(map);
    }

    followTarget()
    {
        let path = this.target.copy().sub(this.p.copy());
        this.dv.add(path.mult(this.backMiu));
        this.v.mult(this.airFrictionMiu);
    }

    updateV()
    {   // 这部分和mobAction很像
        let dmga1 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 6, 6, 0, 0, 6, 12, -10, -3, [this.master.id]);
        let dmga2 = new DamageArea(dmgs, this.atk, this.p.x, this.p.y, 0, 6, 0, 0, 6, 12, 10, -3, [this.master.id]);
        
        if (this.state == 2)
            this.target = this.master.p;
        else
            this.target = null;
        
        super.updateV();
    }

    statework()
    {  
        // console.log('gear', this.state, this.timer);
        // HOLD -> OUT 的指示是外部的Zombie发出的
        if (this.state == 1 && this.timer >= this.outTime)
        {   // OUT -> BACK
            // console.log("OUT -> BACK");
            this.state = 2;
        }
        if (this.state == 2 && this.p.dist(this.master.p) <= 5)
        {   // BACK -> HOLD
            // console.log("BACK -> HOLD");
            this.state = 0;
            this.timer = 0;

            this.v = CO.vector.zero.copy();

            // master: WAIT -> WALK
            // console.log("WAIT -> WALK");
            this.master.state = 0;
            this.master.timer = 0;
            this.master.setTexture(ENTITIES.zombie.textures.walk);
        }
        this.timer++;
    }
}