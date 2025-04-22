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
// var timerValue = 60;
var leaderboardData = []

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
  sword = new Sword(color("#FFFFFF"))
  frameRate(60)
  score = 0
  lives = 3

  masterVolume(0)
  await fetchLeaderboard() // Fetch leaderboard data

  const showLogin = await fetchLocationsSession()
  console.log(!showLoginForm)
  if (!showLogin) {
    console.log("Hello")
    showLoginForm()
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

  drawLeaderboard(10, 250)
  // showhighScoresForm()
  showLeaderboardScores()
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
  if (mouseIsPressed) {
    // Draw sword
    sword.swipe(mouseX, mouseY)
  }
  if (frameCount % 5 === 0) {
    if (noise(frameCount) > 0.69) {
      fruit.push(randomFruit()) // Display new fruit
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
        drawLeaderboard(10, 100)
      }
      fruit.splice(i, 1)
    } else {
      if (fruit[i].sliced && fruit[i].name == "boom") {
        // Check for bomb
        boom.play()
        gameOver()
        drawLeaderboard(10, 100)
      }
      if (sword.checkSlice(fruit[i]) && fruit[i].name != "boom") {
        // Sliced fruit
        spliced.play()
        points++
        fruit[i].update()
        fruit[i].draw()
      }
    }
  }
  if (frameCount % 2 === 0) {
    sword.update()
  }
  sword.draw()
  score += points
  drawScore()
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
  // button = createButton("Reset");
  // button.position(450, 350);
  // button.mousePressed(resetSketch);
  // Add "Play Again" button

  const topScore = leaderboardData[9]?.score

  if (score > topScore) {
    addNewHighScores()
    console.log(leaderboardData)
    console.log({ score })
  } else {
    playAgainButton()
  }
  console.log("lost")
}

function addNewHighScores() {
  //   // Create a card container
  //   const card = createDiv()
  //   card.position(600, 350) // Adjust position as needed
  //   card.size(250, 180) // Width and height of the card
  //   card.style("background-color", "#ffffff") // Card background color
  //   card.style("border", "2px solid #ccc") // Border style
  //   card.style("border-radius", "10px") // Rounded corners
  //   card.style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)") // Shadow effect
  //   card.style("padding", "20px") // Inner spacing
  //   card.style("text-align", "center") // Center align content

  //   fill(255);
  //   stroke(200);
  //   strokeWeight(2);
  //   rect(200, 150, 400, 300, 10);

  // noLoop()
  // over.play()
  // clear()
  // background(bg)
  // image(this.gameOverImg, 155, 260, 490, 85)
  // lives = 0

  // textAlign(CENTER)
  // const highScoreText = createP("New High Score!")
  // highScoreText.position(650, 380)
  // highScoreText.style("font-size", "24px")
  // highScoreText.style("color", "#ff5722")
  // highScoreText.style("font-weight", "bold")
  // highScoreText.style("margin", "0")

  // // Email Input
  // emailInput = createInput()
  // emailInput.position(620, 415)
  // emailInput.size(200, 40) // Width, Height
  // emailInput.attribute("placeholder", "Email")
  // // Style the input
  // emailInput.style("font-size", "18px")
  // emailInput.style("padding", "8px 12px")
  // emailInput.style("border", "2px solid #ccc")
  // emailInput.style("border-radius", "5px")
  // emailInput.style("outline", "none")
  // emailInput.style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)")
  // // emailInput.parent("sketchHolder");
  // // emailInput.position(620, 415);

  // const submitEmailButton = createButton("Enter")
  // submitEmailButton.position(760, 465) // Centered
  // submitEmailButton.style("background-color", "#28a745")
  // submitEmailButton.style("color", "#ffffff")
  // submitEmailButton.style("font-size", "20px")
  // submitEmailButton.style("padding", "10px 20px")
  // submitEmailButton.style("border", "none")
  // submitEmailButton.style("border-radius", "5px")
  // submitEmailButton.style("cursor", "pointer")
  // submitEmailButton.mousePressed(async () => {
  //   const email = emailInput.value()
  //   if (email) {
  //     console.log(`Email submitted: ${email}`)
  //     console.log(`new highscore submitted: ${score}`)
  //     await useAddNewHighScores({ email, score })
  //     await fetchLeaderboard()
  //     submitEmailButton.remove()
  //     highScoreText.remove()
  //     cancelButton.remove()
  //     emailInput.remove()
  //     playAgainButton()
  //   } else {
  //     alert("Please enter a valid email.")
  //   }
  // })
  // const canvasX = cnv.position().x;
  // const canvasY = cnv.position().y;
  // const cancelButton = createButton("Cancel")
  // cancelButton.position(canvasX + 700, canvasY + 500) // Centered
  // cancelButton.style("background-color", "#cc0000")
  // cancelButton.style("color", "#ffffff")
  // cancelButton.style("font-size", "20px")
  // cancelButton.style("padding", "10px 20px")
  // cancelButton.style("border", "none")
  // cancelButton.style("border-radius", "5px")
  // cancelButton.style("cursor", "pointer")
  // cancelButton.mousePressed(() => {
  //   cancelButton.remove()
  //   submitEmailButton.remove()
  //   highScoreText.remove()
  //   cancelButton.remove()
  //   emailInput.remove()
  //   playAgainButton()
  // })

  showhighScoresForm()
}

