const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    radius: 50,
    startAngle: 0,
    endAngle: Math.PI * 2
}

let speed = 0.002
let playing = true

// Set player event listeners if playing game
if (playing) {
    // Player Move
    window.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Move Player
        ctx.fillStyle = 'white'
        player.x = player.x + (x - player.x) * speed;
        player.y = player.y + (y - player.y) * speed;
        ctx.beginPath()
        ctx.arc(player.x, player.y, 50, 0, Math.PI * 2)
        ctx.fill()

        // Make food dots
        const random_x = Math.random() * window.innerWidth
        const random_y = Math.random() * window.innerHeight

        ctx.fillStyle = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`
        ctx.beginPath()
        ctx.arc(random_x, random_y, 10, 0, Math.PI * 2)
        ctx.fill()
        
        animationID = requestAnimationFrame(animate)


    })


}
