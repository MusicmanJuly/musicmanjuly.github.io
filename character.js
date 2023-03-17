
class Character extends Entity
{
    /**
     * @param {MAP} map
     * @param {p5.Vector} p0
     * @param {Number} hp0
     * @param {p5.Vector} v0
     * @param {Number} maxvx0
     * @param {Number} maxvy0
     */
    constructor(map, weapon, p0, hp0 = CO.entity.defaultHP, 
        hpmax = CO.entity.defaultHP, v0 = CO.vector.zero.copy(), 
        maxvx0 = CO.entity.defaultMaxVX, maxvy0 = CO.entity.defaultMaxVY)
    {
        super('pbground', p0, hp0, 1.0, hpmax, v0, maxvx0, maxvy0);
        this.setBorder(0, map.x * CO.units.pbpx, 0, map.y * CO.units.pbpx);

        this.mapCollisionBounceVMin = CO.usermove.mapCollibounceVMin;
        this.mapCollisionBounceMiu = CO.usermove.mapCollibounceMiu;
        
        this.setCollider(ENTITIES.july.colli);
        this.setDeadAni(ENTITIES.july.deadSpan, ENTITIES.july.textures.dead);

        // A001 是否处于地面：处于地面或会受到水平运动摩擦力
        this.onGround = false;
        this.ponGround = false;
        // 是否静止不动
        this.isAFK = false;
        // 是否处于上升/下落状态：用于渲染角色图像
        this.goingUp = false;
        this.goingDown = false;
        // 记录下落时间
        this.fallingTime = 0;
        // 是否处于跑动状态：用于渲染角色图像
        this.isRunning = false;

        // 武器，武器是否正接管材质，武器是否正正接管操作
        this.weapon = weapon;

        // 是否可操纵
        this.controllable = true;

        // 控制要素：跳跃空格键按的长短等等
        this.spaceHoldFrames = 0;
    }

    updateStatus(map)
    {
        super.updateStatus(map);

        // A001 检测是否处于地面
        this.ponGround = this.onGround;
        this.onGround = (this.warnD && this.distDown > 0 && this.distDown < 0.2);

        // 检测是否静止不动
        this.isAFK = (this.v.mag() < 0.5 && this.dv.mag() < 0.5 && this.dp.mag() < 0.5);     

        // 检测是否上升/下落
        this.goingUp = (this.v.y < -ENTITIES.july.jumpHThres);
        this.goingDown = (this.v.y > ENTITIES.july.jumpLThres);
        if (this.goingDown)
            this.fallingTime++;
        else
            this.fallingTime = 0;

        // 检测是否正在跑动
        this.isRunning = (abs(this.v.x) > ENTITIES.july.moveXThres);

        // 改变镜像状态
        if (this.v.x < -ENTITIES.july.turnXThres)
            this.mirrored = true;
        else if (this.v.x > ENTITIES.july.turnXThres)
            this.mirrored = false;

        this.updateTexture();
    }

    updateTexture()
    {
        if (!this.damaged && this.weapon.overridingTexture)
            this.weapon.overrideTexture(this);
        else if (this.damaged)
        {
            if (this.damaged % (ENTITIES.july.damagedSwitchingFrames * 3) < 
                ENTITIES.july.damagedSwitchingFrames)
                this.setTexture(ENTITIES.july.textures.dmgd0);
            else
            {
                if (this.goingUp)           // 空中运动
                    this.setTexture(ENTITIES.july.textures.dmgd_jumph);
                else if (this.goingDown)
                    this.setTexture(ENTITIES.july.textures.dmgd_jumpl);
                else if (this.isRunning)    // 地上跑动
                    this.setTexture(ENTITIES.july.textures.dmgd_run);
                else
                    this.setTexture(ENTITIES.july.textures.dmgd);
            }
        }
        else
        {
            if (this.goingUp)           // 空中运动
                this.setTexture(ENTITIES.july.textures.jumph);
            else if (this.goingDown)
                this.setTexture(ENTITIES.july.textures.jumpl);
            else if (this.isRunning)    // 地上跑动
                this.setTexture(ENTITIES.july.textures.run);
            else
            {
                this.setTexture(ENTITIES.july.textures.stand);
                if (this.onGround && !this.ponGround)
                    ENTITIES.july.textures.stand.rewind();
            }
        }
    }

    updateV()
    {
        // 施加武器因素到 dv 或 dp
        if (!this.damaged)
            this.weapon.action(this);

        // 施加用户操作因素到 dv 或 dp
        this.userControl();

        // A001.1 施加摩擦力(持续因素)到 dv
        if (this.onGround)
            this.v.x *= CO.usermove.groundFrictionMiu;
        else
            this.v.x *= CO.usermove.airFrictionMiu;
        
        super.updateV();
    }

    userControl()
    {
        if (!this.damaged)
            this.weapon.addedControl(this);

        if (!this.damaged && this.weapon.overridingControl)
            this.weapon.overrideControl(this);
        else
        {
            // 简记
            let maxvx = CO.usermove.maxControlVX;
            let movemiu = CO.usermove.xMoveMiu;

            // Left
            if (keyIsDown(37) || keyIsDown(65))
                this.dv.x -= constrain(maxvx + this.v.x, 0, maxvx) * movemiu;
            // Right
            if (keyIsDown(39) || keyIsDown(68))
                this.dv.x += constrain(maxvx - this.v.x, 0, maxvx) * movemiu;

            // Jump A002
            if (keyIsDown(32))
            {
                let maxf = CO.usermove.jumpMaxFrame;
                let maxv = CO.usermove.jumpMaxVY;
                if (this.onGround && this.spaceHoldFrames == 0)
                {   // 起跳阶段
                    MUSICSOUND.july_jump.play();
                    this.dv.y -= constrain(maxv + this.v.y, 0, maxv) * CO.usermove.jumpDvMiu;
                    this.spaceHoldFrames++;
                }
                else if (this.spaceHoldFrames > 0 && this.spaceHoldFrames < maxf)
                {   // 空中跳跃阶段
                    this.dv.y -= constrain(maxv + this.v.y, 0, maxv) * CO.usermove.jumpDvMiu;
                    this.spaceHoldFrames++;
                }
            }
            else
                this.spaceHoldFrames = 0;
        }
    }

    inflictedDamage(dmg)
    {
        MUSICSOUND.july_hurt.play();
        super.inflictedDamage(dmg);
        this.weapon.rewind();
    }

    renderUpper(camera)
    {
        camera.renderUI(constrain(parseFloat(this.hp/this.maxhp), 0.0, 1.0));
    }

}
