const { ipcRenderer, remote } = require('electron');
const slimeConfig = require('./slime-config.js');
const scale = 2;
const today = new Date();
let stage;
let slime;
let feedButton;
let newSlimeButton;
let stats = ipcRenderer.sendSync('loadSlime');
const slimeBday = new Date(stats.bday);
let holidayTheme;

if (today.getMonth() === 11 && today.getDate() === 25) {
    holidayTheme = 'xmas';
}
else if (today.getMonth() === 9 && today.getDate() === 31) {
    // holidayTheme = 'halloween';
}
else if (today.getMonth() === 0 && today.getDate() === 1) {
    // holidayTheme = 'newyear';
}
else if (today.getMonth() === 1 && today.getDate() === 14) {
    // holidayTheme = 'valentines';
}
else if (today.getMonth() === 6 && today.getDate() === 4) {
    // holidayTheme = 'july4';
}
else if (today.getMonth() === 10 && today.getDate() === 22) {
	// TODO: Fix date check
    // holidayTheme = 'thanksgiving';
}

function randomColor() {
    let colors = [];

    Object.keys(slimeConfig.colors).forEach((color) => {
        const probability = slimeConfig.colors[color];
        let newColor = Array.from(Array(probability));

        newColor.fill(color);
        colors = colors.concat(newColor);
    });

    return colors[Math.floor(Math.random() * colors.length)];
}

function mergeImages(color, outfit, callback) {
    let canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    let ctx=canvas.getContext('2d');
    let slimeColor = new Image();
    let slimeOutfit = new Image();

    slimeColor.src = color;

    slimeColor.onload = () => {

        if (outfit) {
           ctx.drawImage(slimeColor, 0, 0, 1024, 1024);
           slimeOutfit.src = outfit;

           slimeOutfit.onload = () => {
              ctx.drawImage(slimeOutfit, 0, 0, 1024, 1024);
              callback(canvas.toDataURL('image/png'));
           }
       }
       else {
           callback(slimeColor);
       }
    };
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

function loadBitmap(file, clickAction, callback) {
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

        let child = stage.addChild(bitmap);

        callback && callback(child);
    };
}

function init() {
    stage = new createjs.Stage('playground');
    stage.enableMouseOver();
    loadBitmap(`ground/${holidayTheme || 'default'}`);
    loadBitmap('buttons/feed', feed, (button) => {
        feedButton = button;
    });
    loadBitmap('buttons/new', (e) => {
        stats = ipcRenderer.sendSync('resetSlime');
        stats.color = randomColor();
        initSpriteSheet();
    }, (button) => {
        newSlimeButton = button;
    });
    loadBitmap('buttons/settings', (e) => {
        ipcRenderer.sendSync('showSettings');
    });

    if (slimeBday.getFullYear() < today.getFullYear() && slimeBday.getMonth() === today.getMonth() && slimeBday.getDate() === today.getDate()) {
        loadBitmap('ground/bday');
    }

    initSpriteSheet();
}

function initSpriteSheet() {
    mergeImages(`assets/slime/colors/${stats.color}.png`, holidayTheme && `assets/slime/costumes/${holidayTheme}.png`, (slimeImg) => {
        let spriteSheet = new createjs.SpriteSheet({
            images: [slimeImg],
            frames: {
                width: 64,
                height: 64,
            },
            animations: {
                idle: [0, 0, true, 1],
                angry: 21,
                hungry: 20,
                happy: 18,
                dead: 19,
                surprise: [16, 16, 'idle', 0.1],
                question: [17, 17, 'idle', 0.1],
                sleep: [36, 37, true, 0.1],
                jump: [48, 53, 'idle', 0.5],
                eat: [32, 35, 'idle', 0.5],
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
    });
}

function spriteSheetReady(sheet) {
    feedButton.visible = true;
    newSlimeButton.visible = false;

    if (slime) {
        slime.spriteSheet = sheet;
    }
    else {
        slime = new createjs.Sprite(sheet);
        slime.scaleX = scale;
        slime.scaleY = scale;
        slime.on('click', poke);
        stage.addChild(slime);
        createjs.Ticker.addEventListener('tick', handleTick);
    }
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
        feedButton.visible = false;
        newSlimeButton.visible = true;
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
