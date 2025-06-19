// FRUIT
function Fruit(x, y, speed, color, size, fruit, slicedFruit1, slicedFruit2, name) {
  this.x = x
  this.y = y
  this.speed = speed
  this.color = color
  this.size = size
  this.xSpeed = randomXSpeed(x)
  this.ySpeed = random(-10.4, -7.4)
  this.fruit = fruit
  this.slicedFruit1 = slicedFruit1
  this.slicedFruit2 = slicedFruit2
  this.name = name
  this.sliced = false
  this.visible = true
  this.explosionShown = false

  this.slice1x = this.x - 25
  this.slice1y = this.y
  this.slice2x = this.x + 25
  this.slice2y = this.y
  this.slice1xSpeed = 0
  this.slice1ySpeed = 0
  this.slice2xSpeed = 0
  this.slice2ySpeed = 0
}

Fruit.prototype.slice = function () {
  // console.log("draw slice", this.name, this.sliced);
  if (this.sliced) {
    this.sliced = true
    // Give each slice a random direction
    this.slice1x = this.x - 25
    this.slice1y = this.y
    this.slice2x = this.x + 25
    this.slice2y = this.y
    this.slice1xSpeed = random(-4, -1)
    this.slice1ySpeed = random(-8, -4)
    this.slice2xSpeed = random(1, 4)
    this.slice2ySpeed = random(-8, -4)
  }
}

Fruit.prototype.draw = function () {
  fill(this.color);
  push(); // Save current drawing settings
  imageMode(CENTER); // Draw from center

  if (this.sliced) {
    // Draw sliced fruit
    image(this.slicedFruit1, this.slice1x, this.slice1y, this.size + 25, this.size + 30);
    image(this.slicedFruit2, this.slice2x, this.slice2y, this.size + 25, this.size + 30);
  } else {
    image(this.fruit, this.x, this.y, this.size, this.size);

    // Optional: show slicing hit zone for testing
    // stroke(255, 0, 0, 100); // Red translucent circle
    // noFill();
    // ellipse(this.x, this.y, this.size * 0.9); // Match detection range
  }

  pop(); // Restore drawing settings
};

Fruit.prototype.update = function () {
  if (this.sliced) {
    // console.log("draw update", this.name, this.sliced);
    // Move each half separately
    this.slice1x += this.slice1xSpeed
    this.slice1y += this.slice1ySpeed
    this.slice1ySpeed += gravity * 2.5

    this.slice2x += this.slice2xSpeed
    this.slice2y += this.slice2ySpeed
    this.slice2ySpeed += gravity * 2.5

    // Hide when both halves are off screen
    if (this.slice1y > height && this.slice2y > height) {
      this.visible = false
    }
  } else {
    this.x += this.xSpeed
    this.y += this.ySpeed
    this.ySpeed += gravity
    if (this.y > height) {
      this.visible = false
    }
  }
}

// Original randomFruit function - now replaced with version in main.js
function randomFruit() {
  // Create randon fruit
  var bombProbability = 0.2
  var idx = round(random(0, fruitsList.length - 1))

  if (random() < bombProbability) {
    // Generate a random bomb
    //    var bombIndices = fruitsList.map((fruit, index) =>
    //        ["preprite1","boom1", "boom2", "boom3", "boom4", "boom5"].includes(fruit) ? index : null
    //    ).filter(index => index !== null);
    //    idx = bombIndices[floor(random(0, bombIndices.length))];

    idx = fruitsList.length - 1
  }

  var x = random(width)
  var y = height
  var size = noise(frameCount) * 20 + 40

  var col = color(random(255), random(255), random(255))
  var speed = random(3, 5)
  var fruit = fruitsImgs[idx]
  var slicedFruit1 = slicedFruitsImgs[2 * idx]
  var slicedFruit2 = slicedFruitsImgs[2 * idx + 1]
  var name = fruitsList[idx]

  return new Fruit(x, y, speed, col, size, fruit, slicedFruit1, slicedFruit2, name)
}

function randomXSpeed(x) {
  if (x > width / 2) {
    return random(-2.8, -0.5) // If fruit generated on right side, go left
  } else {
    return random(0.5, 2.8) // If fruit generated on right side, go left
  }
}
