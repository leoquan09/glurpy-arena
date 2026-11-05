const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// =============================== PLAYER FORMULAS =============================== //

function expand_radius() {
    const foodMass = 15; 
    const currentArea = Math.PI * player.radius * player.radius;
    const newArea = currentArea + foodMass;
    const newRadius = Math.sqrt(newArea / Math.PI);

    return newRadius - player.radius;
}

function change_speed() {
    speed = Math.max(2, 5 * (Math.pow(0.99, 0.1 * count)));
}

function random_respawn_coords() {
    let bd_dist = 0;
    let attempts = 0;
    do {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * (backgroundBorder.radius * 0.7);
        backgroundBorder.x = player.x + Math.cos(angle) * dist;
        backgroundBorder.y = player.y + Math.sin(angle) * dist;

        const bdx = player.x - backgroundBorder.x;
        const bdy = player.y - backgroundBorder.y;
        bd_dist = Math.sqrt((bdx * bdx) + (bdy * bdy));
        
        attempts++;
        if (attempts > 100) break;
    } while (bd_dist >= backgroundBorder.radius);
}

// =============================== VARIABLES =============================== //
const username = localStorage.getItem('username') || 'Player';
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let speed = 5;
let count = 0;
let playing = true;
let food = [];
const pieces_on_screen = 20;

let backgroundBorder = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    radius: 1000,
    startAngle: 0,
    endAngle: Math.PI * 2,
    drawBorder: () => {
        ctx.fillStyle = '#3c6544'
        ctx.beginPath();
        ctx.arc(backgroundBorder.x, backgroundBorder.y, backgroundBorder.radius, backgroundBorder.startAngle, backgroundBorder.endAngle);
        ctx.fill();
    }
};

// Set up player
const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 25,
    startAngle: 0,
    endAngle: Math.PI * 2,
    drawPlayer: () => {
        ctx.fillStyle = 'white'
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, player.startAngle, player.endAngle);
        ctx.fill();
    },

    respawn: () => {
        playing = false;
        alert("Respawning...");
        random_respawn_coords();
        playing = true;
        requestAnimationFrame(play);
    },
    resetRadius: () => {
        player.radius = 50;
        console.log('radius changed');
    }
};


// =============================== EVENT LISTENERS =============================== //

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Follow mouse position
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});


// Resume button (esc)
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        playing = !playing;
        if (playing) { play() } 
        else { window.location.href = "/"; }
    };
});


// =============================== RESET OFF-SCREEN FOOD COORDS f(x) =============================== //

function check_off_screen_food(item) {
    if (item.x < 0) {
        item.x += window.innerWidth;
        item.y = Math.random() * window.innerHeight;
    } else if (item.x > window.innerWidth) {
        item.x -= window.innerWidth;
        item.y = Math.random() * window.innerHeight;
    } else if (item.y < 0) {
        item.y += window.innerHeight;
        item.x = Math.random() * window.innerWidth;
    } else if (item.y > window.innerHeight) {
        item.y -= window.innerHeight;
        item.x = Math.random() * window.innerWidth;
    }
}


// =============================== CONTROL FOOD f(x) =============================== //

function control_food(dx, dy, distance) {
    let curr_on_screen = pieces_on_screen - food.length;

    while (curr_on_screen > 0) {
        let random_x, random_y, dist_to_player;
        let spawnAttempts = 0;
        
        do {
            random_x = Math.random() * window.innerWidth;
            random_y = Math.random() * window.innerHeight;
            const fdx = random_x - player.x;
            const fdy = random_y - player.y;
            dist_to_player = Math.sqrt(fdx * fdx + fdy * fdy);
            
            spawnAttempts++;
            if (spawnAttempts > 50) break; 
        } while (dist_to_player < player.radius + 20); 

        food.push({
            x: random_x,
            y: random_y,
            color: `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
        });
        curr_on_screen -= 1;
    }
    
    let totalGrowth = 0;

    food = food.filter((item) => {
        check_off_screen_food(item);
        let fdx = item.x - player.x;
        let fdy = item.y - player.y;

        let distance_from_player = Math.sqrt(fdx * fdx + fdy * fdy);

        if (distance_from_player > player.radius + 10) { // +10 accounts for food radius
            if (distance > 0) {
                item.x -= (dx / distance) * speed;
                item.y -= (dy / distance) * speed;
            }
            return true;
        } else {
            totalGrowth += expand_radius();
            count += 1;
            return false; // Remove food item
        }
    });

    if (totalGrowth > 0) {
        player.radius += totalGrowth;
        change_speed();
    }

    food.forEach((item) => {
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ================================ socket code ================================ //
const socket = io();
let id = null;
let players = []

function sendCoords(borderX, borderY, radius) {
    socket.emit('screen refresh', {
        username: username,
        borderX: borderX,
        borderY: borderY,
        radius: radius
    });
};

function getCoords() {
    socket.on('player update', (data) => {
        if (data.id === id) return;

        let existingPlayer = players.find(p => p.id === data.id);

        if (existingPlayer) {
            existingPlayer.borderX = data.borderX;
            existingPlayer.borderY = data.borderY;
            existingPlayer.radius = data.radius;
        } else {
            players.push({
                id: data.id,
                username: data.username,
                borderX: data.borderX,
                borderY: data.borderY,
                radius: data.radius
            });
        };
        console.log(data)
    });
    
    socket.on('disconnection', (user_id) => {
        players = players.filter(p => p.id !== user_id);
        spawn_others();
    });
};

function spawn_others(bdx, bdy) {
    players.forEach((enemy) => {
        const screenX = player.x + (enemy.borderX - bdx);
        const screenY = player.y + (enemy.borderY - bdy);

        if (enemy.radius) {
            ctx.fillStyle = 'rgba(230, 70, 70, 0.9)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, enemy.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(enemy.username || 'Player', screenX, screenY - enemy.radius - 10);
        }
    });
}

function play() {
    if (!playing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const bdx = player.x - backgroundBorder.x;
    const bdy = player.y - backgroundBorder.y;
    const bd_dist = Math.sqrt((bdx * bdx) + (bdy * bdy));

    sendCoords(bdx, bdy, player.radius);

    if (distance > 0) {
        if (bd_dist < backgroundBorder.radius) {
            backgroundBorder.x -= (dx / distance) * speed;
            backgroundBorder.y -= (dy / distance) * speed;
        } else {
            player.respawn();
        }
    }
    
    backgroundBorder.drawBorder();
    control_food(dx, dy, distance);
    player.drawPlayer();
    spawn_others(bdx, bdy);
    
    requestAnimationFrame(play);``
};

getCoords();
console.log(players);
play();
