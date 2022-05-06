
function randomNumBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomRGB() {
    return `rgb(${randomNumBetween(128, 255)},${randomNumBetween(0, 255)},${randomNumBetween(0, 255)})`;
 }

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
const scoreBoard = document.querySelector('.score span')
const gameOverScore = document.querySelector('h1');




canvas.width = innerWidth;
canvas.height = innerHeight;

const playerSpeed = 10;
const projectileSpeed = 15;
const projectileRadius = 5;

class Player{
    constructor(x, y, radius, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        // moving speed
        this.speed = playerSpeed;

        this.powerUp = '';
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    checkEdges() {
        // check player edge
        if (this.x + this.radius >= canvas.width) this.x -= this.radius
        else if (this.x - this.radius <= 0) this.x += this.radius
        else if (this.y + this.radius >= canvas.height) this.y -= this.radius
        else if (this.y - this.radius <= 0) this.y += this.radius
    }

    shoot(mouse, color = 'white'){
        const angle = Math.atan2(mouse.y - this.y, mouse.x-this.x);
        const baseVelocity = {x: projectileSpeed*Math.cos(angle), y: projectileSpeed*Math.sin(angle)}    

        const projectile = new Projectile(this.x + this.radius*Math.cos(angle), this.y + this.radius*Math.sin(angle), projectileRadius, color, baseVelocity);

        projectiles.push(projectile); 
    }
}

class BackgroundParticle {
    constructor(x, y, radius, color) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.alpha = 0.05
      this.initialAlpha = this.alpha
    }
  
    draw() {
      ctx.save()
      ctx.globalAlpha = this.alpha
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
      ctx.fillStyle = this.color
      ctx.fill()
      ctx.restore()
    }
  
    update() {
      this.draw()
      // this.alpha -= 0.01
    }
  }
let enemyInterval = 2000;
const x = canvas.width/2;
const y = canvas.height/2;
let player = new Player(x, y, 30, 'white')
let projectiles = [];
let enemies = [];
let particles = [];
let backgroundParticles = [];
let powerUps = [];
let score = 0;

function init(){
    player = new Player(x, y, 30, 'white')
    projectiles = [];
    enemies = [];
    particles = [];
    powerUps = [];
    score = 0;
    scoreBoard.textContent = `Score: 0`;
    for (let x = 0; x < canvas.width; x += 30) {
        for (let y = 0; y < canvas.height; y += 30) {
          backgroundParticles.push(new BackgroundParticle(x, y, 3, 'blue'))
        }
    }
}

class Projectile{
    constructor(x, y, radius, color, vel){
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

    update(){
        this.draw();
        this.x += this.vel.x;
        this.y += this.vel.y;

    }
}

// Create powerups
const powerUpImg = new Image()
powerUpImg.src = './img/lightning.png'

class PowerUp extends Projectile {
    constructor (x, y, vel){
        super(x, y, vel);
        this.width = 14;
        this.height = 18;
        this.radians = 0;
        this.vel = vel;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.radians);
        ctx.translate(-this.x - this.width/2, -this.y - this.height/2);
        ctx.drawImage(powerUpImg, this.x, this.y, this.width, this.height);
        ctx.restore();
    }

    update(){
        this.radians += 0.02;
        this.draw();
        this.x += this.vel.x;
        this.y += this.vel.y;
    }
}



