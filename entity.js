
class Entity    // 地图上能动的东西
{
    /**
     * @param {string} ptype 
     * @param {Vector} p0 pb
     * @param {Number} hp0 
     * @param {Vector} v0 
     * @param {Number} maxvx0 
     * @param {Number} maxvy0 
     */
    constructor(ptype, p0, hp0 = null, weight = 1.0, maxhp = CO.entity.defaultHP, 
        v0 = CO.vector.zero.copy(),
        maxvx0 = CO.entity.defaultMaxVX, maxvy0 = CO.entity.defaultMaxVY,
        dmgtime = CO.entity.defaultDamagedTime)
    {
        this.id = curEntitiyID++;

        // 连续的性质

        if (ptype == 'pbground')
        {
            this.p = p0.copy().mult(CO.units.pbpx);  // 换算成 px 位置
            {   // 位置矫正
                this.p.x += CO.units.pbpx / 2.0;
                this.p.y = this.p.y + CO.units.pbpx - 1;
            }
        }
        else if (ptype == 'pbcenter')
        {
            this.p = p0.copy().mult(CO.units.pbpx);  // 换算成 px 位置
            {   // 位置矫正 
                this.p.x += CO.units.pbpx / 2;
                this.p.y += CO.units.pbpx / 2;
            }
        }
        else
            this.p = p0;                            // px 位置
        
        this.v = v0;                            // px/frame 速度

        this.maxvx = maxvx0; // vx的最大值(正值)
        this.maxvy = maxvy0; // vy的最大值(正值)

        this.gravity = CO.entity.defaultGravity;    // 受重力作用的大小

        if (hp0 == null)
            this.attackable = false;     // 是否可被应用攻击效果
        else
        {
            this.hp = hp0;              // 生命值
            this.attackable = true;     // 是否可被应用攻击效果
        }
        this.maxhp = maxhp; // 最大hp

        this.weight = weight; // 重量，击飞效果用

        this.damagedSpan = dmgtime;
        this.damaged = 0;     // 是否正在被伤害，以及伤害剩余时间（武器和伤害无效化）

        // 状态相关
        this.basicstate = Entity.STATES.APPEAR;
        this.basictimer = 0;

        this.appearSpan = 0;
        this.deadSpan = 0;
        this.appearAnimation = null;
        this.deadAnimation = null;

        this.isDisposed = false;

        this.cbox = CO.vector.zero.copy();         // 碰撞箱
        this.cboxOffset = CO.vector.zero.copy();   // 碰撞箱偏移

        this.mapCollision = true;     // 是否与地图碰撞
        this.mapCollisionBounceVMin = CO.entity.defaultmapCollisionBounceVMin;    // 与边界相撞产生速度反弹的阈值
        this.mapCollisionBounceMiu = CO.entity.defaultmapCollisionBounceMiu;       // 与边界相撞产生速度反弹的比例
        // 地图碰撞检测的结果，数值代表距离(-1表示过远或无效)
        this.distLeft = -1;
        this.distRight = -1;
        this.distUp = -1;
        this.distDown = -1;
        // 地图检测碰撞的结果，true代表需注意该角方向有方块
        this.warnL = this.warnR = this.warnU = this.warnD = false;
        this.warnLU = this.warnRU = this.warnLD = this.warnRD = false;

        this.borderCollision = false;   // 是否与边界碰撞
        this.borderL = this.borderR = this.borderU = this.borderD = 0;  // 设定的边界
        this.borderBounceMiu = CO.entity.defaultborderBounceMiu;     // 与边界相撞后产生速度反弹的比例

        this.visible = true;        // 实体的可见性
        this.texture = null;        // 实体的贴图 Texture类，(null则只会绘制碰撞箱)

        // ↓也可用于标定角色当前朝向
        this.mirrored = false;      // 是否镜像状态（注意Texture需要支持镜像）

        this.target = null;         // 实体的目标(null表示无目标)

        // 瞬时的性质，每帧应用一次后清零

        this.dv = CO.vector.zero.copy();   // 瞬时施加的 v 变化(瞬时加速度因素)
        this.dp = CO.vector.zero.copy();   // 瞬时施加的 p 变化(瞬时速度因素)
    }

    /**
     * @param {Number} span 
     * @param {Texture} texture 
     */
    setDeadAni(span, texture)
    {
        this.deadSpan = span;
        this.deadAnimation = texture;
        texture.rewind();
        if (this.basicstate == Entity.STATES.DEAD)
            this.setTexture(texture);
    }