function playAgainButton() {
  // const playAgainButton = createButton("Play Again")
  // playAgainButton.position(660, 415, 90, 90) // Centered
  // playAgainButton.style("background-color", "#28a745")
  // playAgainButton.style("color", "#ffffff")
  // playAgainButton.style("font-size", "20px")
  // playAgainButton.style("padding", "10px 20px")
  // playAgainButton.style("border", "none")
  // playAgainButton.style("border-radius", "5px")
  // playAgainButton.style("cursor", "pointer")
  // playAgainButton.mousePressed(() => {
  //   start.play()
  //   score = 0
  //   lives = 3
  //   fruit = []
  //   isPlay = true
  //   loop()
  //   playAgainButton.remove()
  // })
  image(this.gameOverImg, 155, 260, 490, 85)
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
      fruit = []
      isPlay = true
      loop()
      playAgainButton.remove()
    }
  })
}

function drawLeaderboard(startX, startY) {
  textAlign(LEFT)
  noStroke()
  fill(255, 147, 21)
  textSize(30)
  text("Leaderboard", startX, startY) //10, 250

  textSize(20)
  for (let i = 0; i < leaderboardData.length; i++) {
    let entry = leaderboardData[i]
    const emailName = entry.email.split("@")[0]
    text(`${i + 1}. ${emailName} - ${entry.score}`, startX, startY + 30 + i * 30) //10, 280
  }
  if (!leaderboardData || leaderboardData.length === 0) {
    console.log("Leaderboard data is empty or not loaded.")
    return
  }
}

// Show the login form
function showLoginForm() {
  const loginForm = document.getElementById("login-form")
  loginForm.style.display = "block"
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
      console.log(data)
      document.getElementById("login-form").style.display = "none" // Hide the form
    } else {
      alert("Login failed. Please check your credentials.")
    }
  } catch (error) {
    console.error("Error during login:", error)
    alert("An error occurred. Please try again later.")
  }
})

// Show the highscore form
document.getElementById("highScoresForm").addEventListener("submit", async function (event) {
  event.preventDefault()

  const clickedButton = event.submitter
  console.log(`Button pressed: ${clickedButton.id}`) // Log the button's id

  const email = document.getElementById("email").value

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
    document.getElementById("high_scores").style.display = "none" // Hide the form
    playAgainButton()
    return response
  } catch (error) {
    console.error("Error submitting high score:", error)
  }
})

// Separate event listener for the "Cancel" button
document.getElementById("cancel").addEventListener("click", function () {
  console.log("Cancel button pressed")
  document.getElementById("high_scores").style.display = "none" // Hide the form
  playAgainButton()
})

function showLeaderboardScores() {
  const leaderboard = document.getElementById("leaderboard")
  leaderboard.style.display = "block"
}

