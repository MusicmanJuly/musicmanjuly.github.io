class MAP
{
    constructor(texturePath1, texturePath2, spawnX, spawnY, solidsPath)
    {
        this.spawnX = spawnX;
        this.spawnY = spawnY;

        // this.solids = this.trans(solids);
        this.texture_back = loadImage(texturePath1);
        this.texture_fore = loadImage(texturePath2);

        this.solidmap = loadImage(solidsPath);
    }

    // preload() 完成后，图片加载完成，才能开始分析
    analyzeSolid()
    {
        this.solidmap.loadPixels();
        this.x = this.solidmap.width;
        this.y = this.solidmap.height;
        // console.log(this.x, this.y);

        this.solids = [];
        this.addedsolids = [];
        for (var i=0; i<this.x; i++)
        {
            this.solids[i] = [];
            this.addedsolids[i] = [];
            for (var j=0; j<this.y; j++)
            {
                var r = this.solidmap.pixels[(j * this.x + i) * 4];
                var g = this.solidmap.pixels[(j * this.x + i) * 4 + 1];
                var b = this.solidmap.pixels[(j * this.x + i) * 4 + 2];
                var bw = (r + g + b) / 3.0;
                var a = this.solidmap.pixels[(j * this.x + i) * 4 + 3];
                this.solids[i][j] = ((bw < 127 && a > 127) ? true : false);
                this.addedsolids[i][j] = false;
            }
        }
        
        // console.log(this.solids);
    }

    /*
    trans(array)
    {
        var result = [];
        for (var i=0; i<array[0].length; i++)
        {
            result[i] = [];
            for (var j=0; j<array.length; j++)
            {
                result[i][j] = array[j][i];
            }
        }
        return result;
    }
    */
};

var MAPS = {
    world1: null,
    world2: null,
};

function initMAPS()
{
    MAPS.world1 = new MAP(
        'assets/map/world1_back.png',
        'assets/map/world1_fore.png',
        11, 28.5,
        'assets/map/world1_s.png'
    );
    MAPS.world2 = new MAP(
        'assets/map/world2_back.png',
        'assets/map/world2_fore.png',
        5, 31,
        'assets/map/world2_s.png'
    )
}

function analyzeMAPS()
{
    Object.keys(MAPS).forEach(function analyze(key) {
        MAPS[key].analyzeSolid();
        // console.log("analyzedSolid:" + key);
    })
}