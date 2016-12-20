const { ipcRenderer } = require('electron');
var stage,
    scale = 2,
    spriteImages = [],
    slime,
    stats = ipcRenderer.sendSync('loadSlime');

function poke() {
    if (!stats.doJump && slime.currentAnimation !== 'jump') {
        stats.doJump = true;
        stats.hunger -= 10;
    }
}

function feed() {
    if (!stats.doEat && slime.currentAnimation !== 'eat') {
        stats.doEat = true;
        stats.hunger += 20;
        stats.awake = true;

        if (stats.hunger < 120) {
            stats.happiness += 20;
        }
        else {
            stats.happiness -= 10;
        }
    }
}

function init() {
    stage = new createjs.Stage('playground');
    stage.enableMouseOver();

    var groundImg = new Image();

    groundImg.src = 'assets/ground.png';
    groundImg.onload = (e) => {
        var ground = new createjs.Bitmap(groundImg);

        ground.scaleX = scale;
        ground.scaleY = scale;
        stage.addChild(ground);
    };

    var feedImg = new Image();

    feedImg.src = 'assets/feed.png';
    feedImg.onload = (e) => {
        var feedBitmap = new createjs.Bitmap(feedImg);

        feedBitmap.scaleX = scale;
        feedBitmap.scaleY = scale;
        feedBitmap.on('click', feed);
        feedBitmap.cursor = 'pointer';
        stage.addChild(feedBitmap);
    };

    var newSlimeImg = new Image();

    newSlimeImg.src = 'assets/new_slime.png';
    newSlimeImg.onload = (e) => {
        var newSlimeBitmap = new createjs.Bitmap(newSlimeImg);

        newSlimeBitmap.scaleX = scale;
        newSlimeBitmap.scaleY = scale;
        newSlimeBitmap.cursor = 'pointer';
        newSlimeBitmap.on('click', (e) => {
            stats = ipcRenderer.sendSync('resetSlime');
        });
        stage.addChild(newSlimeBitmap);
    };

    var spriteSheet = new createjs.SpriteSheet({
        images: [
            'assets/stare.png',
            'assets/angry.png',
            'assets/hungry.png',
            'assets/happy.png',
            'assets/dead.png',
            'assets/surprise.png',
            'assets/question.png',
            'assets/sleep_1.png',
            'assets/sleep_2.png',
            'assets/jump_1.png',
            'assets/jump_2.png',
            'assets/jump_3.png',
            'assets/jump_4.png',
            'assets/jump_5.png',
            'assets/jump_6.png',
            'assets/eat_1.png',
            'assets/eat_2.png',
            'assets/eat_3.png',
            'assets/eat_4.png',
        ],
        frames: [
            // x, y, width, height, imageIndex*, regX*, regY*
            [0, 0, 64, 64, 0],
            [0, 0, 64, 64, 1],
            [0, 0, 64, 64, 2],
            [0, 0, 64, 64, 3],
            [0, 0, 64, 64, 4],
            [0, 0, 64, 64, 5],
            [0, 0, 64, 64, 6],
            [0, 0, 64, 64, 7],
            [0, 0, 64, 64, 8],
            [0, 0, 64, 64, 9],
            [0, 0, 64, 64, 10],
            [0, 0, 64, 64, 11],
            [0, 0, 64, 64, 12],
            [0, 0, 64, 64, 13],
            [0, 0, 64, 64, 14],
            [0, 0, 64, 64, 15],
            [0, 0, 64, 64, 16],
            [0, 0, 64, 64, 17],
        ],
        animations: {
            idle: [0, 0, true, 1],
            angry: 1,
            hungry: 2,
            happy: 3,
            dead: 4,
            surprise: [5, 5, 'idle', 0.1],
            question: [6, 6, 'idle', 0.1],
            sleep: [7, 8, true, 0.1],
            jump: [9, 13, 'idle', 0.5],
            eat: [14, 17, 'idle', 0.5],
        },
    });

    if (spriteSheet.complete) {
        spriteSheetReady(spriteSheet);
    }
    else {
        spriteSheet.on('complete', (e) => {
            spriteSheetReady(spriteSheet);
        });
    }
}

function spriteSheetReady(sheet) {
    slime = new createjs.Sprite(sheet);
    slime.scaleX = scale;
    slime.scaleY = scale;
    slime.on('click', poke);
    stage.addChild(slime);
    createjs.Ticker.addEventListener('tick', handleTick);
}

function handleTick(e) {
    if (!e.paused) {
        if (!stats.dead) {
            calculateEmotion(e.delta / 1000);
        }
        else if (slime.currentAnimation !== 'dead') {
            slime.gotoAndPlay('dead');
        }
    }

    stage.update();
}

function calculateEmotion(deltaTime) {
    var oldEmotion = stats.emotion;
    stats.hunger -= deltaTime / 20;

    if (stats.hunger < -20) {
        stats.dead = true;
        slime.gotoAndPlay('dead');
        return;
    }

    if (stats.doJump || slime.currentAnimation === 'jump') {
        if (slime.currentAnimation !== 'jump') {
            slime.gotoAndPlay('jump');
            stats.doJump = false;
            stats.awake = true;
        }

        return;
    }

    if (stats.doEat || slime.currentAnimation === 'eat') {
        if (slime.currentAnimation !== 'eat') {
            slime.gotoAndPlay('eat');
            stats.doEat = false;
        }

        return;
    }

    if (stats.awake) {
        stats.sleepiness -= deltaTime / 50;

        if (stats.sleepiness < 15 && stats.hunger >= 10 && slime.currentAnimation !== 'sleep') {
            stats.awake = false;
            slime.gotoAndPlay('sleep');
        }
    }
    else {
        stats.sleepiness += deltaTime * 10;

        if (stats.sleepiness >= 100) {
            stats.sleepiness = 100;
            stats.awake = true;
        }
    }

    if (stats.hunger < 30) {
        if (slime.currentAnimation !== 'hungry') {
            slime.gotoAndPlay('hungry');
        }
        else {
            stats.happiness -= deltaTime / 200;

            if (stats.hunger < 10 && !stats.awake) {
                stats.awake = true;
                slime.gotoAndPlay('hungry');
            }
        }
    }
    else if (stats.happiness >= 75) {
        if (slime.currentAnimation !== 'happy') {
            slime.gotoAndPlay('happy');
        }
    }
    else if (stats.happiness < 25) {
        if (slime.currentAnimation !== 'angry') {
            slime.gotoAndPlay('angry');
        }
    }
    else if (slime.currentAnimation !== 'idle') {
        slime.gotoAndPlay('idle');
    }
}

window.addEventListener('keydown', (e) => {
    switch (e.keyCode) {
        default:
            console.log(e.keyCode);
    }
});

window.onbeforeunload = (e) => {
  // save slime data
  ipcRenderer.sendSync('saveSlime', stats);
};

init();
