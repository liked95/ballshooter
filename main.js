
function randomNumBetween(min, max) {
    return min + Math.random() * (max - min);
}

function randomRGB() {
    return `rgb(${randomNumBetween(128, 255)},${randomNumBetween(0, 255)},${randomNumBetween(0, 255)})`;
}

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.querySelector('.score span')
const healthLabel = document.querySelector('.health-label span')
const gameOverScore = document.querySelector('h1');

const startGameAudio = new Audio('./audio/startGame.wav')
const endGameAudio = new Audio('./audio/endGame.wav')
const shootAudio = new Audio('./audio/shoot.mp3')
const enemyHitAudio = new Audio('./audio/enemyHit.mp3')
const enemyEliminatedAudio = new Audio('./audio/enemyEliminated.mp3')
const obtainPowerUpAudio = new Audio('./audio/obtainPowerUp.wav')
const healthUpAudio = new Audio('./audio/healthUp.mp3')
const playerDamageAudio = new Audio('./audio/playerDamage.mp3')
const explosionAudio = new Audio('./audio/explosion.mp3')
const slowEnemyAudio = new Audio('./audio/slow.mp3')
const speedUpAudio = new Audio('./audio/speedup.mp3')

const backgroundAudio = new Audio('./audio/backgroundMusic.mp3')
backgroundAudio.loop = true

const scene = { active: false }


canvas.width = innerWidth;
canvas.height = innerHeight;

const PLAYER_MAX_HEALTH = 5;
let playerHealth = PLAYER_MAX_HEALTH;
var playerRadius = 30;

let playerSpeed = 5;
const INITIAL_PROJECTILE_SPEED = 15;
let projectileSpeed;
const projectileRadius = 5;
const friction = 0.99;
const rocketSpeed = 2;
let enemySpeedCoefficient = 1;
let isEnemySlow = false;
let isTripleShot = false;


class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        // moving speed
        this.invincible = false;
        this.speed = playerSpeed;
        this.playerStrokeColor = 'white';
        this.buff = '';
        this.gunLength = this.radius * 2/3
    }

    draw() {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.playerStrokeColor;
        ctx.lineWidth = this.radius * 0.12;
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(
            this.x + (this.radius + this.gunLength) * Math.cos(angle), 
            this.y + (this.radius + this.gunLength) * Math.sin(angle))

        ctx.stroke();
    }

    checkEdges() {
        // check player edge
        if (this.x + this.radius >= canvas.width) this.x -= this.radius
        else if (this.x - this.radius <= 0) this.x += this.radius
        else if (this.y + this.radius >= canvas.height) this.y -= this.radius
        else if (this.y - this.radius <= 0) this.y += this.radius
    }

    shoot(mouse, color = 'white') {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        const baseVelocity = { x: projectileSpeed * Math.cos(angle), y: projectileSpeed * Math.sin(angle) }

        const projectile = new Projectile(this.x + (this.radius + this.gunLength) * Math.cos(angle), this.y + (this.radius + this.gunLength) * Math.sin(angle), projectileRadius, color, baseVelocity);
        projectiles.push(projectile);

        if (isTripleShot) {
            projectileSpeed = INITIAL_PROJECTILE_SPEED * 1 / 2;
            const divergeAngle = Math.PI / 15;
            const leftDegree = { x: projectileSpeed * Math.cos(angle - divergeAngle), y: projectileSpeed * Math.sin(angle - divergeAngle) }
            const projectileLeft = new Projectile(this.x + (this.radius + this.gunLength) * Math.cos(angle), this.y + (this.radius + this.gunLength) * Math.sin(angle), projectileRadius, color, leftDegree);
            projectiles.push(projectileLeft);
            const rightDegree = { x: projectileSpeed * Math.cos(angle + divergeAngle), y: projectileSpeed * Math.sin(angle + divergeAngle) }
            const projectileRight = new Projectile(this.x + (this.radius + this.gunLength) * Math.cos(angle), this.y + (this.radius + this.gunLength) * Math.sin(angle), projectileRadius, color, rightDegree);
            projectiles.push(projectileRight);
        } else {
            projectileSpeed = INITIAL_PROJECTILE_SPEED;
        }
        shootAudio.cloneNode().play()
    }

    fireRocket(mouse) {
        const angle = Math.atan2(mouse.y - this.y, mouse.x - this.x);
        const baseVelocity = { x: rocketSpeed * Math.cos(angle), y: rocketSpeed * Math.sin(angle) }
        const rocket = new Rocket(this.x + this.radius * Math.cos(angle), this.y + this.radius * Math.sin(angle), baseVelocity, angle + Math.PI/4);
        rockets.push(rocket);
    }
}

