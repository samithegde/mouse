let locked = true
history.pushState(null, "", location.href)

window.onpopstate = () => {
  if (locked) history.pushState(null, "", location.href)
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") locked = false
})

let clicks = 0
let start = null
const cpsValue = document.getElementById("cpsValue")

document.getElementById("cps").addEventListener("mousedown", e => {
  if (!start) {
    start = performance.now()
    clicks = 0
  }
  clicks++
  let elapsed = (performance.now() - start) / 1000
  cpsValue.textContent = (clicks / elapsed).toFixed(2) + " CPS"
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
