class Weapon
{
    /**
     * @param {String} name 
     * @param {Number} atk 
     * @param {Number} critMiu 
     */
    constructor(name, atk = 0.0, critMiu = 1.0)
    {
        this.name = name;
        this.willOverrideTexture = false;   // 会不会接管材质
        this.willOverrideControl = false;   // 会不会接管操作

        this.atk = atk;
        this.critMiu = critMiu;

        // 是否正接管材质
        this.overridingTexture = false;
        // 是否正接管材质
        this.overridingControl = false;
    }

    /**
     * @param {String} str 
     */
    nameIs(str)
    {
        return (this.name == str);
    }

    /**
     * @param {Character} chara 
     */
    action(chara)
    {
    }

    // 接管材质，仅在this.overridingTexture 启用时有用
    /**
     * @param {Character} chara 
     */
    overrideTexture(chara)
    {
    }

    // 覆盖控制，仅在 this.overridingControl 启用时有用
    /**
     * @param {Character} chara 
     */
    overrideControl(chara)
    {
    }

    // 增加控制，增加控制始终会在 覆盖控制/原控制 之前进行
    /**
     * @param {Character} chara 
     */
    addedControl(chara)
    {
    }

    // 收到伤害等时马上停止活动并还原状态
    rewind()
    {
    }
}

class DamageArea
{
    // 注意构造函数会自动把自己加到damageAreas里面
    /**
     * @param {Number} dmg 
     * @param {Number} chx in px 人物位置
     * @param {Number} chy in px 人物位置
     * @param {Number} cenx in pi 锚点在区域的位置 X
     * @param {Number} ceny in pi 锚点在区域的位置 Y
     * @param {Number} x in pi 区域锚点对人物锚点的位置 X
     * @param {Number} y in pi 区域锚点对人物锚点的位置 Y
     * @param {Number} w in pi 区域的大小 W
     * @param {Number} h in pi 区域的大小 H
     * @param {Number} dvx 
     * @param {Number} dvy 
     * @param {Number[]} imtargetIDs
     * @param {boolean} mirror 
     * @param {Number} span 
     */
    constructor(damageAreas, dmg, chx, chy, cenx, ceny, x, y, w, h, dvx, dvy, imtargetIDs, mirror = false, span = 1)
    {
        if (mirror)
        {
            cenx = w - cenx;
            x = -x;
            dvx = -dvx;
        }

        damageAreas[damageAreas.length] = this;
        this.dmg = dmg;
        this.span = span;
        this.cenx = cenx * CO.units.pipx;
        this.ceny = ceny * CO.units.pipx;
        this.x = chx + x * CO.units.pipx;
        this.y = chy + y * CO.units.pipx;
        this.w = w * CO.units.pipx;
        this.h = h * CO.units.pipx;
        this.dvx = dvx;
        this.dvy = dvy;

        // 无效对象
        this.imtargetIDs = imtargetIDs;

        this.isDisposed = false;
    }

    action(entities)
    {
        for (var i=0; i<entities.length; i++)
        {
            if (entities[i].attackable &&
                entities[i].basicstate == Entity.STATES.ACTIVE &&
                !entities[i].damaged && 
                entities[i].checkDamage(this) &&
                this.imtargetIDs.indexOf(entities[i].id) == -1
                )
                entities[i].inflictedDamage(this);
        }

        this.checkDisposal();
    }

    checkDisposal()
    {
        this.span--;
        if (this.span <= 0)
            this.isDisposed = true;
    }

    getLRUD()
    {
        let res = [];
        res[0] = this.x - this.cenx;
        res[1] = res[0] + this.w;
        res[2] = this.y - this.ceny;
        res[3] = res[2] + this.h;
        return res;
    }

    /**
     * @param {Camera} camera 
     */
    debugShow(camera)
    {
        camera.renderDBox(this.x - this.cenx, this.y - this.ceny, this.w, this.h);
    }
}

class W_Dagger extends Weapon
{
    constructor()
    {
        super('dagger', 1.0, 1.0);

        // true 表示处于 STAB 状态
        // false 表示处于 FREE 状态
        this.stab = false;
        this.minStabTime = 30;
        this.stabtime = 0;

        this.willOverrideControl = true;
        this.willOverrideTexture = true;
    }

    /**
     * @param {Character} chara 
     */
    action(chara)
    {
        if (this.stab)
        {   // STAB
            let dmga = new DamageArea(dmgs, this.atk, chara.p.x, chara.p.y, 0, 2.5, 8, -7.5, 7, 5, 5, -2    ,
                [chara.id], chara.mirrored);
            this.stabtime++;
        }
    }

    /**
     * @param {Character} chara 
     */
    addedControl(chara)
    {
        if (!this.stab && mouseIsPressed && !pmouseIsPressed)
        {   // FREE -> STAB
            // console.log('free -> stab');
            MUSICSOUND.dagger.play();
            this.stabtime = 0;
            this.stab = true;
            this.overridingControl = true;
            this.overridingTexture = true;
        }
        else if (this.stab && this.stabtime >= this.minStabTime && !mouseIsPressed)
        {   // STAB -> FREE
            // console.log('stab -> free');
            this.stab = false;
            this.overridingControl = false;
            this.overridingTexture = false;
        }
    }