class Projectile {
    constructor(x, y, radius, color, vel) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vel = vel;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    update() {
        this.draw();
        this.x += this.vel.x;
        this.y += this.vel.y;

    }
}
class Particle extends Projectile {
    constructor(x, y, radius, color, vel) {
        super(x, y, radius, color, vel);
        this.alpha = 1;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.draw();
        this.vel.x *= friction;
        this.vel.y *= friction;
        this.x += this.vel.x;
        this.y += this.vel.y;
        this.alpha -= 0.01;
    }
}

class Rocket {
    constructor(x, y, vel, radians) {
        this.x = x;
        this.y = y;
        this.vel = vel;
        this.radians = radians;
        this.image = rocketImg;
        this.width = 40;
        this.height = 40;

    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.radians);player.radius
        ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    update() {
        // this.radians += 0.008;
        this.draw();
        this.x += this.vel.x;
        this.y += this.vel.y;
    }

}

let enemyInterval = 2000;
const x = canvas.width / 2;
const y = canvas.height / 2;
let player = new Player(x, y, playerRadius, 'white')
let projectiles = [];
let rockets = [];
let enemies = [];
let particles = [];
let buffs = [];
let score = 0;

function init() {
    player = new Player(x, y, playerRadius, 'white')
    projectiles = [];
    rockets = [];
    enemies = [];
    particles = [];
    buffs = [];
    score = 0;
    playerHealth = PLAYER_MAX_HEALTH;
    enemySpeedCoefficient = 1;
    isEnemySlow = false;
    isTripleShot = false;
    scoreBoard.textContent = `Score: 0`;
    healthLabel.textContent = `Life: ${playerHealth}`
    ctx.clearRect(0, 0, canvas.width, canvas.height)
}

// Create powerups
const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'
const healthUpImg = new Image()
healthUpImg.src = './img/healthup.png'
const bombImg = new Image()
bombImg.src = './img/bomb.png'
const slowImg = new Image()
slowImg.src = './img/slow.png'
const bootImg = new Image()
bootImg.src = './img/boot.png'
const rocketImg = new Image()
rocketImg.src = './img/rocket.png'

class Buff extends Projectile {
    constructor(x, y, vel) {
        super(x, y, vel);
        this.radians = 0;
        this.vel = vel;

        if (Math.random() < 0.2) {
            this.type = 'powerup';
            this.width = 14;
            this.height = 18;
            this.image = powerUpImg;
        } else if (Math.random() >= 0.2 && Math.random() < 0.4) {
            this.type = 'healthup';
            this.width = 32;
            this.height = 32;
            this.image = healthUpImg;
        } else if (Math.random() >= 0.4 && Math.random() < 0.6) {
            this.type = 'bomb';
            this.width = 40;
            this.height = 40;
            this.image = bombImg;
        } else if (Math.random() >= 0.6 && Math.random() < 0.8) {
            // player only
            this.type = 'speedUp';
            this.width = 35;
            this.height = 35;
            this.image = bootImg;
        } else {
            this.type = 'slow';
            this.width = 40;
            this.height = 40;
            this.image = slowImg;
        }
    }
    draw() {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.radians);
        ctx.translate(-this.x - this.width / 2, -this.y - this.height / 2);
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    update() {
        if (this.type === 'slow') {
            this.radians += 0.008;
        } else {
            this.radians += 0.02;
        }

        this.draw();
        this.x += this.vel.x;
        this.y += this.vel.y;
    }
}


class Enemy extends Projectile {
    constructor(x, y, radius, color, vel) {
        super(x, y, radius, color, vel);
        // homing enemy
        this.type = 'linear';
        if (Math.random() < 0.3) this.type = 'homing';
        if (Math.random() < 0.2) this.type = 'spinning';
        if (Math.random() < 0.3) this.type = 'homeSpinning';

        //spinning radians
        this.center = { x, y };
        this.radians = 0;
        // radius ranges from 0 to 100
        this.spinningRadius = 70;
        this.strokeColor = 'transparent';
        this.lineWidth = 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = this.lineWidth;
        ctx.stroke();
    }

