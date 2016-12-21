const { ipcRenderer } = require('electron');
const scale = 2;
const today = new Date();
const slimeImages = [
    'idle',
    'angry',
    'hungry',
    'happy',
    'dead',
    'surprise',
    'question',
    'sleep_1',
    'sleep_2',
    'jump_1',
    'jump_2',
    'jump_3',
    'jump_4',
    'jump_5',
    'jump_6',
    'eat_1',
    'eat_2',
    'eat_3',
    'eat_4',
];
let stage;
let slime;
let stats = ipcRenderer.sendSync('loadSlime');
const slimeBday = new Date(stats.bday);
let holidayImages = '';

if (today.getMonth() === 12 && today.getDate() === 25) {
    holidayImages = '_xmas';
}
else if (today.getMonth() === 10 && today.getDate() === 31) {
    // holidayImages = '_halloween';
}
else if (today.getMonth() === 1 && today.getDate() === 1) {
    // holidayImages = '_newyear';
}
else if (today.getMonth() === 2 && today.getDate() === 14) {
    // holidayImages = '_valentines';
}
else if (today.getMonth() === 7 && today.getDate() === 4) {
    // holidayImages = '_july4';
}
else if (today.getMonth() === 11 && today.getDate() === 22) {
	// TODO: Fix date check
    // holidayImages = '_thanksgiving';
}

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

function loadBitmap(file, clickAction) {
    let img = new Image();

    img.src = `assets/${file}.png`;
    img.onload = (e) => {
        let bitmap = new createjs.Bitmap(img);

        bitmap.scaleX = scale;
        bitmap.scaleY = scale;

        if (clickAction != null) {
            bitmap.on('click', clickAction);
            bitmap.cursor = 'pointer';
        }

        stage.addChild(bitmap);
    };
}

function init() {
    stage = new createjs.Stage('playground');
    stage.enableMouseOver();
    loadBitmap(`ground${holidayImages}`);
    loadBitmap('feed', feed);
    loadBitmap('new_slime', (e) => {
        stats = ipcRenderer.sendSync('resetSlime');
    });

    if (slimeBday.getFullYear() < today.getFullYear() && slimeBday.getMonth() === today.getMonth() && slimeBday.getDate() === today.getDate()) {
        loadBitmap('bday');
    }

    let spriteSheet = new createjs.SpriteSheet({
        images: slimeImages.map((img) => `assets/${img}${holidayImages}.png`),
        frames: slimeImages.map((img, i) => [0, 0, 64, 64, i]),
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
  ipcRenderer.sendSync('saveSlime', stats);
};

init();
