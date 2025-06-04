// Confetti Animation for Vanilla JavaScript
// A customizable confetti effect that can be added to any website

// Canvas setup
const canvas = document.getElementById("confetti-canvas")
const ctx = canvas.getContext("2d")
canvas.width = window.innerWidth
canvas.height = window.innerHeight

// Confetti particles array
let confetti = []

// Animation frame ID for stopping the animation
let animationId = null

// Confetti configuration
const confettiConfig = {
  particleCount: 150,
  gravity: 0.2,
  terminalVelocity: 5,
  drag: 0.075,
  colors: [
    "#f44336",
    "#e91e63",
    "#9c27b0",
    "#673ab7",
    "#3f51b5",
    "#2196f3",
    "#03a9f4",
    "#00bcd4",
    "#009688",
    "#4CAF50",
    "#8BC34A",
    "#CDDC39",
    "#FFEB3B",
    "#FFC107",
    "#FF9800",
    "#FF5722",
  ],
}

// Confetti particle class
class ConfettiParticle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.size = Math.random() * 10 + 5 // Random size between 5-15
    this.weight = Math.random() * 1 + 0.5 // Random weight for falling speed
    this.directionX = Math.random() * 2 - 1 // Random horizontal direction
    this.directionY = Math.random() * 5 + 1 // Random vertical direction (downward)
    this.color = confettiConfig.colors[Math.floor(Math.random() * confettiConfig.colors.length)]
    this.shape = Math.random() > 0.5 ? "circle" : "rectangle" // 50% chance for each shape
    this.angle = Math.random() * 360 // Random rotation angle
    this.rotation = Math.random() * 3 // Rotation speed
    this.opacity = 1
  }

  update() {
    // Apply gravity
    this.directionY += this.weight * confettiConfig.gravity

    // Apply drag
    this.directionX *= 1 - confettiConfig.drag

    // Limit falling speed to terminal velocity
    if (this.directionY > confettiConfig.terminalVelocity) {
      this.directionY = confettiConfig.terminalVelocity
    }

    // Update position
    this.x += this.directionX
    this.y += this.directionY

    // Update rotation
    this.angle += this.rotation

    // Fade out as it falls
    if (this.y > canvas.height * 0.7) {
      this.opacity -= 0.01
    }
  }

  draw() {
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.rotate((this.angle * Math.PI) / 180)
    ctx.fillStyle = this.color
    ctx.globalAlpha = this.opacity

    if (this.shape === "circle") {
      ctx.beginPath()
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size)
    }

    ctx.restore()
  }
}

// Create confetti particles
function createConfetti() {
  for (let i = 0; i < confettiConfig.particleCount; i++) {
    // Start from random positions at the top of the screen
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height * -0.5 // Start above the visible area
    confetti.push(new ConfettiParticle(x, y))
  }
}

// Animation loop
function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Update and draw each confetti particle
  for (let i = 0; i < confetti.length; i++) {
    confetti[i].update()
    confetti[i].draw()

    // Remove particles that are out of view or fully transparent
    if (confetti[i].y > canvas.height || confetti[i].opacity <= 0) {
      confetti.splice(i, 1)
      i--
    }
  }

  // Stop animation when all particles are gone
  if (confetti.length > 0) {
    animationId = requestAnimationFrame(animateConfetti)
  }
}

// Handle window resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
})

// Public functions to control the confetti
function startConfetti() {
  // Clear any existing confetti
  confetti = []

  // Create new confetti particles
  createConfetti()

  // Start the animation
  if (!animationId) {
    animateConfetti()
  }
}

function stopConfetti() {
  // Cancel the animation
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Clear the confetti array
  confetti = []
}

// You can customize the confetti by modifying these settings
function setConfettiConfig(options) {
  Object.assign(confettiConfig, options)
}