    update() {


        if (this.type === 'linear') {
            if (isEnemySlow) {
                this.strokeColor = '#0097e6';
            }
            this.x += this.vel.x * enemySpeedCoefficient;
            this.y += this.vel.y * enemySpeedCoefficient;
        } else if (this.type === 'homing') {
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vel.x = Math.cos(angle);
            this.vel.y = Math.sin(angle);

            this.x += this.vel.x * enemySpeedCoefficient;
            this.y += this.vel.y * enemySpeedCoefficient;
            this.color = 'orange';
            this.strokeColor = 'red';
            if (isEnemySlow) {
                this.strokeColor = '#0097e6';
            }
        } else if (this.type === 'spinning') {
            if (isEnemySlow) {
                this.strokeColor = '#0097e6';
            }
            this.radians += 0.05 * enemySpeedCoefficient;
            this.center.x += this.vel.x * enemySpeedCoefficient;
            this.center.y += this.vel.y * enemySpeedCoefficient;
            this.x = this.center.x + Math.cos(this.radians) * this.spinningRadius;
            this.y = this.center.y + Math.sin(this.radians) * this.spinningRadius;
        } else if (this.type === 'homeSpinning') {
            this.strokeColor = 'red';
            if (isEnemySlow) {
                this.strokeColor = '#0097e6';
            }
            this.lineWidth = 2;

            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vel.x = Math.cos(angle);
            this.vel.y = Math.sin(angle);

            this.radians += 0.05 * enemySpeedCoefficient;
            this.center.x += this.vel.x * enemySpeedCoefficient;
            this.center.y += this.vel.y * enemySpeedCoefficient;

            this.x = this.center.x + Math.cos(this.radians) * this.spinningRadius;
            this.y = this.center.y + Math.sin(this.radians) * this.spinningRadius;
        }
        this.draw();
    }
}

function spawnEnemies() {

    const radius = randomNumBetween(25, 50);
    let x;
    let y;
    // Ensure enemies spawn from the edge
    if (Math.random() < 0.5) {
        x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
        y = Math.random() * canvas.height;
    } else {
        x = Math.random() * canvas.width;
        y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }



    const color = randomRGB();

    const angle = Math.atan2(player.y - y, player.x - x);
    const enemyVelocity = {
        x: Math.cos(angle),
        y: Math.sin(angle)
    }

    enemies.push(new Enemy(x, y, radius, color, enemyVelocity));

}

function spawnBuffs() {
    setInterval(() => {
        let x;
        let y;
        // Ensure buffs spawn from the edge
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 - 7 : canvas.width + 7;
            y = Math.random() * canvas.height;
        } else {
            x = Math.random() * canvas.width;
            y = Math.random() < 0.5 ? 0 - 9 : canvas.height + 9;
        }

        const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x);
        const buffVelocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }
        buffs.push(new Buff(x, y, buffVelocity));
    }, 1000)
}

function createScoreLabel(projectile, score) {
    const scoreLabel = document.createElement('label')
    scoreLabel.innerHTML = score
    scoreLabel.style.position = 'absolute'
    scoreLabel.style.color = 'white'
    scoreLabel.style.userSelect = 'none'
    scoreLabel.style.left = `${projectile.x}px`
    scoreLabel.style.top = `${projectile.y}px`
    document.body.appendChild(scoreLabel)


    gsap.to(scoreLabel, {
        opacity: 1,
        y: -30,
        duration: 0.75,
        onComplete: () => {
            scoreLabel.parentNode.removeChild(scoreLabel)
        }
    })
}

function createPlayerStatusLabel(status, color = 'white') {
    const playerStatus = document.createElement('label')
    playerStatus.innerHTML = status
    playerStatus.style.position = 'absolute'
    playerStatus.style.userSelect = 'none'
    playerStatus.style.color = color
    playerStatus.style.userSelect = 'none'
    playerStatus.style.left = `${player.x - player.radius * 0.8}px`
    playerStatus.style.top = `${player.y + player.radius}px`
    document.body.appendChild(playerStatus)

    gsap.to(playerStatus, {
        opacity: 1,
        y: -30,
        duration: 1.25,
        onComplete: () => {
            playerStatus.parentNode.removeChild(playerStatus)
        }
    })
}

