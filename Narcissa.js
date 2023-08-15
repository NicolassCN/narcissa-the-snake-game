/*  Narcissa

Aluno 1: 61905 Nicolas Nascimento 
Aluno 2: 63191 Rodrigo Fernandes 

Comentario:

O ficheiro "Narcissa.js" tem de incluir, logo nas primeiras linhas,
um comentário inicial contendo: o nome e número dos dois alunos que
realizaram o projeto; indicação de quais as partes do trabalho que
foram feitas e das que não foram feitas (para facilitar uma correção
sem enganos); ainda possivelmente alertando para alguns aspetos da
implementação que possam ser menos óbvios para o avaliador.

0123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789
*/

// GLOBAL CONSTANTS

const ANIMATION_EVENTS_PER_SECOND = 4;

const MIN_SNAKE_BODY_SIZE = 4;

const IMAGE_NAME_EMPTY = "empty";
const IMAGE_NAME_INVALID = "invalid";
const IMAGE_NAME_SHRUB = "shrub";
const IMAGE_NAME_BERRY_RED = "berryRed";
const IMAGE_NAME_BERRY_PURPLE = "berryPurple";
const IMAGE_NAME_BERRY_GREEN = "berryGreen";
const IMAGE_NAME_BERRY_BLUE = "berryBlue";
const IMAGE_NAME_BERRY_ORANGE = "berryOrange";
const IMAGE_NAME_BERRY_DARKGREEN = "berryDarkGreen"
const IMAGE_NAME_SNAKE_HEAD = "snakeHead";
const IMAGE_NAME_SNAKE_BODY = "snakeBody";
const WIN_SCORE = 300;

// GLOBAL VARIABLES

let control;    // Try not no define more global variables
let audio;

// ACTORS

class Actor {
    constructor(x, y, imageName) {
        this.x = x;
        this.y = y;
        this.atime = 0; // This has a very technical role in the control of the animations
        this.imageName = imageName;
        this.show();
    }
    draw(x, y, image) {
        control.ctx.drawImage(image, x * ACTOR_PIXELS_X, y * ACTOR_PIXELS_Y);
    }
    show() {
        this.checkPosition();
        control.world[this.x][this.y] = this;
        this.draw(this.x, this.y, GameImages[this.imageName]);
    }
    hide() {
        control.world[this.x][this.y] = control.getEmpty();
        this.draw(this.x, this.y, GameImages[IMAGE_NAME_EMPTY]);
    }
    move(dx, dy) {
        this.hide();
        const nextX = this.x + dx;
        const nextY = this.y + dy;


        if (nextX < 0 || nextX >= WORLD_WIDTH || nextY < 0 || nextY >= WORLD_HEIGHT) {
            this.x = (nextX + WORLD_WIDTH) % WORLD_WIDTH;
            this.y = (nextY + WORLD_HEIGHT) % WORLD_HEIGHT;
        } else {
            this.x = nextX;
            this.y = nextY;
        }
        this.show();
    }
    animation(x, y) { }
    checkPosition() {
        if (
            control.world[this.x] === undefined ||
            control.world[this.x][this.y] === undefined ||
            this.x < 0 ||
            this.x >= WORLD_WIDTH ||
            this.y < 0 ||
            this.y >= WORLD_HEIGHT
        )
            fatalError("Invalid position");
    }
}

class ActorsThatGrow extends Actor {
    constructor(x, y, imageName) {
        super(x, y, imageName);
    }

    grow(newPart, x, y) {
        this.show();
        control.world[x][y] = newPart;
    }
}

class Invalid extends Actor {
    constructor(x, y) { super(x, y, IMAGE_NAME_INVALID); }
}

class Empty extends Actor {
    constructor() {
        super(-1, -1, IMAGE_NAME_EMPTY);
        this.atime = Number.MAX_SAFE_INTEGER;
    }
    show() { }
    hide() { }
}

class Berry extends Actor {
    constructor(x, y, imageName) {
        super(x, y, "rand");
        this.survivalRate = (rand(81) * ANIMATION_EVENTS_PER_SECOND) + (20 * ANIMATION_EVENTS_PER_SECOND);
        this.fadeRate = 10 * ANIMATION_EVENTS_PER_SECOND;
        this.isFading = false;
    }

    show() {
        if (this.imageName === "rand") {
            this.imageName = this.getColor(rand(6));
        }
        this.checkPosition();
        control.world[this.x][this.y] = this;
        super.show();
    }

