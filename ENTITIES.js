
class Texture
{
    constructor(pix, piy, texturePath, flippable = false, lastframes = 30)
    {
        this.images = [];
        this.images[0] = loadImage(texturePath);
        this.imagesf = null;

        this.times = [];
        this.times[0] = lastframes;

        this.centerX = pix * CO.units.pipx;     // px
        this.centerY = piy * CO.units.pipx;

        this.nowi = 0;
        this.nowleft = lastframes;

        this.flippable = flippable;
        this.mirror = false;
    }

    add(texturePath, lastframes)
    {
        this.images[this.images.length] = loadImage(texturePath);
        this.times[this.times.length] = lastframes;
    }

    rewind()
    {
        this.nowi = 0;
        this.nowleft = this.times[0];
    }

    get(mirrored = false)
    {
        let resi = this.nowi;
        this.nowleft--;
        if (this.nowleft <= 0)
        {
            this.nowi = (this.nowi + 1) % this.times.length; 
            this.nowleft = this.times[this.nowi];
        }
        let hresult = (this.flippable && mirrored) ? this.imagesf[resi] : this.images[resi];
        return hresult;
    }

    // preload() 完成后，图片加载完成，才能开始分析
    checkAndFlip()
    {
        if (this.flippable)
        {
            this.imagesf = [];
            for (var i=0; i<this.images.length; i++)
            {
                this.imagesf[i] = createImage(this.images[i].width, this.images[i].height);
                
                this.images[i].loadPixels();
                this.imagesf[i].loadPixels();

                this.getflip(this.imagesf[i].pixels,
                    this.images[i].pixels, this.images[i].width, this.images[i].height);

                this.imagesf[i].updatePixels();
            }
        }
    }

    getflip(workspace, pixels, w, h)
    {
        for (var x=0; x<w; x++)
            for (var y=0; y<h; y++)
                for (var k=0; k<4; k++)
                    workspace[(y * w + x) * 4 + k] = 
                        pixels[(y * w + (w-x-1)) * 4 + k];
    }

    flip()
    {
        this.mirror = !this.mirror;
    }

    setMirror(bool)
    {
        this.mirror = bool;
    }
}

class Collider
{
    constructor(cx, cy, ox, oy)
    {
        this.cbox = createVector(cx, cy).mult(CO.units.pipx);   // px
        this.cboxOffset = createVector(ox, oy).mult(CO.units.pipx);
    }
}

var ENTITIES = {
    july: {
        colli: null,
        textures: {
            stand: null,
            run: null,
            jumph: null,
            jumpl: null,
            dagger_s: null,
            dagger_h: null,
            dagger_l: null,
            knife_pre_s: null,
            knife_att: null,
            knife_pre_h: null,
            knife_pre_l: null,
            knife_cri_p: null,
            knife_cri: null,
            dmgd0: null,
            dmgd: null,
            dmgd_run: null,
            dmgd_jumph: null,
            dmgd_jumpl: null,
            dead: null,
            awake: null,
            get_knife: null,
        },
        jumpHThres: 3.0,
        jumpLThres: 4.8,
        moveXThres: 2.0,
        turnXThres: 1.0,
        damagedSwitchingFrames: 5,
        deadSpan: 84,
        appearSpan: 140,
    },

    slime: {
        colli: null,
        textures: {
            stand: null,
            prejump: null,
            jump: null,
            dead: null,
        },
        hp: 8,
        atk: 1,
        dmgtime: 30,
        deadSpan: 42,
        weight: 0.8,
        airFrictionMiu: 0.9,
        groundFrictionMiu: 0.5,
    },

    niu: {
        colli: null,
        textures: {
            appear: null,
            approach: null,
            hit_free: null,
            hit_keep: null,
            dead: null,
        },
        hp: 16,
        atk: 1.5,
        critMiu: 1.0,
        dmgtime: 40,
        appearSpan: 220,
        deadSpan: 250,
        weight: 4.0,
        airFrictionMiu: 0.82,
        groundFrictionMiu: 0.94,
    },

    zombie: {
        colli: null,
        textures: {
            stand: null,
            walk: null,
            dead: null,
        },
        hp: 12,
        atk: 2,
        critMiu: 1.0,
        dmgtime: 40,
        walkamiu: 0.08,
        deadSpan: 120,
        weight: 1.5,
        groundFrictionMiu: 0.86,
    },
};