let animationID;

let frame = 0;
function animate() {
    player.gunLength = player.radius * 2/3;
    console.log(player.gunLength)
    scoreBoard.textContent = `Score: ${score}`;
    animationID = requestAnimationFrame(animate);
    frame++;
    if (score < 5000) {
        if (frame % 200 === 0) spawnEnemies();
    } else {
        if (frame % 100 === 0) spawnEnemies();
    }



    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    player.checkEdges();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0) {
            particles.splice(index, 1);
        } else {
            particle.update();
        }
    });




    buffs.forEach((buff, buffIndex) => {
        const dist = Math.hypot(player.x - buff.x, player.y - buff.y);


        // if power up go out of canvas
        // if enemies go out of the canvas
        if (buff.x - buff.width / 2 > canvas.width + 50 ||
            buff.x + buff.height / 2 < 0 - 50 ||
            buff.y - buff.width / 2 > canvas.height + 50 ||
            buff.y + buff.height / 2 < 0 - 50) {
            buffs.splice(buffIndex, 1);
        }

        // Buff effect
        if (dist <= player.radius + buff.width / 2 + 2) {
            if (buff.type === 'powerup') {
                obtainPowerUpAudio.cloneNode().play();
                player.color = '#FFF500';
                player.playerStrokeColor = '#FFF500';
                player.buff = 'Automatic';
                createPlayerStatusLabel('Machine Gun', '#FFF500');
                buffs.splice(buffIndex, 1);

                setTimeout(() => {
                    player.buff = null;
                    player.color = '#FFFFFF'
                }, 10000)

            } else if (buff.type === 'healthup') {

                setTimeout(() => {
                    const buffFound = buffs.find((buffValue) => {
                        return buffValue === buff
                    })

                    if (buffFound) {
                        buffs.splice(buffIndex, 1)
                        if (playerHealth !== PLAYER_MAX_HEALTH) {

                            playerHealth++;
                            gsap.to(player, {
                                radius: player.radius + 3
                            });


                        }
                        player.invincible = true;
                        player.playerStrokeColor = '#4cd137';
                        healthUpAudio.cloneNode().play();
                        if (playerHealth === PLAYER_MAX_HEALTH) {
                            createPlayerStatusLabel('Invincible!', '#4cd137');
                        } else {
                            if (Math.random() < 0.5) {
                                createPlayerStatusLabel('Invincible!', '#4cd137');
                            } else {
                                createPlayerStatusLabel('+1 Life', '#4cd137')
                            }
                        }
                        healthLabel.textContent = `Life: ${playerHealth}`;
                    }
                }, 0);

                setTimeout(() => {
                    player.invincible = false;
                    player.color = '#FFFFFF'
                    player.playerStrokeColor = '#FFFFFF';
                }, 3000)

            } else if (buff.type === 'bomb') {
                setTimeout(() => {
                    const buffFound = buffs.find((buffValue) => {
                        return buffValue === buff
                    });

                    if (buffFound) {
                        buffs.splice(buffIndex, 1)
                        // Remove all enemies currently on the canvas
                        // enemies.forEach((enemy, index) => {

                        // })
                        explosionAudio.cloneNode().play();
                        createPlayerStatusLabel('Get lost!', 'tomato')
                        score += enemies.length * 100
                        enemies.forEach((enemy, index) => {
                            for (let i = 0; i < enemy.radius * 2; i++) {
                                particles.push(new Particle(enemy.x, enemy.y, Math.random() * enemy.radius / 8, enemy.color, {
                                    x: (Math.random() - 0.5) * (Math.random() * 6),
                                    y: (Math.random() - 0.5) * (Math.random() * 6)
                                }));
                            }
                        });

                        enemies = [];
                    }
                }, 0);
            } else if (buff.type === 'slow') {
                setTimeout(() => {
                    const buffFound = buffs.find((buffValue) => {
                        return buffValue === buff
                    });

                    if (buffFound) {
                        buffs.splice(buffIndex, 1)
                        // Slow enemy
                        enemySpeedCoefficient = 0.5;
                        isEnemySlow = true;
                        createPlayerStatusLabel('Slow them now!', '#0097e6');
                        slowEnemyAudio.cloneNode().play()

                    }
                }, 0);

                setTimeout(() => {
                    enemySpeedCoefficient = 1
                    isEnemySlow = false;
                }, 5000);
            } else if (buff.type === 'speedUp') {
                setTimeout(() => {
                    const buffFound = buffs.find((buffValue) => {
                        return buffValue === buff
                    });

                    if (buffFound) {
                        buffs.splice(buffIndex, 1)
                        // Increase player speed
                        player.speed = 5 * 1.3
                        player.playerStrokeColor = '#0097e6';
                        createPlayerStatusLabel('Adidasss', '#0097e6');
                        speedUpAudio.cloneNode().play()

                        // player.speed = 5*1.6;
                    }
                }, 0);

                setTimeout(() => {
                    player.speed = 5;
                    player.playerStrokeColor = '#FFFFFF';

                }, 5000);
            }

        } else {
            buff.update()
        }
    })

    // Power ups

    if (player.buff === 'Automatic' && (mouse.down || mouse.down2)) {
        if (frame % 10 === 0) {
            player.shoot(mouse, '#FFF500');
        }
    } else if (mouse.down || mouse.down2) {
        if (frame % 20 === 0)
            player.shoot(mouse, 'white')
    }


    projectiles.forEach((projectile, index) => {
        projectile.update();
        if (projectile.x + projectile.radius < 0 ||
            projectile.x - projectile.radius > canvas.width ||
            projectile.y + projectile.radius < 0 ||
            projectile.y - projectile.radius > canvas.height) {
            setTimeout(() => {
                projectiles.splice(index, 1);
            }, 0);
        }
    });

    rockets.forEach((rocket, index) => {
        rocket.update();
        if (rocket.x - rocket.width / 2 > canvas.width + 50 ||
            rocket.x + rocket.height / 2 < 0 - 50 ||
            rocket.y - rocket.width / 2 > canvas.height + 50 ||
            rocket.y + rocket.height / 2 < 0 - 50) {
            rockets.splice(index, 1);
        }

    })

    enemies.forEach((enemy, index) => {

        // if enemies go out of the canvas
        if (enemy.x - enemy.radius > canvas.width + 200 ||
            enemy.x + enemy.radius < 0 - 200 ||
            enemy.y - enemy.radius > canvas.height + 200 ||
            enemy.y + enemy.radius < 0 - 200) {
            enemies.splice(index, 1);
        }


        enemy.update();

        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // Collide with enemies
        if (dist <= player.radius + enemy.radius) {
            if (playerHealth !== 1) {

                if (player.invincible) {
                    score += 100;
                    enemyEliminatedAudio.cloneNode().play();

                    if (Math.random() < 0.5) {
                        createPlayerStatusLabel('Rampage xD')
                    } else {
                        createPlayerStatusLabel('Unstoppable')
                    }
                } else {

                    playerHealth--;
                    score -= 100;
                    gsap.to(player, {
                        radius: player.radius - 3
                    });
                    createPlayerStatusLabel('-100');
                    playerDamageAudio.play();
                }

                setTimeout(() => {
                    enemies.splice(index, 1);
                }, 0);


                healthLabel.textContent = `Life: ${playerHealth}`

            } else {
                backgroundAudio.pause();
                endGameAudio.play();
                scene.active = false;
                playerHealth--;
                healthLabel.textContent = `Life: ${playerHealth}`
                player.radius = 0;
                explosionAudio.cloneNode().play()
                cancelAnimationFrame(animationID);
                gameOverScore.textContent = score;
                container.classList.toggle('hidden');
            }

            // Player particles upon collision
            for (let i = 0; i < player.radius * 2; i++) {
                particles.push(new Particle(player.x, player.y, Math.random() * player.radius / 8, player.color, {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 0.5) * (Math.random() * 6)
                }));
            }

            // Enemy particles upon collision
            for (let i = 0; i < enemy.radius * 2; i++) {
                particles.push(new Particle(enemy.x, enemy.y, Math.random() * enemy.radius / 8, enemy.color, {
                    x: (Math.random() - 0.5) * (Math.random() * 6),
                    y: (Math.random() - 0.5) * (Math.random() * 6)
                }));
            }

        }

        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            // collision detection
            if (dist <= projectile.radius + enemy.radius) {
                // Create explosion

                for (let i = 0; i < enemy.radius * 2; i++) {
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * enemy.radius / 8, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random() * 6),
                        y: (Math.random() - 0.5) * (Math.random() * 6)
                    }));
                }

                if (enemy.radius > 35) {
                    enemyHitAudio.cloneNode().play();
                    score += 50;
                    createScoreLabel(projectile, 50)

                    gsap.to(enemy, {
                        radius: enemy.radius - 15
                    });
                    setTimeout(() => {
                        projectiles.splice(projectileIndex, 1);
                    }, 0);

                } else {
                    enemyEliminatedAudio.cloneNode().play()
                    score += 100;
                    createScoreLabel(projectile, 100)

                    setTimeout(() => {
                        const enemyFound = enemies.find((enemyValue) => {
                            return enemyValue === enemy
                        })

                        setTimeout(() => {
                            if (enemyFound) {
                                enemies.splice(index, 1)
                                projectiles.splice(projectileIndex, 1)
                            }
                        }, 0);

                    }, 0);
                }
            }
        })
    })
}

