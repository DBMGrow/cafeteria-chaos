import { useEffect, useState } from 'react';
import { ReactP5Wrapper } from "@p5-wrapper/react";
import p5 from "p5";

// Define types for our game objects
type Fruit = {
  x: number;
  y: number;
  xSpeed: number;
  ySpeed: number;
  size: number;
  color: p5.Color;
  type: string;
  sliced: boolean;
  visible: boolean;
};

type Sword = {
  swipes: { x: number; y: number }[];
  update: () => void;
  draw: (p: p5) => void;
  swipe: (x: number, y: number) => void;
  checkSlice: (fruit: Fruit) => boolean;
};

// Main sketch function
const sketch = (p: p5) => {
  // Game state
  let fruits: Fruit[] = [];
  let sword: Sword;
  let score = 0;
  let lives = 3;
  let isPlaying = false;
  let gameOver = false;
  let fruitsSlicedPerPress = 0;
  let timerValue = 60;
  let lastTimerUpdate = 0;
  
  // Assets
  const fruitImages: Record<string, p5.Image> = {};
  const slicedFruitImages: Record<string, p5.Image[]> = {};
  let backgroundImage: p5.Image;
  let gameOverImage: p5.Image;
  let scoreImage: p5.Image;
  const livesImages: p5.Image[] = [];
  const lostLivesImages: p5.Image[] = [];
  
  // Define a type for sound objects that may come from p5.sound
  type SoundObject = {
    play: () => void;
    stop: () => void;
  };
  
  // Sounds
  let spliceSound: SoundObject | null = null;
  let missedSound: SoundObject | null = null;
  let boomSound: SoundObject | null = null;
  let gameOverSound: SoundObject | null = null;
  let startSound: SoundObject | null = null;

  // Fruit types
  const fruitTypes = ["apple", "banana", "peach", "strawberry", "watermelon", "boom"];

  // Preload assets
  p.preload = () => {
    try {
      // Load images
      backgroundImage = p.loadImage('/src/images/background.jpg');
      gameOverImage = p.loadImage('/src/images/game-over.png');
      scoreImage = p.loadImage('/src/images/score.png');
      
      // Load fruit images
      fruitTypes.forEach(type => {
        if (type !== 'boom') {
          fruitImages[type] = p.loadImage(`/src/images/${type}.png`);
          slicedFruitImages[type] = [
            p.loadImage(`/src/images/${type}-1.png`),
            p.loadImage(`/src/images/${type}-2.png`)
          ];
        } else {
          fruitImages[type] = p.loadImage(`/src/images/${type}.png`);
        }
      });
      
      // Load lives images
      for (let i = 1; i <= 3; i++) {
        livesImages.push(p.loadImage(`/src/images/x${i}.png`));
        lostLivesImages.push(p.loadImage(`/src/images/xx${i}.png`));
      }
      
      // Load sounds - using p5.sound which may not be properly typed in TypeScript
      try {
        // p5.sound is loaded as a separate library and its types aren't properly recognized
        // @ts-expect-error - p5.sound library methods aren't included in the p5 type definitions
        spliceSound = p.loadSound('/src/sounds/splatter.mp3');
        // @ts-expect-error - p5.sound library methods aren't included in the p5 type definitions
        missedSound = p.loadSound('/src/sounds/missed.mp3');
        // @ts-expect-error - p5.sound library methods aren't included in the p5 type definitions
        boomSound = p.loadSound('/src/sounds/boom.mp3');
        // @ts-expect-error - p5.sound library methods aren't included in the p5 type definitions
        gameOverSound = p.loadSound('/src/sounds/over.mp3');
        // @ts-expect-error - p5.sound library methods aren't included in the p5 type definitions
        startSound = p.loadSound('/src/sounds/start.mp3');
      } catch (soundError) {
        console.error("Error loading sounds:", soundError);
      }
    } catch (error) {
      console.error("Error loading assets:", error);
    }
  };

  // Setup function
  p.setup = () => {
    p.createCanvas(800, 635);
    p.frameRate(60);
    
    // Initialize sword
    sword = {
      swipes: [],
      update() {
        if (this.swipes.length > 20) {
          this.swipes.splice(0, 2);
        }
        if (this.swipes.length > 0) {
          this.swipes.splice(0, 1);
        }
      },
      draw(p) {
        for (let i = 0; i < this.swipes.length; i++) {
          const size = p.map(i, 0, this.swipes.length, 2, 27);
          p.noStroke();
          p.fill(255);
          p.ellipse(this.swipes[i].x, this.swipes[i].y, size);
        }
      },
      swipe(x, y) {
        this.swipes.push({ x, y });
      },
      checkSlice(fruit) {
        if (fruit.sliced || this.swipes.length < 2) {
          return false;
        }
        
        const length = this.swipes.length;
        const stroke1 = this.swipes[length - 1];
        const stroke2 = this.swipes[length - 2];
        
        const d1 = p.dist(stroke1.x, stroke1.y, fruit.x, fruit.y);
        const d2 = p.dist(stroke2.x, stroke2.y, fruit.x, fruit.y);
        const d3 = p.dist(stroke1.x, stroke1.y, stroke2.x, stroke2.y);
        
        const sliced = (d1 < fruit.size / 2) || ((d1 < d3 && d2 < d3) && (d3 < p.width / 4));
        return sliced;
      }
    };
    
    // Set initial game state
    resetGame();
  };

  // Draw function
  p.draw = () => {
    p.background(backgroundImage);
    
    if (!isPlaying) {
      drawStartScreen();
      return;
    }
    
    if (gameOver) {
      drawGameOverScreen();
      return;
    }
    
    // Game logic
    updateGame();
    
    // Draw game elements
    drawFruits();
    sword.draw(p);
    drawHUD();
    
    // Update timer
    if (p.millis() - lastTimerUpdate > 1000) {
      timerValue--;
      lastTimerUpdate = p.millis();
      
      if (timerValue <= 0) {
        endGame();
      }
    }
  };

  // Mouse events
  p.mousePressed = () => {
    if (!isPlaying && !gameOver) {
      startGame();
      return;
    }
    
    if (gameOver) {
      if (isMouseOverRestartButton()) {
        resetGame();
        startGame();
      }
      return;
    }
    
    sword.swipe(p.mouseX, p.mouseY);
    fruitsSlicedPerPress = 0;
  };
  
  p.mouseDragged = () => {
    if (!isPlaying || gameOver) return false;
    
    sword.swipe(p.mouseX, p.mouseY);
    
    // Check for slicing
    fruits.forEach(fruit => {
      if (!fruit.sliced && sword.checkSlice(fruit)) {
        fruit.sliced = true;
        
        if (fruit.type === 'boom') {
          if (boomSound) boomSound.play();
          endGame();
        } else {
          if (spliceSound) spliceSound.play();
          score++;
          fruitsSlicedPerPress++;
        }
      }
    });
    
    return false; // Prevent default
  };
  
  p.mouseReleased = () => {
    if (fruitsSlicedPerPress > 1) {
      // Bonus for multiple fruits sliced in one swipe
      score += fruitsSlicedPerPress - 1;
    }
    fruitsSlicedPerPress = 0;
  };

  // Game functions
  const startGame = () => {
    isPlaying = true;
    gameOver = false;
    if (startSound) startSound.play();
  };
  
  const resetGame = () => {
    score = 0;
    lives = 3;
    timerValue = 60;
    fruits = [];
    isPlaying = false;
    gameOver = false;
    lastTimerUpdate = p.millis();
  };
  
  const endGame = () => {
    isPlaying = false;
    gameOver = true;
    if (gameOverSound) gameOverSound.play();
  };
  
  const updateGame = () => {
    // Update sword
    if (p.frameCount % 2 === 0) {
      sword.update();
    }
    
    // Spawn new fruits
    if (p.frameCount % 15 === 0) {
      if (p.noise(p.frameCount) > 0.7) {
        fruits.push(createRandomFruit());
      }
      
      // Increase difficulty as time decreases
      if (timerValue < 30 && p.noise(p.frameCount + 500) > 0.7) {
        fruits.push(createRandomFruit());
      }
      
      if (timerValue < 15 && p.noise(p.frameCount + 1000) > 0.7) {
        fruits.push(createRandomFruit());
      }
    }
    
    // Update fruits
    for (let i = fruits.length - 1; i >= 0; i--) {
      const fruit = fruits[i];
      
      // Update position
      fruit.x += fruit.xSpeed;
      fruit.y += fruit.ySpeed;
      fruit.ySpeed += 0.1; // gravity
      
      // Check if fruit is off screen
      if (fruit.y - fruit.size > p.height) {
        if (!fruit.sliced && fruit.type !== 'boom') {
          // Missed a fruit
          if (missedSound) missedSound.play();
          lives--;
          
          if (lives <= 0) {
            endGame();
          }
        }
        
        // Remove fruit
        fruits.splice(i, 1);
      }
    }
  };
  
  const createRandomFruit = (): Fruit => {
    const x = p.random(p.width);
    const size = p.random(40, 60);
    const type = fruitTypes[Math.floor(p.random(fruitTypes.length))];
    const color = p.color(p.random(255), p.random(255), p.random(255));
    
    return {
      x,
      y: p.height + size,
      xSpeed: x > p.width / 2 ? p.random(-2.8, -0.5) : p.random(0.5, 2.8),
      ySpeed: p.random(-15, -10),
      size,
      color,
      type,
      sliced: false,
      visible: true
    };
  };
  
  // Drawing functions
  const drawStartScreen = () => {
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(32);
    p.text("Click to Start", p.width / 2, p.height / 2);
  };
  
  const drawGameOverScreen = () => {
    p.image(gameOverImage, p.width / 2 - 245, 80, 490, 85);
    
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(40);
    p.text(`Final Score: ${score}`, p.width / 2, p.height / 2);
    
    // Draw restart button
    p.fill(255, 147, 21);
    p.rect(p.width / 2 - 100, p.height / 2 + 50, 200, 60, 10);
    p.fill(255);
    p.textSize(24);
    p.text("Play Again", p.width / 2, p.height / 2 + 80);
  };
  
  const drawFruits = () => {
    fruits.forEach(fruit => {
      if (fruit.sliced && fruit.type !== 'boom') {
        // Draw sliced fruit
        const slicedImages = slicedFruitImages[fruit.type];
        if (slicedImages) {
          p.image(slicedImages[0], fruit.x - 25, fruit.y, fruit.size, fruit.size);
          p.image(slicedImages[1], fruit.x + 25, fruit.y, fruit.size, fruit.size);
        }
      } else {
        // Draw whole fruit
        const img = fruitImages[fruit.type];
        if (img) {
          p.image(img, fruit.x - fruit.size / 2, fruit.y - fruit.size / 2, fruit.size, fruit.size);
        }
      }
    });
  };
  
  const drawHUD = () => {
    // Draw score
    p.image(scoreImage, 10, 10, 40, 40);
    p.fill(255, 147, 21);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(40);
    p.text(score, 60, 15);
    
    // Draw timer
    p.textAlign(p.CENTER, p.TOP);
    p.text(`Time: ${timerValue}`, p.width / 2, 15);
    
    // Draw lives
    drawLives();
  };
  
  const drawLives = () => {
    // Draw lives indicators
    for (let i = 0; i < 3; i++) {
      const img = i < lives ? livesImages[i] : lostLivesImages[i];
      p.image(img, p.width - 110 + i * 30, 20, img.width, img.height);
    }
  };
  
  const isMouseOverRestartButton = () => {
    return (
      p.mouseX > p.width / 2 - 100 &&
      p.mouseX < p.width / 2 + 100 &&
      p.mouseY > p.height / 2 + 50 &&
      p.mouseY < p.height / 2 + 110
    );
  };
};

// Main component
const FruitNinja = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Set loaded state after a delay to ensure assets are loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fruit-ninja-container">
      {!isLoaded && (
        <div className="loading">
          <h2>Loading Game...</h2>
        </div>
      )}
      <ReactP5Wrapper sketch={sketch} />
    </div>
  );
};

export default FruitNinja;
