const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// =============================== PLAYER FORMULAS =============================== //

function expand_radius() {
    // Pieces of food eaten
    let expand_by = 2*(Math.pow(0.01, 0.005*count))
    count += 1
    return expand_by
}

function change_speed() {
    speed = 5 * (Math.pow(0.99, 0.1*count))
}

function random_respawn_coords() {
    backgroundBorder.x = Math.random() * backgroundBorder.radius;
    backgroundBorder.y = Math.random() * backgroundBorder.radius;

    const bdx = player.x - backgroundBorder.x;
    const bdy = player.y - backgroundBorder.y;
    const bd_dist = Math.sqrt((bdx * bdx) + (bdy * bdy))

    if (bd_dist >= backgroundBorder.radius) {
        random_respawn_coords()
    }
}

// =============================== VARIABLES =============================== //
let username = null;

while (username === null || username.trim() === '') {
    username = prompt('Enter a username: ');
};

let mouseX = 0;
let mouseY = 0;

let speed = 5;
let playing = true;

let backgroundBorder = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    radius: 1000,
    startAngle: 0,
    endAngle: Math.PI * 2,
    drawBorder: () => {
        ctx.fillStyle = '#006400'
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
        random_respawn_coords()
        playing = true
    }
}

// Food managment
let food = []
let pieces_on_screen = 20
count = 0

// =============================== EVENT LISTENERS =============================== //

// Follow mouse position
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});


// Resume button (esc)
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        playing = !playing;
        if (playing) play()
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
    curr_on_screen = 20 - food.length;

    // Add new dots if 20 aren't on screen
    while (curr_on_screen != 0) {
        const random_x = Math.random() * window.innerWidth;
        const random_y = Math.random() * window.innerHeight;
        
        food.push(
            {
                x: random_x,
                y: random_y,
                color: `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
            }
        );
        curr_on_screen -= 1;
    };
    

    // Eat food
    food = food.filter((item) => {
        check_off_screen_food(item);
        fdx = item.x - player.x
        fdy = item.y - player.y

        distance_from_player = Math.sqrt(fdx * fdx + fdy * fdy)

        // If food is outside player body
        if (distance_from_player > player.radius) {
            item.x -= (dx / distance) * speed;
            item.y -= (dy / distance) * speed;
        } else {
            player.radius += expand_radius()
            change_speed()
            return false
        }
        return true
    });

    food.forEach((item) => {
        ctx.fillStyle = item.color;
        ctx.beginPath()
        ctx.arc(item.x, item.y, 10, 0, Math.PI * 2)
        ctx.fill()
    })
};

// ================================ socket code ================================
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

            ctx.fillStyle = 'whit';
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
    
    requestAnimationFrame(play);
};

getCoords();
console.log(players);
play();