    getColor(n) {
        switch (n) {
            case 0: return IMAGE_NAME_BERRY_BLUE;
            case 1: return IMAGE_NAME_BERRY_GREEN;
            case 2: return IMAGE_NAME_BERRY_ORANGE;
            case 3: return IMAGE_NAME_BERRY_PURPLE;
            case 4: return IMAGE_NAME_BERRY_RED;
            case 5: return IMAGE_NAME_BERRY_DARKGREEN;
        }
    }

    fall() {
        if (this.atime === control.getBerryFallRate()) {
            const emptyCells = this.getEmptyCells();
            const numberOfBerries = rand(5) + 1;
            const newBerries = [];

            for (let i = 0; i < numberOfBerries; i++) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const newBerry = new Berry(randomCell[0], randomCell[1], this.getColor(rand(6)));
                newBerries.push(newBerry);
            }

            for (const newBerry of newBerries) {
                control.world[newBerry.x][newBerry.y] = newBerry;
            }
            control.newBerryFallRate(); // updates the fall rate
        }
    }

    fade(x, y) {
        if (this.survivalRate === this.fadeRate) {
            this.isFading = true;
            // updates the status and draws a black circle
            const ctx = control.ctx;
            ctx.beginPath();
            ctx.fillStyle = "black";
            ctx.arc(x * ACTOR_PIXELS_X + ACTOR_PIXELS_X / 2,
                y * ACTOR_PIXELS_Y + ACTOR_PIXELS_Y / 2,
                ACTOR_PIXELS_X / 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    vanish() {
        if (this.survivalRate <= 0) {
            this.hide();
            control.world[this.x][this.y] = new Empty();
        }
    }

    animation(x, y) {
        super.animation(x, y);
        this.fall();
        this.survivalRate--;
        this.fade(x, y);
        if (this.survivalRate <= 0) this.vanish();
    }

    getEmptyCells() {
        const emptyCells = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                if (this.isValidCell(x, y)) {
                    emptyCells.push([x, y]);
                }
            }
        }
        return emptyCells;
    }

    isValidCell(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
            return false;
        }
        const actor = control.world[x][y];
        return actor instanceof Empty;
    }
}

class Shrub extends ActorsThatGrow {
    constructor(x, y, imageName) {
        super(x, y, IMAGE_NAME_SHRUB);
        this.growthRate = (rand(8) * ANIMATION_EVENTS_PER_SECOND) + (20 * ANIMATION_EVENTS_PER_SECOND);
    }

    animation(x, y) {
        super.animation(x, y);
        this.grow();
    }

    grow() {
        if (this.atime === this.growthRate) {
            this.growthRate = (rand(81) * ANIMATION_EVENTS_PER_SECOND) +
                (20 * ANIMATION_EVENTS_PER_SECOND) + this.atime;
            const adjacentCells = this.getAdjacentCells();
            const randomCell = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
            const newPart = new Shrub(randomCell[0], randomCell[1], this.imageName);
            super.grow(newPart, randomCell[0], randomCell[1]);
        }
    }

    getAdjacentCells() {
        const adjacentCells = [];
        const directions = [
            [-1, -1], [0, -1], [1, -1],
            [-1, 0], [1, 0],
            [-1, 1], [0, 1], [1, 1]
        ];
        for (const direction of directions) {
            const newX = this.x + direction[0];
            const newY = this.y + direction[1];
            if (this.isValidCell(newX, newY)) {
                adjacentCells.push([newX, newY]);
            }
        }
        return adjacentCells;
    }

    isValidCell(x, y) {
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) {
            return false;
        }
        const actor = control.world[x][y];
        return actor instanceof Empty;
    }
}

class SnakeBody extends Actor {
    constructor(x, y, imageName) {
        super(x, y, IMAGE_NAME_SNAKE_BODY);
    }
}

class Snake extends ActorsThatGrow {
    constructor(x, y) {
        super(x, y, IMAGE_NAME_SNAKE_HEAD);
        this.direction = [1, 0];
        this.body = [];
        this.stomach = [];

        for (let i = 1; i < MIN_SNAKE_BODY_SIZE + 1; i++) {
            const segment = new SnakeBody(this.x - i, this.y);
            this.body.push(segment);
            super.grow(segment, segment.x, segment.y);
        }
        control.automaticSnake = false;
    }