class Enemy extends Projectile{
    constructor(x, y, radius, color, vel){
        super(x, y, radius, color, vel);
        // homing enemy
        this.type = 'linear';
        if (Math.random() < 0.3) this.type = 'homing';
        if (Math.random() < 0.3) this.type = 'spinning';
        if (Math.random() < 0.5) this.type = 'homeSpinning';

        //spinning radians
        this.center = {x, y};
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

    update(){
         
        if (this.type === 'linear'){
            this.x += this.vel.x;
            this.y += this.vel.y;
        } else if (this.type === 'homing'){
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vel.x = Math.cos(angle);
            this.vel.y = Math.sin(angle);

            this.x += this.vel.x;
            this.y += this.vel.y;
            this.color = 'red';
            this.strokeColor = 'blue';
        } else if (this.type === 'spinning'){
            this.radians += 0.05;
            this.center.x += this.vel.x;
            this.center.y += this.vel.y;
            this.x = this.center.x + Math.cos(this.radians) * this.spinningRadius;
            this.y = this.center.y + Math.sin(this.radians) * this.spinningRadius;
        } else if (this.type === 'homeSpinning'){
            this.strokeColor = 'white';
            this.lineWidth = 3;

            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            this.vel.x = Math.cos(angle);
            this.vel.y = Math.sin(angle);

            this.radians += 0.05;
            this.center.x += this.vel.x;
            this.center.y += this.vel.y;

            this.x = this.center.x + Math.cos(this.radians) * this.spinningRadius;
            this.y = this.center.y + Math.sin(this.radians) * this.spinningRadius;
        } 

        
        this.draw();
    }
}

function spawnEnemies() {
    setInterval(()=>{
        const radius = randomNumBetween(20, 50);
        let x;
        let y;
        // Ensure enemies spawn from the edge
        if (Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - radius: canvas.width + radius;
            y = Math.random()*canvas.height;
        } else {
            x = Math.random()*canvas.width;
            y = Math.random() < 0.5 ? 0 - radius: canvas.height + radius;
        }

        

        const color = randomRGB();

        const angle = Math.atan2(player.y- y, player.x - x);
        const enemyVelocity = {x: Math.cos(angle), y: Math.sin(angle)}    
        
        enemies.push(new Enemy(x, y, radius, color, enemyVelocity));
    }, enemyInterval)
}

function spawnPowerUps() {
    setInterval(() => {    
        let x;
        let y;
        // Ensure enemies spawn from the edge
        if (Math.random() < 0.5){
            x = Math.random() < 0.5 ? 0 - 7: canvas.width + 7;
            y = Math.random()*canvas.height;
        } else {
            x = Math.random()*canvas.width;
            y = Math.random() < 0.5 ? 0 - 9: canvas.height + 9;
        }

        const angle = Math.atan2(canvas.height/2 - y, canvas.width/2 - x);
        const powerUpVelocity = {
            x: Math.cos(angle),
            y: Math.sin(angle)
        }

        powerUps.push(new PowerUp(x, y, powerUpVelocity))
    }, 10000)
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

const friction = 0.99;
class Particle extends Projectile
{
    constructor(x, y, radius, color, vel){
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

    update(){
        this.draw();
        this.vel.x *= friction;
        this.vel.y *= friction;
        this.x += this.vel.x;
        this.y += this.vel.y;
        this.alpha -= 0.01;
    }
}




let animationID;
let frame = 0;
function animate(){
    
    animationID = requestAnimationFrame(animate);
    frame++;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    backgroundParticles.forEach((backgroundParticle) => {
        const dist = Math.hypot(
          player.x - backgroundParticle.x,
          player.y - backgroundParticle.y
        )
    
        const hideRadius = 100
        if (dist < hideRadius) {
          if (dist < 70) {
            backgroundParticle.alpha = 0
          } else {
            backgroundParticle.alpha = 0.5
          }
        } else if (
          dist >= hideRadius &&
          backgroundParticle.alpha < backgroundParticle.initialAlpha
        ) {
          backgroundParticle.alpha += 0.01
        } else if (
          dist >= hideRadius &&
          backgroundParticle.alpha > backgroundParticle.initialAlpha
        ) {
          backgroundParticle.alpha -= 0.01
        }
    
        backgroundParticle.update()
      })
    player.draw();
    player.checkEdges();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0){
            particles.splice(index, 1);
        } else {
            particle.update();
        }    
    });


    // Power ups
    if (player.powerUp === 'Automatic' && mouse.down) {
        if (frame % 10 === 0){
            player.shoot(mouse, '#FFF500');
        }
    }