    /**
     * @param {Number} span 
     * @param {Texture} texture 
     */
    setAppearAni(span, texture)
    {
        this.appearSpan = span;
        this.appearAnimation = texture;
        if (texture != null)
            texture.rewind();
        if (this.basicstate == Entity.STATES.APPEAR)
            this.setTexture(texture);
    }

    recoverHP(value = null)
    {
        MUSICSOUND.hp_recover.play();
        if (this.basicstate == Entity.STATES.ACTIVE)
        {
            if (value != null)
                this.hp = constrain(this.hp + value, 0, this.maxhp);
            else
                this.hp = this.maxhp;
        }
    }

    // 操纵部分

    // colli 为 Collider 类。
    setCollider(colli)
    {
        this.cbox = colli.cbox;
        this.cboxOffset = colli.cboxOffset;
    }

    setTexture(texture_)
    {
        this.texture = texture_;
    }

    setBorder(l, r, u, d, miu = null)
    {
        this.borderCollision = true;
        this.borderL = l;
        this.borderR = r;
        this.borderU = u;
        this.borderD = d;

        if (miu != null)
            this.borderBounceMiu = miu;
    }

    // 判定部分

    getColli()
    {
        let boxl = this.p.x - this.cbox.x / 2.0 + this.cboxOffset.x;
        let boxr = this.p.x + this.cbox.x / 2.0 + this.cboxOffset.x;
        let boxu = this.p.y - this.cbox.y + this.cboxOffset.y;
        let boxd = this.p.y + this.cboxOffset.y;
        return [boxl, boxr, boxu, boxd];
    }

    updateStatus(map = null)
    {
        // 检查 (l,r,u,d) (包含边界) 内的各点是否均为非刚体
        function checkAllClear(map, l, r, u, d)
        {
            for (let i=l; i<=r; i++)
                if (i >= 0 && i < map.x)
                    for (let j=u; j<=d; j++)
                        if (j >= 0 && j < map.y)
                            if (map.solids[i][j] || map.addedsolids[i][j])
                                return false;
            return true;
        }

        if (this.mapCollision && map != null)
        {
            // 碰撞箱的四边位置
            let colli = this.getColli();
            let boxl = colli[0];
            let boxr = colli[1];
            let boxu = colli[2];
            let boxd = colli[3];

            // 碰撞箱的四边所在地图格索引
            let li = parseInt(boxl / CO.units.pbpx);
            let ri = parseInt(boxr / CO.units.pbpx);
            let uj = parseInt(boxu / CO.units.pbpx);
            let dj = parseInt(boxd / CO.units.pbpx);
            let N = map.x, M = map.y;

            function inRange(i, N)
            {
                return (i >= 0 && i < N);
            }

            function inRange2(i, j, N, M)
            {
                return (i >= 0 && i < N && j >= 0 && j < M);
            }

            this.distLeft = boxl - li*CO.units.pbpx;
            this.distRight = (ri+1)*CO.units.pbpx - boxr;
            this.distUp = boxu - uj*CO.units.pbpx;
            this.distDown = (dj+1)*CO.units.pbpx - boxd;

            this.warnL = (inRange(li-1, N) && !checkAllClear(map, li-1, li-1, uj, dj));
            this.warnR = (inRange(ri+1, N) && !checkAllClear(map, ri+1, ri+1, uj, dj));
            this.warnU = (inRange(uj-1, M) && !checkAllClear(map, li, ri, uj-1, uj-1));
            this.warnD = (inRange(dj+1, M) && !checkAllClear(map, li, ri, dj+1, dj+1));

            this.warnLU = (inRange2(li-1, uj-1, N, M) && (map.solids[li-1][uj-1] || map.addedsolids[li-1][uj-1]));
            this.warnLD = (inRange2(li-1, dj+1, N, M) && (map.solids[li-1][dj+1] || map.addedsolids[li-1][dj+1]));
            this.warnRU = (inRange2(ri+1, uj-1, N, M) && (map.solids[ri+1][uj-1] || map.addedsolids[ri+1][uj-1]));
            this.warnRD = (inRange2(ri+1, dj+1, N, M) && (map.solids[ri+1][dj+1] || map.addedsolids[ri+1][dj+1]));

            // console.log(li, ri, uj, dj)
            // console.log(this.distLeft, this.distRight, this.distUp, this.distDown);
        }

        if (this.damaged > 0)
            this.damaged--;
    }