    /**
     * @param {Character} chara 
     */
    overrideControl(chara)
    {   // 什么都不能做
    }

    /**
     * @param {Character} chara 
     */
    overrideTexture(chara)
    {
        if (this.stab)
        {
            if (chara.goingUp)   // 空中运动
                chara.setTexture(ENTITIES.july.textures.dagger_h);
            else if (chara.goingDown)
                chara.setTexture(ENTITIES.july.textures.dagger_l);
            else
                chara.setTexture(ENTITIES.july.textures.dagger_s);
        }
    }

    rewind()
    {   // set FREE
        this.stab = false;
        this.overridingControl = false;
        this.overridingTexture = false;
    }
}

class W_Knife extends Weapon
{
    constructor()
    {
        super('knife', 2.0, 1.5);

        this.state = W_Knife.STATES.FREE;
        this.timer = 0;

        this.willOverrideControl = true;
        this.willOverrideTexture = true;
    }

    isState(value)
    {
        return (this.state == value);
    }

    action(chara)
    {
        if (this.isState(W_Knife.STATES.ATK))
        {   // ATK
            let dmga = new DamageArea(dmgs, this.atk, chara.p.x, chara.p.y, 0, 12, 6, -5, 12, 12, 10, -3,
                [chara.id], chara.mirrored);
        }
        else if (this.isState(W_Knife.STATES.CRIT))
        {   // CRIT
            let dmga = new DamageArea(dmgs, this.atk * this.critMiu, chara.p.x, chara.p.y, 0, 19, 6, 0, 12, 19, 16, -20,
                [chara.id], chara.mirrored);
        }
    }

    /**
     * @param {Character} chara 
     */
    addedControl(chara)
    {
        if (this.isState(W_Knife.STATES.FREE) && mouseIsPressed && !pmouseIsPressed)
        {   // FREE -> PRE
            // console.log('FREE -> PRE');
            this.state = W_Knife.STATES.PRE;
            this.timer = 0;
            this.overridingControl = true;
            this.overridingTexture = true;
        }
        else if (this.isState(W_Knife.STATES.PRE) && this.timer >= W_Knife.PRE_MIN && chara.onGround)
        {   // PRE -> ATK
            // console.log('PRE -> ATK');
            MUSICSOUND.knife.play();
            this.state = W_Knife.STATES.ATK;
            this.timer = 0;
        }
        else if (this.isState(W_Knife.STATES.PRE) && chara.fallingTime >= W_Knife.CRIT_FALLMIN && !chara.onGround)
        {   // PRE -> PRE_CRIT
            // console.log('PRE -> PRE_CRIT');
            this.state = W_Knife.STATES.PRE_CRIT;
            this.timer = 0;
        }
        else if (this.isState(W_Knife.STATES.PRE_CRIT) && chara.onGround)
        {   // PRE_CRIT -> CRIT
            // console.log('PRE_CRIT -> CRIT');
            MUSICSOUND.knifecrit.play();
            this.state = W_Knife.STATES.CRIT;
            this.timer = 0;
        }
        else if (this.isState(W_Knife.STATES.ATK) && this.timer >= W_Knife.ATK_ANI)
        {   // ATK -> FREE
            // console.log('ATK -> FREE');
            this.state = W_Knife.STATES.FREE;
            this.overridingControl = false;
            this.overridingTexture = false;
        }
        else if (this.isState(W_Knife.STATES.CRIT) && this.timer >= W_Knife.CRIT_ANI)
        {   // CRIT -> FREE
            // console.log('CRIT -> FREE');
            this.state = W_Knife.STATES.FREE;
            this.overridingControl = false;
            this.overridingTexture = false;
        }
        this.timer++;
    }

    /**
     * @param {Character} chara 
     */
     overrideControl(chara)
     {   // 什么都不能做
     }

    /**
     * @param {Character} chara 
     */
     overrideTexture(chara)
     {
        if (this.isState(W_Knife.STATES.PRE))
        {
            if (chara.goingUp)   // 空中运动
                chara.setTexture(ENTITIES.july.textures.knife_pre_h);
            else if (chara.goingDown)
                chara.setTexture(ENTITIES.july.textures.knife_pre_l);
            else
                chara.setTexture(ENTITIES.july.textures.knife_pre_s);
        }
        else if (this.isState(W_Knife.STATES.ATK))
            chara.setTexture(ENTITIES.july.textures.knife_att);
        else if (this.isState(W_Knife.STATES.PRE_CRIT))
            chara.setTexture(ENTITIES.july.textures.knife_cri_p);
        else if (this.isState(W_Knife.STATES.CRIT))
        {
            chara.setTexture(ENTITIES.july.textures.knife_cri);
            if (this.timer == 0)
                ENTITIES.july.textures.knife_cri.rewind();
        }
     }

    rewind()
    {   // set FREE
        this.state = W_Knife.STATES.FREE;
        this.overridingControl = false;
        this.overridingTexture = false;
    }
}
W_Knife.STATES = {
    FREE: 0,
    PRE: 1,
    ATK: 2,
    PRE_CRIT: 3,
    CRIT: 4,
};
// 时间常量
W_Knife.PRE_MIN = 20;
W_Knife.ATK_ANI = 30;
W_Knife.CRIT_FALLMIN = 27;
W_Knife.CRIT_ANI = 50;



