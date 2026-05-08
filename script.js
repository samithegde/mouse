let locked = true
let ignoreHistoryMove = false

function lockHistory() {
  if (history.state?.mouseTrap === "center") return

  ignoreHistoryMove = true
  history.replaceState({ mouseTrap: "backstop" }, "", location.href)
  history.pushState({ mouseTrap: "center" }, "", location.href)
  history.pushState({ mouseTrap: "forwardstop" }, "", location.href)
  history.back()

  setTimeout(() => {
    ignoreHistoryMove = false
  }, 80)
}

function pulseHistoryWave(direction) {
  const x = direction === "back" ? innerWidth * 0.22 : innerWidth * 0.78
  wave(x, innerHeight * 0.5, direction)
}

lockHistory()

addEventListener("popstate", e => {
  if (!locked || ignoreHistoryMove) return

  if (!e.state?.mouseTrap) {
    lockHistory()
    return
  }

  if (e.state.mouseTrap === "center") return

  const direction = e.state.mouseTrap === "forwardstop" ? "forward" : "back"
  pulseHistoryWave(direction)
  ignoreHistoryMove = true

  if (direction === "back") {
    history.forward()
  } else {
    history.back()
  }

  setTimeout(() => {
    ignoreHistoryMove = false
  }, 80)
})

addEventListener("keydown", e => e.key === "Escape" && (locked = false))

const cps = document.getElementById("cps")
const cpsValue = document.getElementById("cpsValue")
const totalClicks = document.getElementById("totalClicks")
const cpsSeconds = document.getElementById("cpsSeconds")
const cpsTimer = document.getElementById("cpsTimer")
const resetCps = document.getElementById("resetCps")

const scrollValue = document.getElementById("scrollValue")
const scrollBox = document.getElementById("scrollBox")
const scrollContent = document.getElementById("scrollContent")
const scrollSeconds = document.getElementById("scrollSeconds")
const scrollTimer = document.getElementById("scrollTimer")
const resetScroll = document.getElementById("resetScroll")

const canvas = document.getElementById("fx")
const ctx = canvas.getContext("2d")
let particles = []
let waves = []

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