    toDEAD()
    {
        if (this.basicstate == Entity.STATES.ACTIVE || this.basicstate == Entity.STATES.APPEAR)
        {
            this.basicstate = Entity.STATES.DEAD;
            this.basictimer = 0;
            if (this.deadAnimation != null)
            {
                this.setTexture(this.deadAnimation);
                this.deadAnimation.rewind();
            }
        }
    }

    toDISPOSED()
    {
        this.basicstate = Entity.STATES.DISPOSED;
    }

    transtate()
    {
        // console.log(this, this.basicstate);
        if (this.basicstate == Entity.STATES.APPEAR && this.basictimer >= this.appearSpan)
        {   // APPEAR -> ACTIVE
            this.basicstate = Entity.STATES.ACTIVE;
        }
        else if (this.basicstate == Entity.STATES.ACTIVE && this.hp <= 0)
        {   // ACTIVE -> DEAD
            this.toDEAD();
        }
        else if (this.basicstate == Entity.STATES.DEAD && this.basictimer >= this.deadSpan)
        {   // DEAD -> DISPOSED
            this.toDISPOSED();
        }
        this.basictimer++;
    }

    isDisposed()
    {
        return (this.basicstate == Entity.STATES.DISPOSED);
    }

    // 动作部分

    action(map = null)
    {
        this.transtate();
        if (this.basicstate == Entity.STATES.ACTIVE)
        {
            this.updateStatus(map);
            this.updateV();
            this.updateP();
        }
    }

    updateV()
    {
        // 施加重力(持续因素)到 dv
        if (this.gravity > 0)
            this.dv.y += this.gravity;

        // 施加目标(持续因素)到 dv 和 dp
        if (this.target != null)
            this.followTarget();
        
        this.applyDV();
    }

    applyDV()
    {
        // 应用 dv (瞬时因素) 到 v, 并清空 dv
        this.v.add(this.dv);
        this.dv = CO.vector.zero.copy();
    }

    // 该方法应该把目标因素施加给 dv 或者 dp，每帧都这么做
    followTarget()
    {
    }

    /**
     * @param {DamageArea} dmg 
     */
    checkDamage(dmg)
    {
        let box1 = this.getColli();
        let box2 = dmg.getLRUD();
        return (CO.utility.checkCollapseBox(box1, box2));
    }

    /**
     * @param {DamageArea} dmg 
     */
    inflictedDamage(dmg)
    {
        // console.log('damage!');
        this.hp -= dmg.dmg;
        this.damaged = this.damagedSpan;
        this.dv.x += dmg.dvx / this.weight;
        this.dv.y += dmg.dvy / this.weight;
    }

    updateP()
    {
        // 施加 v (持续因素) 到 dp
        this.dp.add(this.v);

        // 以 maxv 限制 dp 的最大值
        this.dp.x = constrain(this.dp.x, -this.maxvx, this.maxvx);
        this.dp.y = constrain(this.dp.y, -this.maxvy, this.maxvy);

        // 检测并参与地图碰撞
        if (this.mapCollision)
        {
            let reachL = (this.distLeft != -1 && this.dp.x < -this.distLeft);
            let reachR = (this.distRight != -1 && this.dp.x > this.distRight);
            let reachU = (this.distUp != -1 && this.dp.y < -this.distUp);
            let reachD = (this.distDown != -1 && this.dp.y > this.distDown);

            function randTF()
            {
                return (random(0, 1) <= 0.5);
            }

            let completed = false;
            // 四边碰撞
            if (this.warnL && reachL)
            {
                this.mapColliLeft();
                completed = true;
            }
            if (this.warnR && reachR)
            {
                this.mapColliRight();
                completed = true;
            }
            if (this.warnU && reachU)
            {
                this.mapColliUp();
                completed = true;
            }
            if (this.warnD && reachD)
            {
                this.mapColliDown();
                completed = true;
            }

            // 如果四边碰撞都不会发生，再检查四角碰撞
            if (!completed)
            {
                if (this.warnLU && reachL && reachU)
                    randTF() ? this.mapColliLeft() : this.mapColliUp();
                if (this.warnLD && reachL && reachD)
                    randTF() ? this.mapColliLeft() : this.mapColliDown();
                if (this.warnRU && reachR && reachU)
                    randTF() ? this.mapColliRight() : this.mapColliUp();
                if (this.warnRD && reachR && reachD)
                    randTF() ? this.mapColliRight() : this.mapColliDown();
            }
        }

        this.applyDP();
    }