document.addEventListener("DOMContentLoaded", async function () {
  // Sample leaderboard data
  // const leaderboardData = [
  //     { id: 1, username: "USERNAME_01", score: 42500 },
  //     { id: 2, username: "USERNAME_02", score: 35100 },
  //     { id: 3, username: "USERNAME_03", score: 29305 },
  //     { id: 4, username: "USERNAME_04", score: 25280 },
  //     { id: 5, username: "USERNAME_05", score: 18250 },
  //     { id: 6, username: "USERNAME_06", score: 16890 },
  //     { id: 7, username: "USERNAME_07", score: 15020 },
  //     { id: 8, username: "USERNAME_08", score: 11000 },
  //     { id: 9, username: "USERNAME_09", score: 10561 },
  // ];
  await fetchLeaderboard()
  // Get the container and template
  const leaderboardRows = document.getElementById("leaderboard-rows")
  const rowTemplate = document.getElementById("row-template")
  const closeBtn = document.getElementById("close-btn")
  const leaderboard = document.getElementById("leaderboard")

  // Populate the leaderboard
  populateLeaderboard()

  // Close button functionality
  closeBtn.addEventListener("click", function () {
    leaderboard.style.display = "none"
  })

  // Function to populate the leaderboard
  function populateLeaderboard() {
    console.log("populateLeaderboard: ", leaderboardData)
    leaderboardData.forEach((player, index) => {
      // Clone the template
      // const row = rowTemplate.content.cloneNode(true);
      // const rowElement = row.querySelector('.leaderboard-row');

      // // Set background color based on rank
      // if (player.id === 1) {
      //     rowElement.classList.add('bg-gradient-to-r', 'from-yellow-200', 'to-yellow-400');
      // } else if (player.id === 2) {
      //     rowElement.classList.add('bg-gradient-to-r', 'from-blue-200', 'to-blue-400');
      // } else if (player.id === 3) {
      //     rowElement.classList.add('bg-gradient-to-r', 'from-red-200', 'to-red-400');
      // } else {
      //     // For ranks 4-9, add orange gradient with decreasing opacity
      //     rowElement.classList.add('bg-gradient-to-r', 'from-orange-200', 'to-orange-400');
      //     const opacity = Math.max(0.3, 1 - (player.id - 3) * 0.08);
      //     rowElement.style.opacity = opacity;
      // }

      // // Set the rank
      // const rankElement = row.querySelector('.rank');
      // rankElement.textContent = player.id;

      // Style rank based on position
      // if (player.id === 1) {
      //     rankElement.classList.add('bg-yellow-500');
      // } else if (player.id === 2) {
      //     rankElement.classList.add('bg-blue-500');
      // } else if (player.id === 3) {
      //     rankElement.classList.add('bg-red-500');
      // } else {
      //     // For ranks 4-9, use text instead of medal
      //     rankElement.classList.remove('w-8', 'h-8', 'rounded-full', 'text-white', 'font-bold', 'shadow-inner', 'border-2', 'border-white');
      //     rankElement.classList.add('text-orange-800', 'font-bold', 'text-xl');
      // }

      // Set the avatar
      // const avatarImg = row.querySelector('.avatar-img');
      // avatarImg.src = `https://via.placeholder.com/40?text=${player.id}`;
      // avatarImg.alt = `${player.username} avatar`;

      // // Set the username
      // row.querySelector('.username').textContent = player.username;

      // // Set the score
      // row.querySelector('.score').textContent = player.score.toLocaleString();

      // Add the row to the leaderboard
      // const row = document.createElement('div');
      // row.className = 'leaderboard-row flex items-center justify-between p-2 border-b border-gray-300';
      // const rankElement = document.createElement('div');
      // rankElement.textContent = index + 1;
      // rankElement.className = 'rank text-center font-bold text-lg';
      // row.appendChild(rankElement);
      const opacity = Math.max(0.3, 1 - ((index + 1) - 3) * 0.08);
      const backgroundColor =
        index === 0
          ? `bg-gradient-to-r from-yellow-200 to-yellow-400`
          : index === 1
          ? `bg-gradient-to-r from-blue-200 to-blue-400`
          : index === 2
          ? `bg-gradient-to-r from-red-200 to-red-400`
          : `g-gradient-to-r from-orange-200 to-orange-400`

      const rowContent = `
                <div class="leaderboard-row flex items-center justify-between rounded-xl p-2 border-b border-gray-300 ${backgroundColor} opacity-${opacity}">
                    <h1 class="rank text-center font-bold text-lg">${index + 1}</h1>
                    <h1 class="username text-center font-medium text-lg">${player.email}</h1>
                    <h1 class="score text-center font-bold text-lg">${player.score}</h1>
                </div>
            `
      leaderboardRows.innerHTML += rowContent

      // leaderboardRows.appendChild(row);
    })
  }
})

// timer = createP("timer");
// setInterval(timeIt, 1000);

// textAlign(CENTER);
// setInterval(timeIt, 1000);

//   if (timerValue == 0) {
//     text('game over', width / 2, height / 2 + 15);
//   }
// fruit.push(new Fruit(random(width),height,3,"#FF00FF",random()));
// function resetSketch(){
//     clear();
//     background(bg);
//     game();
// }
// function timeIt() {
//     console.log("time");
//     if (timerValue > 0) {
//         console.log(timerValue);
//         timerValue--;
//         textAlign(CENTER);
//         noStroke();
//         fill(255,147,21);
//         textSize(50);
//         text(timerValue, 200, 250);
//     }
//   }