const mouse = {
    down: false,
    down2: false,
    x: undefined,
    y: undefined
}


addEventListener('resize', () => {
    canvas.width = innerWidth
    canvas.height = innerHeight


})

addEventListener('mousedown', (e) => {
    if (e.button === 0) {
        mouse.down = true
    }

    if (e.button === 2) {
        mouse.down2 = true
        isTripleShot = true
    }
    mouse.x = e.clientX
    mouse.y = e.clientY
})

addEventListener('mousemove', ({ clientX, clientY }) => {
    mouse.x = clientX
    mouse.y = clientY
})

addEventListener('mouseup', (e) => {
    if (e.button === 0) {
        mouse.down = false
    }

    if (e.button === 2) {
        mouse.down2 = false
        isTripleShot = false
    }
})

addEventListener('click', (e) => {
    if (scene.active && player.buff !== 'Automatic') {
        mouse.x = e.clientX
        mouse.y = e.clientY
        player.shoot(mouse)
    }
})

addEventListener('contextmenu', e => {
    e.preventDefault()


    // if (scene.active && player.buff !== 'Automatic') {
    //     mouse.x = e.clientX
    //     mouse.y = e.clientY
    //     player.shoot(mouse)
    // }
})

// Smartphone
addEventListener('touchstart', (event) => {
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY

    mouse.down = true
})

