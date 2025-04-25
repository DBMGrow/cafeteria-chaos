// GENERAL VARIABLES
var cnv
var score,
  points = 0
var lives,
  x = 0
var isPlay = false
var gravity = 0.1
var sword
var fruit = []
var fruitsList = ["apple", "banana", "peach", "strawberry", "watermelon", "boom"]
var fruitsImgs = [],
  slicedFruitsImgs = []
var livesImgs = [],
  livesImgs2 = []
var boom, spliced, missed, over, start // sounds
// var button, startButton;
// var timer;
// var counter = 60;
// var seconds, minutes;
var timerValue = 60
var leaderboardData = []
let fruitsSlicedPerPress = 0 // Counter for fruits sliced per mouse press

const playGameContainer = document.getElementById("playGameContainer")
const gameMenu = document.getElementById("gameMenu")
const logoutButtonBody = document.getElementById("logout")

function preload() {
  // LOAD SOUNDS
  boom = loadSound("sounds/boom.mp3")
  spliced = loadSound("sounds/splatter.mp3")
  missed = loadSound("sounds/missed.mp3")
  start = loadSound("sounds/start.mp3")
  over = loadSound("sounds/over.mp3")

  // LOAD IMAGES
  for (var i = 0; i < fruitsList.length - 1; i++) {
    slicedFruitsImgs[2 * i] = loadImage("images/" + fruitsList[i] + "-1.png")
    slicedFruitsImgs[2 * i + 1] = loadImage("images/" + fruitsList[i] + "-2.png")
  }
  for (var i = 0; i < fruitsList.length; i++) {
    fruitsImgs[i] = loadImage("images/" + fruitsList[i] + ".png")
  }
  for (var i = 0; i < 3; i++) {
    livesImgs[i] = loadImage("images/x" + (i + 1) + ".png")
  }
  for (var i = 0; i < 3; i++) {
    livesImgs2[i] = loadImage("images/xx" + (i + 1) + ".png")
  }
  bg = loadImage("images/background.jpg")
  foregroundImg = loadImage("images/home-mask.png")
  fruitLogo = loadImage("images/fruit.png")
  ninjaLogo = loadImage("images/ninja.png")
  scoreImg = loadImage("images/score.png")
  newGameImg = loadImage("images/new-game.png")
  fruitImg = loadImage("images/fruitMode.png")
  gameOverImg = loadImage("images/game-over.png")
  leaderboardImg = loadImage("images/leaderboards.png")
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(`http://localhost:3000/highscores`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    // updateLeaderboardUI(data)
    leaderboardData = data
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
  }
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(`http://localhost:3000/highscores`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    // updateLeaderboardUI(data)
    leaderboardData = data
  } catch (error) {
    console.error("Error fetching leaderboard:", error)
  }
}

