
var MUSICSOUND = {
    get: null,
    july_jump: null,
    july_hurt: null,
    knife: null,
    knifecrit: null,
    dagger: null,
    slime_hurt: null,
    hp_recover: null,
    boom: null,

    bgm_world1: null,
    bgm_world2: null,
    bgm_boss1: null,
}

var musicPlaying = null;

function initMusicSound()
{
    function m(str)
    {
        return loadSound('assets/music/' + str);
    }
    function s(str)
    {
        return loadSound('assets/sounds/' + str);
    }

    MUSICSOUND.get = s('get.wav');
    MUSICSOUND.july_jump = s('july_jump.wav');
    MUSICSOUND.july_hurt = s('july_hurt.wav');
    MUSICSOUND.knife = s('knife.WAV');
    MUSICSOUND.knifecrit = s('knifecrit.wav');
    MUSICSOUND.dagger = s('dagger.wav');
    MUSICSOUND.slime_hurt = s('slime_hurt.wav');
    MUSICSOUND.hp_recover = s('hp_recover.wav');
    MUSICSOUND.boom = s('boom.wav');

    MUSICSOUND.bgm_world1 = m('bgm_world1.mp3');
    MUSICSOUND.bgm_world2 = m('bgm_world2.mp3');
    MUSICSOUND.bgm_boss1 = m('bgm_boss1.mp3');
}

function musicTo(music = null, camera = null, name = "", volumn = 0.3)
{
    if (musicPlaying != null)
    {
        console.log(musicPlaying);
        musicPlaying.setVolume(0, 2.0);
        musicPlaying.stop(2.2);
    }

    if (music != null)
    {
        musicPlaying = music;
        musicPlaying.play(2.5);
        musicPlaying.setVolume(volumn);
        musicPlaying.loop(2.5);
    }
    else
        musicPlaying = null;
    
    if (camera != null && name != '')
        camera.setSongInfo(name);
}

