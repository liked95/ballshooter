console.log(gsap)
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

const speed = 3;
const projectileRadius = 5;

class Player{
    constructor(x, y, radius, color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        // moving speed
        this.vel = 10;

        addEventListener('keydown', e => {
            switch (e.key) {
                case 'a':
                    this.x -= this.vel;
                    break;
                case 'd':
                    this.x += this.vel;
                    break;
                case 'w':
                    this.y -= this.vel;
                    break;
                case 's':
                    this.y += this.vel;
                    break;
            }
        });
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}
let enemyInterval = 2000;
const x = canvas.width/2;
const y = canvas.height/2;
let player = new Player(x, y, 30, 'white')
let projectiles = [];
let enemies = [];
let particles = [];
let score = 0;

function init(){
    player = new Player(x, y, 30, 'white')
    projectiles = [];
    enemies = [];
    particles = [];
    score = 0;
    scoreBoard.textContent = `Score: 0`;
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

class Enemy extends Projectile{
    constructor(x, y, radius, color, vel){
        super(x, y, radius, color, vel);
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }

}

const friction = 0.97;
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
function animate(){
    console.log(particles.length)
    animationID = requestAnimationFrame(animate);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    player.draw();
    particles.forEach((particle, index) => {
        if (particle.alpha <= 0){
            particles.splice(index, 1);
        } else {
            particle.update();
        }    
    });
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

    enemies.forEach((enemy, index) => {
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
            if (dist <= projectile.radius+enemy.radius){
                // Create explosion
                
                for (let i = 0; i < enemy.radius*2; i++){
                    particles.push(new Particle(projectile.x, projectile.y, Math.random() * enemy.radius/8, enemy.color, {
                        x: (Math.random() - 0.5) * (Math.random()*6), 
                        y: (Math.random() -0.5) * (Math.random()*6) 
                    }));
                }

                if (enemy.radius > 25){
                    score += 50;
                    
                    gsap.to(enemy, {
                        radius: enemy.radius - 15
                    });
                    setTimeout(()=>{
                        projectiles.splice(projectileIndex, 1);
                    }, 0);    

                } else {
                    score += 100;
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

addEventListener('click', e =>{
    
    const angle = Math.atan2(e.clientY - player.y, e.clientX - player.x);
    const baseVelocity = {x: speed*Math.cos(angle), y: speed*Math.sin(angle)}    

    const projectile = new Projectile(player.x + player.radius*Math.cos(angle), player.y + player.radius*Math.sin(angle), projectileRadius, 'orange', baseVelocity);
    projectiles.push(projectile);
});



const container = document.querySelector('.container');
const startBtn = document.querySelector('button');
startBtn.addEventListener('click', () => {
    
    init();
    animate();
    spawnEnemies();
    container.classList.toggle('hidden');
});