function initENTITIES()
{
    function ch(str)
    {
        return 'assets/chara/' + str + '.png';
    }

    function mo(str)
    {
        return 'assets/mobs/' + str + '.png';
    }
    
    // July
    ENTITIES.july.colli = new Collider(10, 22, 0, 0);

    ENTITIES.july.textures.stand = new Texture(32, 64, ch('j1'), true, 60);
    ENTITIES.july.textures.stand.add(ch('j2'), 30);

    ENTITIES.july.textures.run = new Texture(32, 64, ch('j4'), true, 10);
    ENTITIES.july.textures.run.add(ch('j5'), 5);
    ENTITIES.july.textures.run.add(ch('j6'), 10);
    ENTITIES.july.textures.run.add(ch('j7'), 5);

    ENTITIES.july.textures.jumph = new Texture(32, 64, ch('j9'), true);
    ENTITIES.july.textures.jumpl = new Texture(32, 64, ch('j10'), true);

    ENTITIES.july.textures.dagger_s = new Texture(32, 64, ch('j12'), true);
    ENTITIES.july.textures.dagger_h = new Texture(32, 64, ch('j13'), true);
    ENTITIES.july.textures.dagger_l = new Texture(32, 64, ch('j14'), true);

    ENTITIES.july.textures.knife_pre_s = new Texture(32, 64, ch('j16'), true);
    ENTITIES.july.textures.knife_att = new Texture(32, 64, ch('j17'), true);
    ENTITIES.july.textures.knife_pre_h = new Texture(32, 64, ch('j18'), true);
    ENTITIES.july.textures.knife_pre_l = new Texture(32, 64, ch('j19'), true);
    ENTITIES.july.textures.knife_cri_p = new Texture(32, 64, ch('j20'), true, 4);  
    ENTITIES.july.textures.knife_cri_p.add(ch('j21'), 4);
    ENTITIES.july.textures.knife_cri = new Texture(32, 64, ch('j22'), true, 18);  
    ENTITIES.july.textures.knife_cri.add(ch('j23'), 8);
    ENTITIES.july.textures.knife_cri.add(ch('j24'), 8);
    ENTITIES.july.textures.knife_cri.add(ch('j25'), 8);
    ENTITIES.july.textures.knife_cri.add(ch('j26'), 8);

    ENTITIES.july.textures.dmgd0 = new Texture(32, 64, ch('j28'), true);
    ENTITIES.july.textures.dmgd = new Texture(32, 64, ch('j29'), true);
    ENTITIES.july.textures.dmgd_run = new Texture(32, 64, ch('j30'), true, 10);
    ENTITIES.july.textures.dmgd_run.add(ch('j31'), 5);
    ENTITIES.july.textures.dmgd_run.add(ch('j32'), 10);
    ENTITIES.july.textures.dmgd_run.add(ch('j33'), 5);
    ENTITIES.july.textures.dmgd_jumph = new Texture(32, 64, ch('j34'), true);
    ENTITIES.july.textures.dmgd_jumpl = new Texture(32, 64, ch('j35'), true);

    ENTITIES.july.textures.dead = new Texture(32, 64, ch('j37'), true, 6);
    ENTITIES.july.textures.dead.add(ch('j38'), 6);
    ENTITIES.july.textures.dead.add(ch('j39'), 6);
    ENTITIES.july.textures.dead.add(ch('j40'), 6);
    ENTITIES.july.textures.dead.add(ch('j41'), 6);
    ENTITIES.july.textures.dead.add(ch('j42'), 6);
    ENTITIES.july.textures.dead.add(ch('j43'), 6);
    ENTITIES.july.textures.dead.add(ch('j44'), 6);
    ENTITIES.july.textures.dead.add(ch('j45'), 6);
    ENTITIES.july.textures.dead.add(ch('j46'), 6);
    ENTITIES.july.textures.dead.add(ch('j47'), 6);
    ENTITIES.july.textures.dead.add(ch('j48'), 6);
    ENTITIES.july.textures.dead.add(ch('j49'), 6);
    ENTITIES.july.textures.dead.add(ch('j50'), 6);

    ENTITIES.july.textures.awake = new Texture(32, 64, ch('j52'), true, 60);
    ENTITIES.july.textures.awake.add(ch('j53'), 10);
    ENTITIES.july.textures.awake.add(ch('j54'), 10);
    ENTITIES.july.textures.awake.add(ch('j55'), 60);

    ENTITIES.july.textures.get_knife = new Texture(32, 64, ch('j58'), true, 10);
    ENTITIES.july.textures.get_knife.add(ch('j59'), 10);
    ENTITIES.july.textures.get_knife.add(ch('j60'), 10);
    ENTITIES.july.textures.get_knife.add(ch('j61'), 10);
    ENTITIES.july.textures.get_knife.add(ch('j62'), 10);
    ENTITIES.july.textures.get_knife.add(ch('j63'), 10);
    ENTITIES.july.textures.get_knife.add(ch('j64'), 10);

    // Slime
    ENTITIES.slime.colli = new Collider(14, 10, 0, -3);
    
    ENTITIES.slime.textures.stand = new Texture(8, 16, mo('slime1'), false, 16);
    ENTITIES.slime.textures.stand.add(mo('slime2'), 16);
    ENTITIES.slime.textures.stand.add(mo('slime3'), 16);

    ENTITIES.slime.textures.prejump = new Texture(8, 16, mo('slime6'), false);

    ENTITIES.slime.textures.jump = new Texture(8, 16, mo('slime8'), false, 16);
    ENTITIES.slime.textures.jump.add(mo('slime9'), 16);

    ENTITIES.slime.textures.dead = new Texture(8, 16, mo('slime11'), false, 6);
    ENTITIES.slime.textures.dead.add(mo('slime12'), 6);
    ENTITIES.slime.textures.dead.add(mo('slime13'), 6);
    ENTITIES.slime.textures.dead.add(mo('slime14'), 6);
    ENTITIES.slime.textures.dead.add(mo('slime15'), 6);
    ENTITIES.slime.textures.dead.add(mo('slime16'), 6);
    ENTITIES.slime.textures.dead.add(mo('slime17'), 6);

    // Niu
    ENTITIES.niu.colli = new Collider(21, 30, 0, 0);

    ENTITIES.niu.textures.appear = new Texture(22, 40, mo('niu1'), true, 20);
    ENTITIES.niu.textures.appear.add(mo('niu2'), 20);
    ENTITIES.niu.textures.appear.add(mo('niu3'), 20);
    ENTITIES.niu.textures.appear.add(mo('niu4'), 60);
    ENTITIES.niu.textures.appear.add(mo('niu5'), 20);
    ENTITIES.niu.textures.appear.add(mo('niu2'), 10);
    ENTITIES.niu.textures.appear.add(mo('niu5'), 20);
    ENTITIES.niu.textures.appear.add(mo('niu2'), 60);

    ENTITIES.niu.textures.approach = new Texture(22, 40, mo('niu1'), true, 9);
    ENTITIES.niu.textures.approach.add(mo('niu2'), 9);
    ENTITIES.niu.textures.approach.add(mo('niu3'), 9);
    ENTITIES.niu.textures.approach.add(mo('niu4'), 9);

    ENTITIES.niu.textures.hit_keep = new Texture(22, 40, mo('niu5'), true, 9);
    ENTITIES.niu.textures.hit_free = new Texture(22, 40, mo('niu1'), true, 9);

    ENTITIES.niu.textures.dead = new Texture(22, 40, mo('niu7'), true, 4);
    ENTITIES.niu.textures.dead.add(mo('niu8'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu9'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu10'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu11'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu12'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu13'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu14'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu15'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu16'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu17'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu18'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu19'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu20'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu21'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu22'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu23'), 4);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 30);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 10);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 25);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 15);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 20);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 20);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 15);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 25);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 10);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 30);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 5);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 35);
    ENTITIES.niu.textures.dead.add(mo('niu24'), 5);
    ENTITIES.niu.textures.dead.add(mo('niu25'), 40);

    // Zombie
    ENTITIES.zombie.colli = new Collider(8, 23, 0, 0);

    ENTITIES.zombie.textures.stand = new Texture(8, 24, mo('zombie1'), true);
 
    ENTITIES.zombie.textures.walk = new Texture(8, 24, mo('zombie3'), true, 10);
    ENTITIES.zombie.textures.walk.add(mo('zombie4'), 20);
    ENTITIES.zombie.textures.walk.add(mo('zombie5'), 20);
    ENTITIES.zombie.textures.walk.add(mo('zombie6'), 20);
    ENTITIES.zombie.textures.walk.add(mo('zombie7'), 20);

    ENTITIES.zombie.textures.dead = new Texture(8, 24, mo('zombie9'), true, 10);
    ENTITIES.zombie.textures.dead.add(mo('zombie10'), 20);
    ENTITIES.zombie.textures.dead.add(mo('zombie11'), 20);
    ENTITIES.zombie.textures.dead.add(mo('zombie12'), 20);
    ENTITIES.zombie.textures.dead.add(mo('zombie13'), 20);
    ENTITIES.zombie.textures.dead.add(mo('zombie14'), 20);
    ENTITIES.zombie.textures.dead.add(mo('zombie15'), 20);
}

function analyzeENTITIES()
{
    Object.keys(ENTITIES.july.textures).forEach(function analyze(key) {
        ENTITIES.july.textures[key].checkAndFlip();
        // console.log("flipped:" + key);
    });

    Object.keys(ENTITIES.niu.textures).forEach(function analyze(key) {
        ENTITIES.niu.textures[key].checkAndFlip();
        // console.log("flipped:" + key);
    });

    Object.keys(ENTITIES.zombie.textures).forEach(function analyze(key) {
        ENTITIES.zombie.textures[key].checkAndFlip();
        // console.log("flipped:" + key);
    });

    Object.keys(DISPLAYS.barricade).forEach(function analyze(key) {
        DISPLAYS.barricade[key].checkAndFlip();
        // console.log("flipped:" + key);
    });
}

var DISPLAYS = {
    knife: {
        on: null,
        off: null,
    },
    sofa: {
        grey: null,
        yellow: null,
    },
    barricade: {
        on: null,
        dead: null,
    },
    hidewall1: {
        hide: null,
        fadeout: null,
        show: null,
        fadein: null,
    },
    hpbottle: {
        main: null,
    },
    killergear: {
        main: null,
        fast: null,
    },
    floorpad: {
        main: null,
    },
    key: {
        main: null,
    },
    chest: {
        closed: null,
    },
    jade: {
        left: null,
        right: null,
    },
    bomb: {
        main: null,
        boom: null,
    },
    paddoor: {
        off: null,
        on: null,
    },
    gate: {
        off: null,
        left: null,
        right: null,
        full: null,
        move: null,
    },
}

function initDISPLAYS()
{
    function dis(str)
    {
        return 'assets/display/' + str + '.png';
    }

    function map(str)
    {
        return 'assets/map/' + str + '.png';
    }

    DISPLAYS.knife.on = new Texture(8, 16, dis('knife1'), false, 40);
    DISPLAYS.knife.on.add(dis('knife2'), 20);
    DISPLAYS.knife.on.add(dis('knife3'), 60);
    DISPLAYS.knife.off = new Texture(8, 16, dis('knife5'), false);

    DISPLAYS.sofa.grey = new Texture(32, 16, dis('sofa1'), false);
    DISPLAYS.sofa.yellow = new Texture(32, 16, dis('sofa2'), false);

    DISPLAYS.barricade.on = new Texture(8, 16*8, dis('barri1'), true, 20);
    DISPLAYS.barricade.on.add(dis('barri3'), 30);
    DISPLAYS.barricade.on.add(dis('barri3'), 20);
    DISPLAYS.barricade.on.add(dis('barri4'), 10);
    DISPLAYS.barricade.on.add(dis('barri5'), 30);
    DISPLAYS.barricade.on.add(dis('barri6'), 20);
    DISPLAYS.barricade.on.add(dis('barri7'), 30);
    DISPLAYS.barricade.on.add(dis('barri8'), 20);
    DISPLAYS.barricade.on.add(dis('barri9'), 20);
    DISPLAYS.barricade.on.add(dis('barri10'), 10);
    DISPLAYS.barricade.on.add(dis('barri11'), 20);
    DISPLAYS.barricade.dead = new Texture(8, 16*8, dis('barri12'), true, 30);
    DISPLAYS.barricade.dead.add(dis('barri13'), 30);
    DISPLAYS.barricade.dead.add(dis('barri14'), 20);
    DISPLAYS.barricade.dead.add(dis('barri15'), 10);
    DISPLAYS.barricade.dead.add(dis('barri16'), 10);
    DISPLAYS.barricade.dead.add(dis('barri17'), 10);

    DISPLAYS.hpbottle.main = new Texture(8, 16, dis('hpbottle1'), false, 24);
    DISPLAYS.hpbottle.main.add(dis('hpbottle2'), 16);
    DISPLAYS.hpbottle.main.add(dis('hpbottle3'), 14);
    DISPLAYS.hpbottle.main.add(dis('hpbottle4'), 12);
    DISPLAYS.hpbottle.main.add(dis('hpbottle5'), 14);
    DISPLAYS.hpbottle.main.add(dis('hpbottle6'), 16);

    DISPLAYS.killergear.main = new Texture(8, 8, dis('killergear1'), false, 2);
    DISPLAYS.killergear.main.add(dis('killergear2'), 2);
    DISPLAYS.killergear.main.add(dis('killergear3'), 2);
    DISPLAYS.killergear.main.add(dis('killergear4'), 2);
    DISPLAYS.killergear.fast = new Texture(8, 8, dis('killergear1'), false, 1);
    DISPLAYS.killergear.fast.add(dis('killergear2'), 1);
    DISPLAYS.killergear.fast.add(dis('killergear3'), 1);
    DISPLAYS.killergear.fast.add(dis('killergear4'), 1);

    DISPLAYS.floorpad.main = new Texture(20, 16, dis('floorpad'), false);

    DISPLAYS.key.main = new Texture(8, 8, dis('key'), false);

    DISPLAYS.chest.closed = new Texture(8, 16, dis('chest_closed'), false);

    DISPLAYS.jade.left = new Texture(8, 8, dis('jade_left'), false);
    DISPLAYS.jade.right = new Texture(8, 8, dis('jade_right'), false);

    DISPLAYS.bomb.main = new Texture(16, 16, dis('bomb1'), false);
    DISPLAYS.bomb.boom = new Texture(16, 16, dis('bomb3'), false, 10);
    DISPLAYS.bomb.boom.add(dis('bomb2'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb3'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb2'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb3'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb2'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb3'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb2'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb3'), 10);
    DISPLAYS.bomb.boom.add(dis('bomb2'), 10);

    DISPLAYS.paddoor.off = new Texture(16, 64, dis('paddoor2'), false);
    DISPLAYS.paddoor.on = new Texture(16, 64, dis('paddoor1'), false);

    DISPLAYS.gate.off = new Texture(48, 128, dis('gate1'), false);
    DISPLAYS.gate.left = new Texture(48, 128, dis('gate2'), false);
    DISPLAYS.gate.right = new Texture(48, 128, dis('gate3'), false);
    DISPLAYS.gate.full = new Texture(48, 128, dis('gate4'), false);
    DISPLAYS.gate.move = new Texture(48, 128, dis('gate6'), false, 2);
    DISPLAYS.gate.move.add(dis('gate7'), 2);
    DISPLAYS.gate.move.add(dis('gate8'), 2);
    DISPLAYS.gate.move.add(dis('gate9'), 2);
    DISPLAYS.gate.move.add(dis('gate10'), 2);
    DISPLAYS.gate.move.add(dis('gate11'), 2);
    DISPLAYS.gate.move.add(dis('gate12'), 2);
    DISPLAYS.gate.move.add(dis('gate13'), 2);
    DISPLAYS.gate.move.add(dis('gate14'), 2);
    DISPLAYS.gate.move.add(dis('gate15'), 2);
    DISPLAYS.gate.move.add(dis('gate16'), 2);
    DISPLAYS.gate.move.add(dis('gate17'), 2);
    DISPLAYS.gate.move.add(dis('gate18'), 2);
    DISPLAYS.gate.move.add(dis('gate19'), 2);
    DISPLAYS.gate.move.add(dis('gate20'), 2);
    DISPLAYS.gate.move.add(dis('gate21'), 2);
    DISPLAYS.gate.move.add(dis('gate22'), 2);
    DISPLAYS.gate.move.add(dis('gate23'), 2);
    DISPLAYS.gate.move.add(dis('gate24'), 2);
    DISPLAYS.gate.move.add(dis('gate25'), 2);
    DISPLAYS.gate.move.add(dis('gate26'), 2);
    DISPLAYS.gate.move.add(dis('gate27'), 2);
    DISPLAYS.gate.move.add(dis('gate28'), 2);
    DISPLAYS.gate.move.add(dis('gate29'), 2);
    DISPLAYS.gate.move.add(dis('gate30'), 2);
    DISPLAYS.gate.move.add(dis('gate31'), 10);   // total 50

}