    handleKey() {
        let k = control.getKey();
        if (k === null) {
            // Tecla não pressionada, ignore
        } else if (typeof (k) === "string") {
            // Aqui você pode adicionar o tratamento para comandos especiais, se necessário
        } else {
            // Mudança de direção
            let [kx, ky] = k;
            if (kx !== -this.direction[0] || ky !== -this.direction[1]) {
                this.direction = [kx, ky];
            }
        }
    }

    handleAutomatic() {
        let berries = [];
        for (let x = 0; x < WORLD_WIDTH; x++) {
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                let actor = control.world[x][y];
                if (actor instanceof Berry) {
                    berries.push(actor);
                }
            }
        }
    
        let closestBerry = null;
        let closestDistance = Number.MAX_SAFE_INTEGER;
        for (let berry of berries) {
            if (!this.stomach.includes(berry.imageName)) {
                let dx = this.x - berry.x;
                let dy = this.y - berry.y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < closestDistance) {
                    closestBerry = berry;
                    closestDistance = distance;
                }
            }
        }
    
        // move to the nearest valid berry
        if (closestBerry !== null) {
            let dx = closestBerry.x - this.x;
            let dy = closestBerry.y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                if (!this.isCollision(this.x + Math.sign(dx), this.y)) {
                    this.direction = [Math.sign(dx), 0];
                } else if (!this.isCollision(this.x, this.y + Math.sign(dy))) {
                    this.direction = [0, Math.sign(dy)];
                } else if (!this.isCollision(this.x, this.y - Math.sign(dy))) {
                    this.direction = [0, -Math.sign(dy)];
                }
            } else {
                if (!this.isCollision(this.x, this.y + Math.sign(dy))) {
                    this.direction = [0, Math.sign(dy)];
                } else if (!this.isCollision(this.x + Math.sign(dx), this.y)) {
                    this.direction = [Math.sign(dx), 0];
                } else if (!this.isCollision(this.x - Math.sign(dx), this.y)) {
                    this.direction = [-Math.sign(dx), 0];
                }
            }
        }
    }

    animation(x, y) {
        if (control.automaticSnake) this.handleAutomatic();
        else this.handleKey();
        this.move(this.direction[0], this.direction[1]);
    }

    move(dx, dy) {
        let prevX = this.x;
        let prevY = this.y;

        let nextX = this.x + dx;
        let nextY = this.y + dy;
        var actorNext;

        if (!(nextX < 0 || nextX >= WORLD_WIDTH || nextY < 0 || nextY >= WORLD_HEIGHT))
            actorNext = control.world[nextX][nextY];
        else
            actorNext = control.world[this.x][this.y];

        super.move(dx, dy);
        this.moveBody(prevX, prevY);

        if (actorNext instanceof Berry) {
            this.eatBerry(actorNext);
        }
        if (actorNext instanceof Shrub) {
            this.die();
            return;
        }

        if (actorNext instanceof SnakeBody) {

            this.die();
            return;
        }


    }

    moveBody(prevX, prevY) {
        if (this.body.length + 1 >= WIN_SCORE) this.win();

        this.hide();
        var pX = prevX;
        var pX = prevY;
        for (let i = 0; i < this.body.length; i++) {
            let segment = this.body[i];
            segment.hide();

            if (i < 3 && i < this.stomach.length)
                segment.imageName = this.stomach[this.stomach.length - 1 - i];
            else
                segment.imageName = IMAGE_NAME_SNAKE_BODY;


            var segmentX = segment.x;
            var segmentY = segment.y;

            segment.x = prevX;
            segment.y = prevY;

            segment.show();
            prevX = segmentX;
            prevY = segmentY;
            control.world[segment.x][segment.y] = segment;
        }
        this.show();
    }


    eatBerry(berry) {
        const color = berry.imageName;
        if (this.stomach.includes(color)) {
            let halfIndex = Math.floor(this.body.length / 2);
            let halfBody = this.body.splice(halfIndex);
            halfBody.forEach(segment => {
                segment.hide();
                control.world[segment.x][segment.y] = new Empty();
            });

            if (this.body.length < MIN_SNAKE_BODY_SIZE)
                while (this.body.length < MIN_SNAKE_BODY_SIZE) this.grow();

        } else {
            this.stomach.push(color);
            if (this.stomach.length > 3) {
                this.stomach.shift();
            }
        }

        if (berry.isFading) this.grow();
        this.grow();

        // update score
        control.score = this.body.length + 1;
        updateScore();
    }

    grow() {
        const tailSegment = this.body[this.body.length - 1];
        tailSegment.hide();
        const newSegment = new SnakeBody(tailSegment.x, tailSegment.y);
        this.body.push(newSegment);
        super.grow(newSegment, tailSegment.x, tailSegment.y);
    }

    isCollision(x, y) {
        const actor = control.world[x][y];
        return actor instanceof Shrub || actor instanceof SnakeBody;
    }

    win() {
        control.win();
    }
    die() {
        control.lose();
    }
}

