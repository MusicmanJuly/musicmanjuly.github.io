
var CO = {

    debug: true,

    display: {
        x: 1600,    // px
        y: 900,     // px
        xpi: 400,
        ypi: 225,
        xpb: 50,
        ypb: 28.125,
        framerate: 60,
        fullVector: null,
        centerVecter: null,
    },

    units: {
        // px: 最终呈现在屏幕上的像素
        // pi: 画图时的像格，1pi = 4px
        // pb: 地图格, 1pb = 8pi
        pipx: 4,
        pbpi: 8,
        pbpx: 4 * 8,
    },

    entity: {
        defaultGravity: 0.4,
        defaultHP: 10,
        defaultMaxVX: 30,    // 30px, 7.5pi
        defaultMaxVY: 30,    // 30px, 7.5pi
        defaultmapCollisionBounceVMin: 4.0,
        defaultmapCollisionBounceMiu: 0.8,
        defaultborderBounceMiu: 0.6,
        defaultDamagedTime: 100,
    },

    usermove: {
        maxHP: 10,
        initHP: 6,
        mapCollibounceVMin: 16.0,
        mapCollibounceMiu: 0.6,
        groundFrictionMiu: 0.86,
        airFrictionMiu: 0.86,
        maxControlVX: 30,
        xMoveMiu: 0.02,
        jumpMaxVY: 11,
        jumpDvMiu: 0.2,
        jumpMaxFrame: 11,
    },

    vector: {
        zero: null,
        i: null,   
        j: null,
    },

    camera: {
        maxVi: 40,
        vMiu: 0.02,
        offset: null,
    },

    utility: {
        checkCollapse: function(l1, r1, u1, d1, l2, r2, u2, d2)
        {
            return !(
                (r2 < l1) || (l2 > r1) || (d2 < u1) || (u2 > d1)
            );
        },

        checkCollapseBox: function(box1, box2)
        {
            return CO.utility.checkCollapse(box1[0], box1[1], box1[2], box1[3], box2[0], box2[1], box2[2], box2[3]);
        },

        isin: function(p, region)
        {
            return (p.x >= region[0] && p.x <= region[1] &&
                p.y >= region[2] && p.y <= region[3]);
        },

        boxmul: function (box, mul)
        {
            return [box[0]*mul, box[1]*mul, box[2]*mul, box[3]*mul];
        },
    },

    ui: {
        hp_size: 6,
        hp_sep: 3,
        hp_line: 10,
    }
};

function initCO()
{
    initDisplay();
    initVector();
    initCamera();

    function initDisplay()
    {
        CO.display.fullVector = createVector(CO.display.x, CO.display.y);
        CO.display.centerVecter = CO.display.fullVector.copy().mult(0.5);
    }

    function initVector()
    {
        CO.vector.zero = createVector(0, 0);
        CO.vector.i = createVector(1, 0);
        CO.vector.j = createVector(0, 1);
    }

    function initCamera()
    {
        CO.camera.offset = createVector(0, 0);
    }

}