    mapColliLeft()
    {
        this.dp.x = 0;
        this.p.x -= this.distLeft - 0.1;
        this.bounceLeft(this.mapCollisionBounceVMin, this.mapCollisionBounceMiu);
        // console.log('bounceLeft');
    }
    mapColliRight()
    {
        this.dp.x = 0;
        this.p.x += this.distRight - 0.1;
        this.bounceRight(this.mapCollisionBounceVMin, this.mapCollisionBounceMiu);
        // console.log('bounceRight');
    }
    mapColliUp()
    {
        this.dp.y = 0;
        this.p.y -= this.distUp - 0.1;
        this.bounceUp(this.mapCollisionBounceVMin, this.mapCollisionBounceMiu);
        // console.log('bounceUp');
    }
    mapColliDown()
    {
        this.dp.y = 0;
        this.p.y += this.distDown - 0.1;
        this.bounceDown(this.mapCollisionBounceVMin, this.mapCollisionBounceMiu);
        // console.log('bounceDown');
    }

    // 边界/地图碰撞以改变速度的方法。
    // minv是最小弹跳分量阈值，bmiu是弹跳速度阻尼比例系数
    bounceLeft(minv, bmiu)
    {
        if (abs(this.v.x) > minv)
            this.v.x = (abs(this.v.x) - minv) * bmiu;
        else
            this.v.x = 0;
    }
    bounceRight(minv, bmiu)
    {
        if (abs(this.v.x) > minv)
            this.v.x = -(abs(this.v.x) - minv) * bmiu;
        else
            this.v.x = 0;
    }
    bounceUp(minv, bmiu)
    {
        if (abs(this.v.y) > minv)
            this.v.y = (abs(this.v.y) - minv) * bmiu;
        else
            this.v.y = 0;
    }
    bounceDown(minv, bmiu)
    {
        if (abs(this.v.y) > minv)
            this.v.y = -(abs(this.v.y) - minv) * bmiu;
        else
            this.v.y = 0;
    }

    applyDP()
    {
        // 应用 dp (瞬时因素) 到 p, 并清空 dp
        this.p.add(this.dp);
        this.dp = CO.vector.zero.copy();

        // 检测并参与边界碰撞
        if (this.borderCollision)
        {
            if (this.p.x < this.borderL)
            {
                this.p.x = this.borderL + 0.1;
                this.bounceLeft(0, this.borderBounceMiu);
            }
            else if (this.p.x > this.borderR)
            {
                this.p.x = this.borderR - 0.1;
                this.bounceRight(0, this.borderBounceMiu);
            }
            if (this.p.y < this.borderU)
            {
                this.p.y = this.borderU + 0.1;
                this.bounceUp(0, this.borderBounceMiu);
            }
            else if (this.p.y > this.borderD)
            {
                this.p.y = this.borderD - 0.1;
                this.bounceDown(0, this.borderBounceMiu);
            }
        }
    }

    // 渲染部分

    render(camera)
    {
        if (this.visible && this.basicstate != Entity.STATES.DISPOSED)
        {
            if (this.texture != null)
            {
                // 左上角的坐标
                let worldLUX = this.p.x;
                let worldLUY = this.p.y;
                camera.renderTexture(this.texture, worldLUX, worldLUY, this.mirrored);
                // console.log('rendered: ', this.id, worldLUX, worldLUY)
            }
            if (this.texture == null || CO.debug)
            {   // 左上角的坐标
                let worldLUX = this.p.x - this.cbox.x / 2.0 + this.cboxOffset.x;
                let worldLUY = this.p.y - this.cbox.y + this.cboxOffset.y;;
                camera.renderCBox(worldLUX, worldLUY, this.cbox.x, this.cbox.y);
            }
        }
    }

    // HP条等渲染在上方的界面
    renderUpper(camera)
    {
    }

    disposedAction(map)
    {
    }
}

Entity.STATES = {
    APPEAR: 0,
    ACTIVE: 1,
    DEAD: 2,
    DISPOSED: 3,
};