// GAME CONTROL

class GameControl {
    constructor() {
        let c = document.getElementById('canvas1');
        control = this; // setup global var
        this.key = 0;
        this.score = 5;
        this.paused = false;
        this.automaticSnake = false;
        this.time = 0;
        this.ctx = document.getElementById("canvas1").getContext("2d");
        this.empty = new Empty();   // only one empty actor needed, global var
        this.world = this.createWorld();
        this.berryFallRate = (rand(11) * ANIMATION_EVENTS_PER_SECOND) + ANIMATION_EVENTS_PER_SECOND;
        this.loadLevel(1);
        this.setupEvents();
    }

    getEmpty() {
        return this.empty;
    }

    getTime() {
        return this.time;
    }

    newBerryFallRate() {
        this.berryFallRate = (rand(11) * ANIMATION_EVENTS_PER_SECOND) +
            ANIMATION_EVENTS_PER_SECOND + this.time;
    }

    getBerryFallRate() {
        return this.berryFallRate;
    }

    createWorld() { // matrix needs to be stored by columns
        let world = new Array(WORLD_WIDTH);
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let a = new Array(WORLD_HEIGHT);
            for (let y = 0; y < WORLD_HEIGHT; y++)
                a[y] = this.empty;
            world[x] = a;
        }
        return world;
    }

    loadLevel(level) {
        if (level < 1 || level > MAPS.length)
            fatalError("Invalid level " + level)
        let map = MAPS[level - 1];  // -1 because levels start at 1
        for (let x = 0; x < WORLD_WIDTH; x++)
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                // x/y reversed because map is stored by lines
                GameFactory.actorFromCode(map[y][x], x, y);
            }
    }

    getKey() {
        let k = this.key;
        this.key = 0;
        switch (k) {
            case 37: case 79: case 74: return [-1, 0];  // LEFT, O, J
            case 38: case 81: case 73: return [0, -1];  // UP, Q, I
            case 39: case 80: case 76: return [1, 0];   // RIGHT, P, L
            case 40: case 65: case 75: return [0, 1];   // DOWN, A, K
            case 0: return null;
            case 32: b1(); return; 
            case 82: b2(); return;
            case 77: turnOnMusic(); return;
            case 78: turnOffMusic(); return;
            default: return String.fromCharCode(k);
            // http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
        };
    }

    setupEvents() {
        addEventListener("keydown", e => this.keyDownEvent(e), false);
        addEventListener("keyup", e => this.keyUpEvent(e), false);
        setInterval(() => this.animationEvent(), 1000 / ANIMATION_EVENTS_PER_SECOND);
    }

    animationEvent() {
        if (this.paused) {
            this.getKey();
            return;
        }
        
        this.time++;
        if(this.time % 4 == 0)
        timer(this.time/4);
        for (let x = 0; x < WORLD_WIDTH; x++)
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                let a = this.world[x][y];
                if (a.atime < this.time) {
                    a.atime = this.time;
                    a.animation(x, y);
                }
            }
    }
    keyDownEvent(e) {
        this.key = e.keyCode;
    }
    keyUpEvent(e) {
    }

    win() {
        this.paused = true;
        alert("You win!\nCongratulations!\n" + "Your score was: " + score.value);
        b2();
    }


    lose() {
        this.paused = true;
        alert("You lost!\n" + "Your score was: " + score.value + "\nTry again?");
        b2();
    }
}


// Functions called from the HTML page

function onLoad() {
    // Asynchronously load the images an then run the game
    GameImages.loadAll(() => new GameControl());
    audio = new Audio("http://ctp.di.fct.unl.pt/lei/lap/projs/proj2223-3/files/resources/louiscole.m4a");
}

function b1() {
    control.paused = !control.paused;
}
function b2() {
    location.reload(true);
}
function updateScore() {
    var score = document.getElementById("score");
    score.value = control.score;

}
function automaticSnake() {
    control.automaticSnake = !control.automaticSnake;
}

function turnOnMusic() {
    audio.play();

}
function turnOffMusic() {
    audio.pause();
}

function timer(timer) {
    var time = document.getElementById("time");
    time.value = timer;
}

