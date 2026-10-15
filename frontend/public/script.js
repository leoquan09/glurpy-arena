const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =============================== VARIABLES =============================== //

let mouseX = canvas.width / 2;
let mouseY = canvas.height / 2;

let speed = 5;

let playing = true;

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
    }
}

// Food managment
let food = []
let pieces_on_screen = 20

// Food reset function
function check_off_screen_food(x, y) {
    if (x < 0) {
        x += window.innerWidth;
        y = Math.random() * window.innerHeight;
    } else if (x > window.innerWidth) {
        x -= window.innerWidth;
        y = Math.random() * window.innerHeight;
    } else if (y < 0) {
        y += window.innerHeight;
        x = Math.random() * window.innerWidth;
    } else if (y > window.innerHeight) {
        y -= window.innerHeight;
        x = Math.random() * window.innerWidth;
    }
}

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

// Mouse move
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

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
        fdx = item.x - player.x
        fdy = item.y - player.y

        distance_from_player = Math.sqrt(fdx * fdx + fdy * fdy)

        // If food is outside player body
        if (distance_from_player > player.radius) {
            item.x -= (dx / distance) * speed;
            item.y -= (dy / distance) * speed;
        } else {
            // player.radius += 1
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


// =============================== PLAY f(x) =============================== //
function play() {
    if (!playing) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Distance from player to mouse
    let dx = mouseX - player.x;
    let dy = mouseY - player.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    control_food(dx, dy, distance);
    
    player.drawPlayer();
    
    requestAnimationFrame(play);
}

play();