    powerUps.forEach((powerUp, index) => {
        const dist = Math.hypot(player.x - powerUp.x, player.y - powerUp.y);

        // if power up go out of canvas
        // if enemies go out of the canvas
        if (powerUp.x - powerUp.width/2 > canvas.width + 50 ||
            powerUp.x + powerUp.height/2 < 0 - 50 ||
            powerUp.y - powerUp.width/2 > canvas.height + 50||
            powerUp.y + powerUp.height/2 < 0 - 50) {
                powerUps.splice(index, 1);
            }
        
        // if player got the power up
        if (dist < player.radius + powerUp.width/2){
            player.color = '#FFF500';
            player.powerUp = 'Automatic';
            powerUps.splice(index, 1);

            setTimeout(() => {
                player.powerUp = null;
                player.color = '#FFFFFF'
            }, 10000)
        } else {
            powerUp.update()
        }
    })

    projectiles.forEach((projectile, index)=> {
        projectile.update();
        if (projectile.x + projectile.radius < 0 || 
            projectile.x - projectile.radius > canvas.width || 
            projectile.y + projectile.radius < 0 || 
            projectile.y - projectile.radius > canvas.height){
            setTimeout(()=>{
                projectiles.splice(index, 1);
            }, 0);
        }
    });
    // console.log(powerUps)
    enemies.forEach((enemy, index) => {

        // if enemies go out of the canvas
        if (enemy.x - enemy.radius > canvas.width + 200 ||
            enemy.x + enemy.radius < 0 - 200 ||
            enemy.y - enemy.radius > canvas.height + 200||
            enemy.y + enemy.radius < 0 - 200) {
                enemies.splice(index, 1);
            }


        enemy.update();
        // console.log(enemy);
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        // Gameover conditions
        if (dist < player.radius+enemy.radius){
            cancelAnimationFrame(animationID);
            gameOverScore.textContent = score;
            container.classList.toggle('hidden');
        }

        projectiles.forEach((projectile, projectileIndex )=>{
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            // collision detection
            if (dist < projectile.radius+enemy.radius + 1){
                // Create explosion
                
                for (let i = 0; i < enemy.radius*2; i++){
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * enemy.radius/8, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random()*6), 
                        y: (Math.random() -0.5) * (Math.random()*6) 
                    }));
                }

                if (enemy.radius > 25){
                    score += 50;
                    createScoreLabel(projectile, 50)
                    
                    gsap.to(enemy, {
                        radius: enemy.radius - 15
                    });
                    setTimeout(()=>{
                        projectiles.splice(projectileIndex, 1);
                    }, 0);    

                } else {
                    score += 100;
                    createScoreLabel(projectile, 100)
                    
                    setTimeout(()=>{
                        enemies.splice(index, 1);
                        projectiles.splice(projectileIndex, 1);
                    }, 0);    
                }
                scoreBoard.textContent = `Score: ${score}`;
            }   
        })
    })
}

const mouse = {
    down: false,
    x: undefined,
    y: undefined
}

addEventListener('mousedown', ({ clientX, clientY }) => {
    mouse.x = clientX
    mouse.y = clientY

    mouse.down = true
})

addEventListener('mousemove', ({ clientX, clientY }) => {
    mouse.x = clientX
    mouse.y = clientY
})

addEventListener('mouseup', () => {
    mouse.down = false
})

addEventListener('click', ({ clientX, clientY }) => {   
    mouse.x = clientX
    mouse.y = clientY
    player.shoot(mouse)
})



const container = document.querySelector('.container');
const startBtn = document.querySelector('button');
startBtn.addEventListener('click', () => {
    
    init();
    animate();
    spawnPowerUps();
    spawnEnemies();
    container.classList.toggle('hidden');
});




// Control player
var keyState = {};

window.addEventListener('keydown',function(e){
    keyState[e.keypress || e.which] = true;
},true);

window.addEventListener('keyup',function(e){
    keyState[e.keypress || e.which] = false;
},true);



function keyLoop() {
    if (keyState[37] || keyState[65]){
    player.x -= player.speed;
    }

    if (keyState[39] || keyState[68]){
        player.x += player.speed;
    }

    if (keyState[38] || keyState[87]){
        player.y -= player.speed;
    }

    if (keyState[40] || keyState[83]){
        player.y += player.speed;
    }
    
    setTimeout(keyLoop, 5);
}

keyLoop();

