// GENERAL VARIABLES
var cnv
var score,
  points = 0
var lives,
  x = 0
var isPlay = false
var isGameOver = false
var gravity = 0.1
var sword
var fruit = []
const bombitem = ["preprite1"]
var fruitsList = [
  "apple",
  "chicken-nugget",
  "chocolate-milk",
  "cookie",
  "sandwich",
  "apple",
  "chicken-nugget",
  "chocolate-milk",
  "cookie",
  "sandwich",
  ...bombitem,
]
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
const logoutButtonBody = document.getElementById("logout")
const openDashboardButton = document.getElementById("open_dashboard")
const fullscreenButton = document.getElementById("fullscreen-button")

function preload() {
  // LOAD SOUNDS
  boom = loadSound("sounds/boom.mp3")
  spliced = loadSound("sounds/splatter.mp3")
  missed = loadSound("sounds/missed.mp3")
  start = loadSound("sounds/start.mp3")
  over = loadSound("sounds/over.mp3")

  // LOAD IMAGES
  for (var i = 0; i < fruitsList.length - bombitem.length; i++) {
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
  bg = loadImage("images/cafeteria-backgroundv1.png")
  playButtonImg = loadImage("images/new-game.png")
  scoreImg = loadImage("images/apple.png")
}

async function fetchLeaderboard() {
  try {
    const response = await fetch(`/highscores`)
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
    const response = await fetch(`/locations/session`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const session = await response.json()
    return session
  } catch (error) {
    console.error("Error fetching session:", error)
  }
}

let emailInput, passwordInput, loginButton, loginMessage, session

async function initializeSession() {
  await fetchLeaderboard()
  session = await fetchLocationsSession() // Simulate fetching session data
  populateLeaderboard()
}

async function useAddNewHighScores({ email, score }) {
  try {
    const response = await fetch(`/highscores`, {
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

async function setup() {
  const container = document.getElementById("gameCanvas")
  const width = container.clientWidth
  const height = container.clientHeight

  cnv = createCanvas(width, height)
  cnv.parent("gameCanvas")
  sword = new Sword(color("#FFFFFF"))
  frameRate(60)
  score = 0
  lives = 3

  masterVolume(0)

  await initializeSession() // Initialize session data

  const showLogin = session
  if (!showLogin) {
    showLoginForm()
  } else {
    drawLeaderboard({ isHidden: 0 })
    ShowLogoutButton({ isHidden: 0 })
    ShowLeaderboardButton({ isHidden: 0 })
  }
}

window.addEventListener("resize", () => {
  const container = document.getElementById("gameCanvas")
  if (container) {
    resizeCanvas(container.clientWidth, container.clientHeight)
  }
})

function draw() {
  clear()
  background(bg)
  if (isGameOver) {
    showGameMenu(1, 0)
  } else {
    showGameMenu(0, 0)
  }

  cnv.mouseClicked(check)

  // Always allow sword swipe and draw
  if (!isPlay && mouseIsPressed) {
    sword.swipe(mouseX, mouseY)
    sword.draw()
    if (frameCount % 2 === 0) {
      sword.update()
    }
  }

  if (isPlay) {
    game()
  }
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
  // gameMenu.classList.add("hidden")
  showGameMenu(0, 1)
  ShowLogoutButton({ isHidden: 1 })
  ShowLeaderboardButton({ isHidden: 1 })
  drawLeaderboard({ isHidden: 1 })

  if (mouseIsPressed) {
    // Reset the counter when the mouse is pressed
    // if (frameCount % 2 === 0) {
    //   fruitsSlicedPerPress = 0;
    // }
    // Draw sword

    sword.swipe(mouseX, mouseY)
  }
  let fruitIncraeseRate = 6

  if (timerValue < 30) {
    fruitIncraeseRate = 4.5
  }
  if (timerValue < 20) {
    fruitIncraeseRate = 4
  }

  if (frameCount % fruitIncraeseRate === 0) {
    if (noise(frameCount) > 0.69) {
      fruit.push(randomFruit()) // Display new fruit
    }
  }

  points = 0

  for (var i = fruit.length - 1; i >= 0; i--) {
    fruit[i].update()
    fruit[i].draw()
    if (!fruit[i].visible) {
      if (!fruit[i].sliced && !bombitem.includes(fruit[i].name)) {
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
      if (fruit[i].sliced && bombitem.includes(fruit[i].name)) {
        // Check for bomb
        boom.play()
        gameOver()
        // lives--;
        // x++;
        // if (lives < 1) {
        //   gameOver(); // Trigger game over only if lives are zero
        // }
        // fruit.splice(i, 1);
      }
      if (sword.checkSlice(fruit[i]) && !bombitem.includes(fruit[i].name)) {
        // Sliced fruit
        spliced.play()
        points++
        fruitsSlicedPerPress++ // Increment the counter for sliced fruits
        fruit[i].slice() // <-- Call the slice method here!
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
  const responsiveHeight = Math.min(width, height) * 0.07 // Adjust height based on canvas dimensions
  const aspectRatio = livesImgs[0].width / livesImgs[0].height // Maintain aspect ratio

  image(this.livesImgs[0], width - 110, 15, responsiveHeight * aspectRatio, responsiveHeight)
  image(this.livesImgs[1], width - 88, 15, responsiveHeight * aspectRatio, responsiveHeight)
  image(this.livesImgs[2], width - 60, 15, responsiveHeight * aspectRatio, responsiveHeight)

  if (lives <= 2) {
    image(this.livesImgs2[0], width - 110, 15, responsiveHeight * aspectRatio, responsiveHeight)
  }
  if (lives <= 1) {
    image(this.livesImgs2[1], width - 88, 15, responsiveHeight * aspectRatio, responsiveHeight)
  }
  if (lives === 0) {
    image(this.livesImgs2[2], width - 60, 15, responsiveHeight * aspectRatio, responsiveHeight)
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
  const responsiveImageSize = Math.min(width, height) * 0.07 // Adjust image size based on canvas dimensions
  const responsiveTextSize = Math.min(width, height) * 0.07 // Adjust text size based on canvas dimensions
  image(this.scoreImg, 10, 10, responsiveImageSize, responsiveImageSize)
  textAlign(LEFT)
  noStroke()
  fill(200, 0, 0) // Set text color to a darker red
  textSize(responsiveTextSize * 1.2) // Increase text size slightly
  textFont("sans-serif") // Change font to sans-serif
  textStyle(BOLD) // Make the font bold
  text(score, 10 + responsiveImageSize + 5, 7 + responsiveTextSize) // Adjust position for the increased size
}

// Function to draw the timer on the screen
function drawTimer() {
  textAlign(CENTER)
  noStroke()
  fill(200, 0, 0)
  textFont("sans-serif")
  textStyle(BOLD) // Make the font bold
  const responsiveTextSize = Math.min(width, height) * 0.05 // Adjust text size based on canvas dimensions
  textSize(responsiveTextSize * 1.2)
  text(`Time: ${timerValue}`, width / 2, responsiveTextSize + 10) // Position text slightly below the top
}

function gameOver() {
  // noLoop()
  over.play()
  clear()
  background(bg)
  lives = 0
  isPlay = false
  isGameOver = true

  // Check if leaderboardData is empty
  if (leaderboardData.length === 0 || leaderboardData.length < 10) {
    console.log("Leaderboard is empty or incomplete. Showing addNewHighScores form.")
    showhighScoresForm()
    return // Exit the function early
  }

  const topScore = leaderboardData[9]?.score

  if (score > topScore) {
    showhighScoresForm({ isHighScore: true, playerScore: score })
  } else {
    if (score < 1) {
      playAgainButton()
      return
    }
    // If the score is not a high score, show the form with a message
    showhighScoresForm({ isHighScore: false, playerScore: score })
  }
}

function playAgainButton() {
  drawLeaderboard({ isHidden: 0 })
  ShowLogoutButton({ isHidden: 0 })
  ShowLeaderboardButton({ isHidden: 0 })

  showGameMenu(1, 0)
  // cnv.mouseClicked(() => {
  //   if (
  //     mouseX > 365 &&
  //     mouseX < 365 + 90 && // X bounds of the fruit image
  //     mouseY > 415 &&
  //     mouseY < 415 + 90 // Y bounds of the fruit image
  //   ) {
  //     start.play()
  //     score = 0
  //     lives = 3
  //     timerValue = 60
  //     fruit = []
  //     isPlay = true
  //     loop()
  //   }
  // })
}

// show Game Menu
function showGameMenu(gameOver = 0, isHidden = 0) {
  const gameMenu2 = document.getElementById("gameMenu")
  // const fruit_img = document.querySelector('img[alt="fruit"]');
  const ninja_img = document.querySelector('img[alt="cafeteria-logo"]')
  const gameOver_img = document.querySelector('img[alt="gameOver"]')
  if (isHidden) {
    gameMenu2.classList.add("hidden")
  } else {
    gameMenu2.classList.remove("hidden")
  }

  if (gameOver) {
    gameOver_img.classList.remove("hidden")
    // fruit_img.classList.add("hidden")
    ninja_img.classList.add("hidden")
  } else {
    gameOver_img.classList.add("hidden")
    // fruit_img.classList.remove("hidden")
    ninja_img.classList.remove("hidden")
  }
}

// Show the login form
function showLoginForm() {
  const loginForm = document.getElementById("login-form")
  loginForm.classList.remove("hidden")
  document.getElementById("leaderboard").style.display = "none"
}

function showhighScoresForm({ isHighScore, playerScore }) {
  startConfetti()

  // Stop after 5 seconds
  setTimeout(stopConfetti, 20000)
  const highscores = document.getElementById("high_scores")
  const highscoresTitle = highscores.getElementsByClassName("title") // Replace "child-class-name" with the actual class name of the children
  const highscoresContent = highscores.getElementsByClassName("content") // Replace "child-class-name" with the actual class name of the children
  if (isHighScore) {
    Array.from(highscoresTitle)[0].textContent = "New High Score!"
    Array.from(
      highscoresContent
    )[0].textContent = `Thank you for playing! To be entered into the YETI drawing, please enter your contact information below.`
  } else {
    Array.from(highscoresTitle)[0].textContent = "Nice Try!"
    Array.from(highscoresContent)[0].textContent =
      " Not a new high score, but you can still enter the YETI drawing! Please enter your contact information below."
  }

  highscores.classList.remove("hidden")

  // Show the highscore form
  document.getElementById("highScoresForm").addEventListener("submit", async function (event) {
    event.preventDefault()

    const email = event.target.querySelector("#email").value
    const name = event.target.querySelector("#name").value
    const clickedButton = event.submitter
    console.log(`Button pressed: ${clickedButton.id}`) // Log the button's id

    if (clickedButton.id === "cancel") {
      console.log("Cancel button pressed")
      document.getElementById("high_scores").classList.add("hidden") // Hide the form
      playAgainButton()
      return
    }

    if (clickedButton.id === "enter") {
      try {
        if (!email || !name) {
          alert("Please fill out all the required fields: name and email.")
          return
        }

        const response = await fetch(`/highscores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, score, name }),
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Clear the input fields after successful submission
        event.target.querySelector("#email").value = ""
        event.target.querySelector("#name").value = ""
        await fetchLeaderboard()
        populateLeaderboard()
        document.getElementById("high_scores").classList.add("hidden") // Hide the form
        playAgainButton()
        return response
      } catch (error) {
        console.error("Error submitting high score:", error)
      }
    }
  })
}

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", async function (event) {
  event.preventDefault()

  const name = document.getElementById("name").value
  const password = document.getElementById("password").value

  try {
    // console.log(process.env.BASE_URL)
    const response = await fetch(`/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    })

    if (response.ok) {
      const data = await response.json()
      alert("Login successful!")
      await fetchLeaderboard()
      populateLeaderboard()
      document.getElementById("login-form").classList.add("hidden") // Hide the form
      drawLeaderboard({ isHidden: 0 })
      ShowLogoutButton({ isHidden: 0 })
      ShowLeaderboardButton({ isHidden: 0 })
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
    const response = await fetch(`/auth/logout`)

    if (response.ok) {
      alert("Logout successful!")
      session = null
      document.getElementById("login-form").classList.remove("hidden")
      ShowLogoutButton({ isHidden: 1 })
      ShowLeaderboardButton({ isHidden: 1 })
      drawLeaderboard({ isHidden: 1 })
    } else {
      alert("Logout failed. Please try again.")
    }
  } catch (error) {
    console.error("Error during logout:", error)
    alert("An error occurred. Please try again later.")
  }
})

playGameContainer.addEventListener("click", function (event) {
  // Check if the clicked element has the "playGame" class
  if (event.target.classList.contains("playGame")) {
    console.log("Image clicked:", event.target.alt) // Log the clicked image's alt text
    start.play()
    score = 0
    lives = 3
    timerValue = 60
    fruit = []
    isPlay = true
    loop()
  } else {
    console.log("Clicked outside the images")
  }
})

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

      const response = await fetch(`/highscores/reset`, {
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

function ShowLogoutButton({ isHidden = 0 }) {
  const logoutButton = document.getElementById("logout")
  if (isHidden) {
    logoutButton.style.display = "none"
  } else {
    logoutButton.style.display = "block"
  }
}

function ShowLeaderboardButton({ isHidden = 0 }) {
  const isMobilelandscape = window.matchMedia("(max-height: 430px)").matches
  const leaderboardButton = document.getElementById("open_dashboard")

  if (!isMobilelandscape) {
    leaderboardButton.style.display = "none"
    fullscreenButton.style.display = "none"
    return // Don't show leaderboard button
  }

  if (isHidden) {
    leaderboardButton.style.display = "none"
    fullscreenButton.style.display = "none"
  } else {
    leaderboardButton.style.display = "block"
    fullscreenButton.style.display = "block"
  }
}

function drawLeaderboard({ isHidden = 0 }) {
  const isMobile = window.matchMedia("(max-width: 767px)").matches
  const isPortrait = window.matchMedia("(orientation: portrait)").matches
  if (isMobile && isPortrait) return // Don't show leaderboard on mobile portrait

  const leaderboard = document.getElementById("leaderboard")

  if (isHidden) {
    leaderboard.style.display = "none"
  } else {
    leaderboard.style.display = "block"
  }
}

//close leaderboard button
document.getElementById("leaderboardCloseButton").addEventListener("click", function (event) {
  const leaderboard = document.getElementById("leaderboard")
  leaderboard.style.display = "none"
})

//open leaderboard button
document.getElementById("leaderboardOpenButton").addEventListener("click", function (event) {
  const leaderboard = document.getElementById("leaderboard")
  leaderboard.style.display = "block"
})

function logout() {
  const logout = document.getElementById("logout")
  logout.style.display = "block"
}

// Move populateLeaderboard outside the event listener
function populateLeaderboard() {
  const leaderboardRows = document.getElementById("leaderboard-rows")
  console.log("populateLeaderboard: ", leaderboardData)

  leaderboardRows.innerHTML = ""

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
      <div class="leaderboard-row flex items-center gap-4 max-md:gap-2 rounded-xl max-md:text-xs text-sm p-2 border-b border-orange-500 ${backgroundColor} opacity-${opacity}">
          <h1 class="rank flex justify-center items-center border-2 border-double border-red-900 size-6 max-md:size-5 rounded-full text-center font-bold">${
            index + 1
          }</h1>
          <h1 class="username flex-auto text-start font-medium">${player.email}</h1>
          <div class="score flex items-center justify-between w-16 ${backgroundColor} rounded-full px-2 text-center font-bold">
          <img src="images/apple.png" alt="score" class="w-5 h-5 mr-1">
          <span class="text-white">${player.score}</span>
          </div>
      </div>
    `

    leaderboardRows.insertAdjacentHTML("beforeend", rowContent)
  })
}

// Decrement the timer every second
setInterval(() => {
  if (isPlay && timerValue > 0) {
    timerValue--
  }
}, 1000)

// Display the rotate overlay in mobile portrait view
function checkOrientation() {
  const overlay = document.getElementById("rotate-portrait-overlay")
  const isMobile = window.matchMedia("(max-width: 767px)").matches
  const isPortrait = window.matchMedia("(orientation: portrait)").matches

  if (isMobile && isPortrait) {
    overlay.classList.remove("hidden")
    overlay.classList.add("flex")
    document.body.style.overflow = "hidden"
    document.getElementById("leaderboard").style.display = "none"
  } else {
    overlay.classList.add("hidden")
    overlay.classList.remove("flex")
    document.body.style.overflow = ""
    if (session) {
      document.getElementById("leaderboard").style.display = "block"
    }
  }
}

window.addEventListener("resize", checkOrientation)
window.addEventListener("orientationchange", checkOrientation)
window.addEventListener("DOMContentLoaded", checkOrientation)

document.addEventListener("DOMContentLoaded", () => {
  const mainBodyContainer = document.getElementById("mainBodyContainer")

  fullscreenButton.addEventListener("click", () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      if (mainBodyContainer.requestFullscreen) {
        mainBodyContainer.requestFullscreen()
      } else if (mainBodyContainer.webkitRequestFullscreen) {
        mainBodyContainer.webkitRequestFullscreen() // Safari
      }
    } else {
      // Exit fullscreen mode
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen() // Safari
      }
    }
  })
})

window.addEventListener("load", () => {
  setTimeout(() => {
    window.scrollTo(0, 1) // Scroll to hide the address bar
  }, 100)
})

// function randomFruit(){
//   // Use this modified version to increase bomb frequency
//   var x = random(width);
//   var y = height;
//   var size = noise(frameCount)*20 + 40;
//   var col = color(random(255),random(255),random(255));
//   var speed = random(3,5);

//   // Increase chance of bomb appearing
//   var idx;
//   if (random() < bombProbability) {
//     // Generate a bomb (last item in fruitsList)
//     idx = fruitsList.length - 1;
//   } else {
//     // Generate regular fruit (any item except the last one which is the bomb)
//     idx = round(random(0, fruitsList.length - 2));
//   }

//   var fruit = fruitsImgs[idx];
//   var slicedFruit1 = (idx < fruitsList.length - 1) ? slicedFruitsImgs[2*idx] : null;
//   var slicedFruit2 = (idx < fruitsList.length - 1) ? slicedFruitsImgs[2*idx + 1] : null;
//   var name = fruitsList[idx];

//   return new Fruit(x,y,speed,col,size,fruit,slicedFruit1,slicedFruit2,name);
// }