addEventListener('touchmove', (event) => {
    mouse.x = event.touches[0].clientX
    mouse.y = event.touches[0].clientY
})

addEventListener('touchend', () => {
    mouse.down = false
})


const container = document.querySelector('.container');
const startBtn = document.querySelector('button');
startBtn.addEventListener('click', () => {

    init();
    animate();
    spawnBuffs();
    container.classList.toggle('hidden');
    startGameAudio.play();
    scene.active = true;
    setTimeout(() => {
        backgroundAudio.play();
    }, 2000);


});




// Control player
var keyState = {};

window.addEventListener('keydown', function (e) {
    keyState[e.keypress || e.which] = true;
}, true);

window.addEventListener('keyup', function (e) {
    keyState[e.keypress || e.which] = false;
}, true);



function keyLoop() {
    if (keyState[37] || keyState[65]) {
        player.x -= player.speed;
    }

    if (keyState[39] || keyState[68]) {
        player.x += player.speed;
    }

    if (keyState[38] || keyState[87]) {
        player.y -= player.speed;
    }

    if (keyState[40] || keyState[83]) {
        player.y += player.speed;
    }
    //toggle triple shot


    setTimeout(keyLoop, 5);
}

keyLoop();

if (event) {
    if (!isTripleShot) {
        isTripleShot = true;
    } else {
        isTripleShot = false;
    }
}



addEventListener('keydown', e => {
    if (e.shiftKey || e.code === 'Space') {
        player.fireRocket(mouse);
    }
})
