const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');
canvas.width = window.innerHeight;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerHeight;
    canvas.height = window.innerHeight;
    ctx.fillStyle = 'white';
    ctx.fillRect(10, 10, 50, 50);
});

const player = {
    x: 200,
    y: 200,
    radius: 50,
    
}

window.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.fillStyle = 'white'
    ctx.beginPath()
    ctx.arc(x, y, 50, 0, Math.PI * 2)
    ctx.fill()
})

ctx.fillStyle = 'white';
ctx.beginPath();
ctx.arc(100, 100, 50, 0, Math.PI * 2);
ctx.fill();
