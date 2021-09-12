

class Camera extends Entity
{
    constructor(map, char)
    {
        super('pbcenter', createVector(map.spawnX, map.spawnY))
        this.maxvx = this.maxvy = CO.camera.maxVi
        this.mapCollision = false;
        this.borderCollision = false;
        this.gravity = false;
        this.visible = false;

        this.target = char;

        this.midScreen = CO.display.centerVecter;
        this.fixHorizontal = (map.x * CO.units.pbpx <= CO.display.x);
        this.fixVertical = (map.y * CO.units.pbpx <= CO.display.y);

        // 如果地图尺寸在某方向上小于屏幕尺寸，则锁定该方向
        if (!this.fixHorizontal && !this.fixVertical)
        {
            let luPoint = CO.display.centerVecter;
            let rdPoint = createVector(map.x * CO.units.pbpx, map.y * CO.units.pbpx).sub(CO.display.centerVecter);
            this.setBorder(luPoint.x, rdPoint.x, luPoint.y, rdPoint.y, 0);
        }

        // 锁定的方向上，将镜头中心锁定在地图中心
        if (this.fixHorizontal)
            this.p.x = map.x * CO.units.pbpx / 2;
        if (this.fixVertical)
            this.p.y = map.y * CO.units.pbpx / 2;
        
        this.songInfo = ''
        this.songInfoState = 0; // 0: none, 1: show, 2: fadeout
        this.songInfoShowSpan = 400;
        this.songInfoFadeoutSpan = 200;
        this.songInfoTimer = 0;
    }

    followTarget()
    {
        // 瞬时速度与距离成正比地靠近目标
        let path = this.target.p.copy().sub(this.p.copy());
        this.dp.add(path.mult(CO.camera.vMiu));
    }

    applyDP()
    {
        let prevp = this.p.copy();

        super.applyDP();

        // 强制修改 p.x, p.y
        if (this.fixHorizontal)
        {
            this.p.x = prevp.x;
            this.v.x = 0;
        }
        if (this.fixVertical)
        {
            this.p.y = prevp.y;
            this.v.y = 0;
        }
    }
    
    getOrigin()
    {
        return CO.display.centerVecter.copy().sub(this.p).add(CO.camera.offset);
    }

    renderTexture(texture, l, u, mirrored = false)
    {
        // console.log(texture);
        let o = this.getOrigin();
        let w = texture.images[0].width;
        let x = !mirrored ?
            (l + o.x - texture.centerX) :
            (l + o.x - texture.centerX + w - ((w - texture.centerX) * 2));
        let y = u + o.y - texture.centerY;
        image(texture.get(mirrored), x, y);
    }

    renderCBox(l, u, w, h)
    {
        let o = this.getOrigin();
        push();
        rectMode(CORNER);
        noStroke();
        fill(255, 255, 0, 127);
        rect(l + o.x, u + o.y, w, h);
        pop();
    }

    renderDBox(l, u, w, h)
    {
        let o = this.getOrigin();
        push();
        rectMode(CORNER);
        noStroke();
        fill(255, 0, 0, 127);
        rect(l + o.x, u + o.y, w, h);
        pop();
    }

    renderPoint(x, y)
    {
        let o = this.getOrigin();
        push();
        noStroke();
        fill(0, 0, 255, 32);
        ellipse(x + o.x, y + o.y, 100, 100);
        fill(0, 0, 255, 127);
        ellipse(x + o.x, y + o.y, 10, 10);
        pop();
    }

    renderMapBack(map)
    {
        let o = this.getOrigin();
        image(map.texture_back, o.x, o.y);
    }
    renderMapFore(map)
    {
        let o = this.getOrigin();
        image(map.texture_fore, o.x, o.y);
    }

    renderHPBar(x, y, value)
    {
        let o = this.getOrigin();
        let l = CO.ui.hp_size + CO.ui.hp_sep;

        function drawline(x, y, value)
        {
            let startx = x - l * (value-1) / 2;
            for (var i=0; i<value; i++)
                rect(startx + l * i + o.x, y + o.y, CO.ui.hp_size);
            
        }

        let v = parseInt(value);
        push();
        rectMode(CENTER);
        noStroke();
        fill(247, 12, 17, 255);
        var i=0;
        for (; i<parseInt(v/10); i++)
            drawline(x, y + i * l, 10);
        drawline(x, y + i * l, v % 10);
        pop();
    }

    renderUI(hppercent)
    {
        const BORDER_ = 30;
        const BARW = 400;
        const BARH = 40;

        push();

        // 面
        rectMode(CORNER);
        noStroke();
        fill(247, 200, 214, 20);
        rect(BORDER_, BORDER_, BARW, BARH);
        fill(247, 12, 17, 80);
        rect(BORDER_, BORDER_, BARW * hppercent, BARH);

        // 边
        noFill();
        stroke(58, 20, 20);
        strokeWeight(3);
        let block = parseFloat(BARW)/CO.usermove.maxHP;
        for (var i=0; i<CO.usermove.maxHP; i++)
            rect(BORDER_ +block * i, BORDER_, block, BARH);

        pop();
    }

    setSongInfo(str)
    {
        this.songInfo = str;
        this.songInfoTimer = 0;
        this.songInfoState = 1;
    }

    procesSongInfo()
    {
        // transtate
        if (this.songInfoState == 1 && this.songInfoTimer >= this.songInfoShowSpan)
        {
            this.songInfoState = 2;
            this.songInfoTimer = 0;
        }
        else if (this.songInfoState == 2 && this.songInfoTimer >= this.songInfoFadeoutSpan)
        {
            this.songInfoState = 0;
        }
        this.songInfoTimer++;
    }

    renderUpper()
    {
        // songInfo
        this.procesSongInfo();
        if (this.songInfoState == 1)
        {
            this.renderSongText();
        }
        else if (this.songInfoState == 2)
        {
            this.renderSongText(255 - map(this.songInfoTimer, 0, this.songInfoFadeoutSpan, 0, 255));
        }
    }

    renderSongText(alpha = 255)
    {
        const BORDER = 50;
        push();
        strokeWeight(5);
        stroke(24, 13, 13, alpha);
        fill(233, 211, 211, alpha);
        textSize(20);
        text(this.songInfo, BORDER, CO.display.y - BORDER);
        pop();
    }
}
