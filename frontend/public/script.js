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
    radius: 500,
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


// ============================== SOCKET CODE ============================= //
const socket = io()

let players = [];
let id = null;

socket.on('connect', () => {
    console.log('clientside verification: complete');
    id = socket.id;
})

function sendCoords(x, y) {
    socket.emit('screen refresh', {
        username: username,
        x: x,
        y: y
    });
};

function getCoords() {
    socket.on('player update', (data) => {
        if (data.id === id) return;

        let existingPlayer = players.find(p => p.id === data.id);

        if (existingPlayer) {
            existingPlayer.x = data.x;
            existingPlayer.y = data.y;
            console.log(data);
        } else {
            players.push({
                id: data.id,
                username: data.username,
                x: data.x,
                y: data.y
            });
            console.log(data)
        };
        console.log(players);
    });
};

// =============================== PLAY f(x) =============================== //
function play() {
    if (!playing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Distance from player to mouse
    const dx = mouseX - player.x;
    const dy = mouseY - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Distance from border center to player
    const bdx = player.x - backgroundBorder.x;
    const bdy = player.y - backgroundBorder.y;
    const bd_dist = Math.sqrt((bdx * bdx) + (bdy * bdy))

    // Broadcast coordinates to other players
    sendCoords(bdx, bdy);

    // Move background border relative to player
    if (distance > 0) {
        if (bd_dist < backgroundBorder.radius) {
            backgroundBorder.x -= (dx / distance) * speed;
            backgroundBorder.y -= (dy / distance) * speed;
        } else {
            player.respawn()
        }
    }
    
    backgroundBorder.drawBorder();
    
    control_food(dx, dy, distance);
    
    player.drawPlayer();
    
    requestAnimationFrame(play);
}

getCoords();
play();
