let locked = true
history.pushState(null, "", location.href)

onpopstate = () => locked && history.pushState(null, "", location.href)

addEventListener("keydown", e => e.key === "Escape" && (locked = false))

let clicks = 0
let start = null
const cpsValue = document.getElementById("cpsValue")

const canvas = document.getElementById("fx")
const ctx = canvas.getContext("2d")
let particles = []

function resize() {
  canvas.width = innerWidth
  canvas.height = innerHeight
}
resize()
addEventListener("resize", resize)

function firework(x, y) {
  for (let i = 0; i < 18; i++) {
    let a = Math.random() * Math.PI * 2
    let s = Math.random() * 4 + 1
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 40 })
  }
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  particles = particles.filter(p => p.life-- > 0)
  for (let p of particles) {
    p.x += p.vx
    p.y += p.vy
    ctx.fillStyle = `rgba(255,180,80,${p.life / 40})`
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
  requestAnimationFrame(animate)
}
animate()

document.getElementById("cps").addEventListener("mousedown", e => {
  start ??= performance.now()
  clicks++
  cpsValue.textContent = ((clicks) / ((performance.now() - start) / 1000)).toFixed(2) + " CPS"
  firework(e.clientX, e.clientY)
})

let lastScroll = 0
let lastTime = performance.now()
const scrollValue = document.getElementById("scrollValue")

document.getElementById("scroll").addEventListener("scroll", e => {
  let now = performance.now()
  let delta = Math.abs(e.target.scrollTop - lastScroll)
  let speed = delta / ((now - lastTime) / 1000)
  scrollValue.textContent = Math.round(speed) + " px/s"
  lastScroll = e.target.scrollTop
  lastTime = now
})