function wave(x, y, direction) {
  const isBack = direction === "back"
  waves.push({
    x,
    y,
    direction: isBack ? -1 : 1,
    hue: isBack ? 195 : 285,
    life: 46,
    maxLife: 46
  })
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  waves = waves.filter(w => w.life-- > 0)
  for (let w of waves) {
    const progress = 1 - w.life / w.maxLife
    const alpha = 1 - progress

    ctx.save()
    ctx.globalCompositeOperation = "lighter"
    ctx.lineCap = "round"

    for (let i = 0; i < 4; i++) {
      const radius = progress * 260 + i * 34
      ctx.strokeStyle = `hsla(${w.hue + i * 18}, 95%, 62%, ${alpha * (0.45 - i * 0.07)})`
      ctx.lineWidth = 8 - i
      ctx.beginPath()
      ctx.arc(w.x, w.y, radius, 0, Math.PI * 2)
      ctx.stroke()
    }

    ctx.strokeStyle = `hsla(${w.hue + 40}, 100%, 70%, ${alpha * 0.6})`
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(w.x, w.y)
    for (let i = 0; i < 9; i++) {
      const distance = i * 52 * w.direction
      const lift = Math.sin(progress * Math.PI * 3 + i) * 26 * alpha
      ctx.lineTo(w.x + distance, w.y + lift)
    }
    ctx.stroke()
    ctx.restore()
  }

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

let lastSideButtonEvent = { button: -1, time: 0 }

function showSideButtonWave(e) {
  if (e.button !== 3 && e.button !== 4) return

  e.preventDefault()
  e.stopPropagation()

  const now = performance.now()
  if (lastSideButtonEvent.button === e.button && now - lastSideButtonEvent.time < 80) return
  lastSideButtonEvent = { button: e.button, time: now }

  wave(e.clientX, e.clientY, e.button === 3 ? "back" : "forward")
}

addEventListener("pointerdown", showSideButtonWave, true)
addEventListener("mousedown", showSideButtonWave, true)
addEventListener("mouseup", showSideButtonWave, true)
addEventListener("auxclick", showSideButtonWave, true)

function getSeconds(input) {
  const seconds = Number(input.value)
  return Number.isFinite(seconds) ? Math.min(300, Math.max(1, seconds)) : 10
}

function makeTimedTest(input, timer, onTick, onEnd) {
  let start = 0
  let duration = getSeconds(input)
  let running = false
  let finished = false
  let frame = 0

  function setTimerText(remaining = duration) {
    timer.textContent = `${remaining.toFixed(1)}s`
  }

  function tick() {
    const elapsed = (performance.now() - start) / 1000
    const remaining = Math.max(0, duration - elapsed)
    setTimerText(remaining)
    onTick(elapsed, remaining)

    if (remaining <= 0) {
      running = false
      finished = true
      onEnd(duration)
      return
    }

    frame = requestAnimationFrame(tick)
  }

  function begin() {
    if (finished) return false
    if (!running) {
      duration = getSeconds(input)
      input.value = duration
      start = performance.now()
      running = true
      tick()
    }
    return true
  }

  function reset() {
    cancelAnimationFrame(frame)
    duration = getSeconds(input)
    input.value = duration
    running = false
    finished = false
    setTimerText()
  }

  input.addEventListener("change", reset)
  reset()

  return { begin, reset, isRunning: () => running, isFinished: () => finished }
}

let clicks = 0
let total = 0

const cpsTest = makeTimedTest(
  cpsSeconds,
  cpsTimer,
  elapsed => {
    const seconds = Math.max(elapsed, 0.001)
    cpsValue.textContent = (clicks / seconds).toFixed(2) + " CPS"
  },
  duration => {
    cpsValue.textContent = (clicks / duration).toFixed(2) + " CPS"
  }
)

function resetCpsTest() {
  clicks = 0
  total = 0
  cpsValue.textContent = "0 CPS"
  totalClicks.textContent = "0 clicks"
  cpsTest.reset()
}

cps.addEventListener("mousedown", e => {
  if (e.button !== 0) return
  if (e.target.closest("input, button")) return
  if (!cpsTest.begin()) return

  clicks++
  total++
  totalClicks.textContent = total + " clicks"
  firework(e.clientX, e.clientY)
})

resetCps.addEventListener("click", resetCpsTest)
cpsSeconds.addEventListener("change", resetCpsTest)

let lastScroll = 0
let lastTime = performance.now()
let scrollDistance = 0
let lastWheelTime = 0

requestAnimationFrame(() => {
  scrollBox.scrollTop = scrollContent.offsetHeight / 2
  lastScroll = scrollBox.scrollTop
})

const scrollTest = makeTimedTest(
  scrollSeconds,
  scrollTimer,
  elapsed => {
    const seconds = Math.max(elapsed, 0.001)
    scrollValue.textContent = Math.round(scrollDistance / seconds) + " px/s"
  },
  duration => {
    scrollValue.textContent = Math.round(scrollDistance / duration) + " px/s"
  }
)

function resetScrollTest() {
  scrollDistance = 0
  scrollValue.textContent = "0 px/s"
  scrollTest.reset()
}

scrollBox.addEventListener("wheel", e => {
  if (!scrollTest.begin()) return
  lastWheelTime = performance.now()
  scrollDistance += Math.abs(e.deltaY)
}, { passive: true })

scrollBox.addEventListener("scroll", () => {
  let now = performance.now()
  let top = scrollBox.scrollTop
  let max = scrollContent.offsetHeight - scrollBox.clientHeight

  if (top < max * 0.25) {
    scrollBox.scrollTop = top + max * 0.5
    lastScroll = scrollBox.scrollTop
    return
  }

  if (top > max * 0.75) {
    scrollBox.scrollTop = top - max * 0.5
    lastScroll = scrollBox.scrollTop
    return
  }

  let delta = Math.abs(top - lastScroll)
  let speed = delta / ((now - lastTime) / 1000)

  if (scrollTest.isRunning() && delta > 0 && now - lastWheelTime > 80) {
    scrollDistance += delta
    scrollValue.textContent = Math.round(speed) + " px/s"
  }

  lastScroll = top
  lastTime = now
})

resetScroll.addEventListener("click", resetScrollTest)
scrollSeconds.addEventListener("change", resetScrollTest)

// Dropdown menu toggle
document.getElementById("creatorBtn").addEventListener("click", () => {
  const dropdown = document.getElementById("dropdown");
  dropdown.classList.toggle("opacity-0");
  dropdown.classList.toggle("invisible");
  dropdown.classList.toggle("translate-y-2");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const btn = document.getElementById("creatorBtn");
  const dropdown = document.getElementById("dropdown");
  if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.add("opacity-0");
    dropdown.classList.add("invisible");
    dropdown.classList.add("translate-y-2");
  }
});

// Splash screen fade out
window.addEventListener('load', () => {
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.style.transition = 'opacity 1s';
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
    }, 1000);
  }, 2000);
});
