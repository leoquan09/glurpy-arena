const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 50,
    startAngle: 0,
    endAngle: Math.PI * 2,
    drawPlayer: () => {
        ctx.fillStyle = 'white'
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, player.startAngle, player.endAngle);
        ctx.fill();
    }
}

let mouseX = canvas.width/2;
let mouseY = canvas.height/2;

let speed = 5;
let playing = true;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function loop() {
    if (!playing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > speed) {
        player.x += (dx / distance) * speed;
        player.y += (dy / distance) * speed;
    } else {
        player.x = mouseX;
        player.y = mouseY;
    }

    player.drawPlayer();
    
    requestAnimationFrame(loop);
}

loop();