async function fetchLocationsSession() {
  try {
    const response = await fetch(`http://localhost:3000/locations/session`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const session = await response.json()
    return session
  } catch (error) {
    console.error("Error fetching session:", error)
  }
}

async function useAddNewHighScores({ email, score }) {
  try {
    const response = await fetch(`http://localhost:3000/highscores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, score }),
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    console.log("High score submitted successfully:", result)
    return result
  } catch (error) {
    console.error("Error submitting high score:", error)
  }
}

let emailInput, passwordInput, loginButton, loginMessage

async function setup() {
  cnv = createCanvas(800, 635)
  cnv.parent("gameCanvas")
  sword = new Sword(color("#FFFFFF"))
  frameRate(60)
  score = 0
  lives = 3

  masterVolume(0)
  await fetchLeaderboard()

  const showLogin = await fetchLocationsSession()
  if (!showLogin) {
    showLoginForm()
  } else {
    drawLeaderboard()
    logoutButtonBody.style.display = "block"
  }
}

function draw() {
  clear()
  background(bg)

  image(this.foregroundImg, 0, 0, 800, 350)
  image(this.fruitLogo, 40, 20, 358, 195)
  image(this.ninjaLogo, 420, 50, 318, 165)
  image(this.newGameImg, 310, 360, 200, 200)
  image(this.fruitImg, 365, 415, 90, 90)

  cnv.mouseClicked(check)
  if (isPlay) {
    game()
  }

  //     if (timerValue >= 60) {
  //         text("0:" + timerValue, width / 2, height / 2);
  //     }
  //     if (timerValue < 60) {
  //         text('0:0' + timerValue, width / 2, height / 2);
  //     }
}

function check() {
  // Check for game start
  if (!isPlay && mouseX > 300 && mouseX < 520 && mouseY > 350 && mouseY < 550) {
    start.play()
    isPlay = true
  }
}

function game() {
  clear()
  background(bg)
  // gameMenu.style.display = "none"
  logoutButtonBody.style.display = "none"
  document.getElementById("leaderboard").style.display = "none"

  if (mouseIsPressed) {
    // Reset the counter when the mouse is pressed
    // if (frameCount % 2 === 0) {
    //   fruitsSlicedPerPress = 0;
    // }
    // Draw sword
    console.log("mouseIsPressed")
    sword.swipe(mouseX, mouseY)
  }

  if (frameCount % 5 === 0) {
    if (noise(frameCount) > 0.69) {
      fruit.push(randomFruit()) // Display new fruit
    }
    if (timerValue < 30) {
      if (noise(frameCount) > 0.69) {
        fruit.push(randomFruit())
      }
    }
    if (timerValue < 20) {
      if (noise(frameCount) > 0.69) {
        fruit.push(randomFruit())
      }
    }
  }

  points = 0

  for (var i = fruit.length - 1; i >= 0; i--) {
    fruit[i].update()
    fruit[i].draw()
    if (!fruit[i].visible) {
      if (!fruit[i].sliced && fruit[i].name != "boom") {
        // Missed fruit
        image(this.livesImgs2[0], fruit[i].x, fruit[i].y - 120, 50, 50)
        missed.play()
        lives--
        x++
      }
      if (lives < 1) {
        // Check for lives
        gameOver()
      }
      fruit.splice(i, 1)
    } else {
      if (fruit[i].sliced && fruit[i].name == "boom") {
        // Check for bomb
        boom.play()
        gameOver()
      }
      if (sword.checkSlice(fruit[i]) && fruit[i].name != "boom") {
        // Sliced fruit
        spliced.play()
        points++
        fruitsSlicedPerPress++ // Increment the counter for sliced fruits
        fruit[i].update()
        fruit[i].draw()
      }
    }
  }
  if (frameCount % 2 === 0) {
    sword.update()
  }

  if (timerValue <= 0) {
    gameOver()
  }
  sword.draw()
  score += points
  drawScore()
  drawTimer()
  drawLives()
}

function drawLives() {
  image(this.livesImgs[0], width - 110, 20, livesImgs[0].width, livesImgs[0].height)
  image(this.livesImgs[1], width - 88, 20, livesImgs[1].width, livesImgs[1].height)
  image(this.livesImgs[2], width - 60, 20, livesImgs[2].width, livesImgs[2].height)
  if (lives <= 2) {
    image(this.livesImgs2[0], width - 110, 20, livesImgs2[0].width, livesImgs2[0].height)
  }
  if (lives <= 1) {
    image(this.livesImgs2[1], width - 88, 20, livesImgs2[1].width, livesImgs2[1].height)
  }
  if (lives === 0) {
    image(this.livesImgs2[2], width - 60, 20, livesImgs2[2].width, livesImgs2[2].height)
  }
}

function mouseReleased() {
  // console.log("Fruits sliced in this press:", fruitsSlicedPerPress); // Log the count
  if (fruitsSlicedPerPress > 1) {
    score = fruitsSlicedPerPress + score
  }
  fruitsSlicedPerPress = 0
}

function drawScore() {
  image(this.scoreImg, 10, 10, 40, 40)
  textAlign(LEFT)
  noStroke()
  fill(255, 147, 21)
  textSize(50)
  text(score, 50, 50)
}

function gameOver() {
  noLoop()
  over.play()
  clear()
  background(bg)
  lives = 0

  // Check if leaderboardData is empty
  if (leaderboardData.length === 0 || leaderboardData.length < 10) {
    console.log("Leaderboard is empty or incomplete. Showing addNewHighScores form.");
    addNewHighScores();
    return; // Exit the function early
  }

  const topScore = leaderboardData[9]?.score

  if (score > topScore) {
    addNewHighScores()
  } else {
    playAgainButton()
  }
  console.log("lost")
}

function addNewHighScores() {
  showhighScoresForm()
}

function playAgainButton() {
  drawLeaderboard()
  // gameMenu.style.display = "block"
  // logoutButtonBody.style.display = "block"
  // document.getElementById("logout-button").style.display = "block"
  image(this.gameOverImg, 150, 80, 490, 85)
  image(this.newGameImg, 310, 360, 200, 200)
  image(this.fruitImg, 365, 415, 90, 90)

  cnv.mouseClicked(() => {
    if (
      mouseX > 365 &&
      mouseX < 365 + 90 && // X bounds of the fruit image
      mouseY > 415 &&
      mouseY < 415 + 90 // Y bounds of the fruit image
    ) {
      start.play()
      score = 0
      lives = 3
      timerValue = 60
      fruit = []
      isPlay = true
      loop()
    }
  })
}

// Show the login form
function showLoginForm() {
  console.log("Hello showLoginForm")
  const loginForm = document.getElementById("login-form")
  loginForm.style.display = "block"
  // logoutButtonBody.style.display = "none"
  // document.getElementById("leaderboard").style.display = "none"
}

function showhighScoresForm() {
  const highscores = document.getElementById("high_scores")
  highscores.style.display = "block"
}

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault()

  const name = document.getElementById("name").value
  const password = document.getElementById("password").value

  try {
    // console.log(process.env.BASE_URL)
    const response = await fetch(`http://localhost:3000/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    })

    if (response.ok) {
      const data = await response.json()
      alert("Login successful!")
      await fetchLeaderboard()
      populateLeaderboard()
      console.log(data)
      document.getElementById("login-form").style.display = "none" // Hide the form
      drawLeaderboard()
    } else {
      alert("Login failed. Please check your credentials.")
    }
  } catch (error) {
    console.error("Error during login:", error)
    alert("An error occurred. Please try again later.")
  }
})

// Handle logout button click
document.getElementById("logout-button").addEventListener("click", async function (event) {
  event.preventDefault()

  try {
    const response = await fetch(`http://localhost:3000/auth/logout`)

    if (response.ok) {
      alert("Logout successful!")
      document.getElementById("login-form").style.display = "block"
      document.getElementById("leaderboard").style.display = "none"
      document.getElementById("logout").style.display = "none"
    } else {
      alert("Logout failed. Please try again.")
    }
  } catch (error) {
    console.error("Error during logout:", error)
    alert("An error occurred. Please try again later.")
  }
})

// Show the highscore form
document.getElementById("highScoresForm").addEventListener("submit", async function (event) {
  event.preventDefault()

  const email = event.target.querySelector("#email").value
  const clickedButton = event.submitter
  console.log(`Button pressed: ${clickedButton.id}`) // Log the button's id

  if (clickedButton.id === "cancel") {
    console.log("Cancel button pressed")
    document.getElementById("high_scores").style.display = "none"
    playAgainButton()
    return
  }

  if (clickedButton.id === "enter") {
    try {
      if (!email) {
        alert("Please enter a valid email.")
        return
      }

      const response = await fetch(`http://localhost:3000/highscores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, score }),
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      // console.log("High score submitted successfully:", result)
      await fetchLeaderboard()
      populateLeaderboard()
      document.getElementById("high_scores").style.display = "none" // Hide the form
      playAgainButton()
      return response
    } catch (error) {
      console.error("Error submitting high score:", error)
    }
  }
})

playGameContainer.addEventListener("click", function (event) {
  // Check if the clicked element has the "playGame" class
  if (event.target.classList.contains("playGame")) {
    console.log("Image clicked:", event.target.alt) // Log the clicked image's alt text
    start.play()
    score = 0
    lives = 3
    fruit = []
    isPlay = true
    loop()
  } else {
    console.log("Clicked outside the images")
  }
})

//open modal to resret leaderboard button
// document.getElementById("reset_leaderboard").addEventListener("click", function (event) {
//   const confirmResetModal = document.getElementById("confirm_reset")
//   confirmResetModal.style.display = "block"
// })

//modal to resret leaderboard
document.getElementById("resetLeaderboardForm").addEventListener("submit", async function (event) {
  event.preventDefault()
  const confirmResetModal = document.getElementById("confirm_reset")
  const clickedButton = event.submitter
  const passwordInput = event.target.querySelector("#location_password").value
  console.log(clickedButton.id)
  if (clickedButton.id === "reset_cancel") {
    confirmResetModal.style.display = "none"
    return
  }

  if (clickedButton.id === "reset_enter") {
    try {
      if (!passwordInput) {
        alert("Please enter a valid password.")
        return
      }

      const response = await fetch(`http://localhost:3000/highscores/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      console.log("Leaderboard reset successfully.")
      await fetchLeaderboard()
      confirmResetModal.style.display = "none"
    } catch (error) {
      console.error("Error resetting leaderboard:", error)
    }
  }
})

function mouseDragged() {
  // Your slicing logic here (if needed)
  return false // <-- Prevents default dragging behavior
}

function drawLeaderboard() {
  const leaderboard = document.getElementById("leaderboard")
  leaderboard.style.display = "block"
  logoutButtonBody.style.display = "block"
}

function logout() {
  const logout = document.getElementById("logout")
  logout.style.display = "block"
}

// Move populateLeaderboard outside the event listener
function populateLeaderboard() {
  const leaderboardRows = document.getElementById("leaderboard-rows")
  console.log("populateLeaderboard: ", leaderboardData)

  leaderboardRows.innerHTML = "";

  leaderboardData.forEach((player, index) => {
    const opacity = Math.max(0.3, 1 - (index + 1 - 3) * 0.08)
    const backgroundColor =
      index === 0
        ? `bg-gradient-to-r from-yellow-200 to-yellow-400`
        : index === 1
        ? `bg-gradient-to-r from-blue-200 to-blue-400`
        : index === 2
        ? `bg-gradient-to-r from-red-200 to-red-400`
        : `bg-gradient-to-r from-orange-200 to-orange-400`

    const rowContent = `
      <div class="leaderboard-row flex items-center gap-4 rounded-xl text-sm p-2 border-b border-orange-500 ${backgroundColor} opacity-${opacity}">
          <h1 class="rank flex justify-center items-center border-2 border-double border-red-900 w-6 rounded-full text-center font-bold">${
            index + 1
          }</h1>
          <h1 class="username flex-auto text-start font-medium">${player.email}</h1>
          <div class="score flex items-center justify-between w-16 ${backgroundColor} rounded-full px-2 text-center font-bold">
          <img src="images/score.png" alt="score" class="w-5 h-5 mr-1">
          <span class="text-white">${player.score}</span>
          </div>
      </div>
    `

    leaderboardRows.insertAdjacentHTML("beforeend", rowContent)
  })
}

/* document.addEventListener("DOMContentLoaded", () => {
  const confirmResetModal = document.getElementById("confirm_reset");
  const overlay = document.getElementById("overlay");
  const cancelButton = document.getElementById("cancel");

  // Function to show the modal
  function showModal() {
      confirmResetModal.classList.add("show");
      overlay.classList.remove("hidden");
      overlay.style.display = "block";
  }

  // Function to hide the modal
  function hideModal() {
      confirmResetModal.classList.remove("show");
      overlay.classList.add("hidden");
      overlay.style.display = "none";
  }

  // Attach event listeners
  cancelButton.addEventListener("click", hideModal);

  // Example: Show the modal (you can trigger this based on your logic)
  showModal();
}); */

// Keep the DOMContentLoaded event listener for initial population
document.addEventListener("DOMContentLoaded", async function () {
  await fetchLeaderboard()
  console.log("first time")
  populateLeaderboard() // Populate leaderboard on page load
})

// Function to draw the timer on the screen
function drawTimer() {
  textAlign(CENTER)
  noStroke()
  fill(255, 147, 21)
  textSize(50)
  text(`Time: ${timerValue}`, width / 2, 50)
}
// Decrement the timer every second
setInterval(() => {
  if (isPlay && timerValue > 0) {
    timerValue--
  }
}, 1000)
