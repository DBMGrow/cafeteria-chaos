import { useEffect, useRef, useState } from 'react';
import './FruitNinja.css';
import p5 from 'p5';

// Game settings interface
interface GameSettings {
  timeLimit: number;
  fruitSpawnRate: number;
  bombFrequency: number;
}

const FruitNinja = () => {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('fruitNinjaHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [timeLeft, setTimeLeft] = useState(60); // Default time limit: 60 seconds
  const [showMenu, setShowMenu] = useState(true);
  
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);

  // Game settings
  const getGameSettings = (): GameSettings => {
    return { 
      timeLimit: 60, 
      fruitSpawnRate: 30, 
      bombFrequency: 0.15 
    };
  };

  // Function to restart the game
  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setTimeLeft(getGameSettings().timeLimit);
    setGameOver(false);
    setShowMenu(false);
    
    // Remove old canvas and create a new p5 instance
    if (p5InstanceRef.current) {
      p5InstanceRef.current.remove();
    }
    
    if (gameContainerRef.current) {
      createP5Sketch();
    }
  };

  // Function to start game
  const startGame = () => {
    setLives(3);
    setTimeLeft(getGameSettings().timeLimit);
    handleRestart();
  };

  // Create the p5 sketch
  const createP5Sketch = () => {
    if (!gameContainerRef.current) return;

    const sketch = (p: p5) => {
      // Game variables
      type Fruit = {
        x: number;
        y: number;
        xSpeed: number;
        ySpeed: number;
        size: number;
        color: string;
        sliced: boolean;
        visible: boolean;
        type: string;
      };

      type Particle = {
        x: number;
        y: number;
        xSpeed: number;
        ySpeed: number;
        size: number;
        color: string;
        life: number;
      };

      const fruits: Fruit[] = [];
      const particles: Particle[] = [];
      const swipes: { x: number; y: number }[] = [];
      let lastMouseX = 0;
      let lastMouseY = 0;
      const gravity = 0.25;
      
      const fruitTypes = ['apple', 'banana', 'peach', 'watermelon', 'bomb'];
      const fruitColors = {
        apple: '#e74c3c',
        banana: '#f1c40f',
        peach: '#e67e22',
        watermelon: '#2ecc71',
        bomb: '#34495e'
      };

      // Create particles for sliced fruits
      const createParticles = (fruit: Fruit, count: number) => {
        const color = fruit.color;
        for (let i = 0; i < count; i++) {
          particles.push({
            x: fruit.x,
            y: fruit.y,
            xSpeed: p.random(-2, 2),
            ySpeed: p.random(-2, 2),
            size: p.random(3, 8),
            color,
            life: p.random(20, 40)
          });
        }
      };

      // Function to create a random fruit
      const createFruit = (): Fruit => {
        const x = p.random(p.width);
        const y = p.height;
        
        // Decide if this should be a bomb based on frequency
        const settings = getGameSettings();
        const shouldBeBomb = p.random() < settings.bombFrequency;
        const type = shouldBeBomb ? 'bomb' : fruitTypes[Math.floor(p.random(fruitTypes.length - 1))]; // Exclude bomb from regular selection
        
        const size = type === 'watermelon' ? 60 : 40;
        
        return {
          x,
          y,
          xSpeed: x > p.width / 2 ? p.random(-3, -1) : p.random(1, 3),
          ySpeed: p.random(-15, -10),
          size,
          color: fruitColors[type as keyof typeof fruitColors],
          sliced: false,
          visible: true,
          type
        };
      };

      // Function to update a fruit's position
      const updateFruit = (fruit: Fruit) => {
        if (fruit.sliced) {
          // If sliced, apply more gravity
          fruit.ySpeed += gravity * 1.5;
        } else {
          fruit.ySpeed += gravity;
        }
        
        fruit.x += fruit.xSpeed;
        fruit.y += fruit.ySpeed;
        
        // Mark as not visible if it falls off screen
        if (fruit.y > p.height) {
          fruit.visible = false;
          
          // If it wasn't sliced and it's not a bomb, lose a life
          if (!fruit.sliced && fruit.type !== 'bomb' && !gameOver) {
            setLives((prev) => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                updateHighScore();
              }
              return newLives;
            });
          }
        }
      };

      // Function to update particles
      const updateParticles = () => {
        for (let i = particles.length - 1; i >= 0; i--) {
          const particle = particles[i];
          
          // Update position
          particle.x += particle.xSpeed;
          particle.y += particle.ySpeed;
          particle.ySpeed += gravity * 0.1;
          
          // Decrease life
          particle.life--;
          
          // Remove dead particles
          if (particle.life <= 0) {
            particles.splice(i, 1);
          }
        }
      };

      // Function to check if a swipe has sliced a fruit
      const checkSlice = (fruit: Fruit) => {
        if (fruit.sliced || swipes.length < 2) return false;
        
        const lastSwipe = swipes[swipes.length - 1];
        
        // Distance calculations
        const d1 = p.dist(lastSwipe.x, lastSwipe.y, fruit.x, fruit.y);
        
        // If the swipe is close enough to the fruit, slice it
        if (d1 < fruit.size/2) {
          fruit.sliced = true;
          
          // Create particles for sliced fruit
          createParticles(fruit, 10);
          
          if (fruit.type === 'bomb') {
            // If it's a bomb, lose a life
            setLives((prev) => {
              const newLives = prev - 1;
              if (newLives <= 0) {
                setGameOver(true);
                updateHighScore();
              }
              return newLives;
            });
          } else {
            // If it's a fruit, add points
            setScore(prev => prev + 1);
          }
          
          return true;
        }
        
        return false;
      };

      // Update high score
      const updateHighScore = () => {
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem('fruitNinjaHighScore', score.toString());
        }
      };

      // p5.js setup function
      p.setup = () => {
        p.createCanvas(800, 600);
        p.frameRate(60);
        p.colorMode(p.RGB);
      };

      // p5.js draw function - runs continuously
      p.draw = () => {
        p.background(51);
        
        if (gameOver) {
          return;
        }
        
        // Handle time countdown
        if (p.frameCount % 60 === 0) {
          setTimeLeft(prevTime => {
            const newTime = prevTime - 1;
            if (newTime <= 0) {
              setGameOver(true);
              updateHighScore();
              return 0;
            }
            return newTime;
          });
        }
        
        // Add new fruits randomly based on game settings
        const settings = getGameSettings();
        if (p.frameCount % settings.fruitSpawnRate === 0) {
          fruits.push(createFruit());
        }
        
        // Draw and update particles
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i];
          p.fill(particle.color);
          p.noStroke();
          p.circle(particle.x, particle.y, particle.size);
        }
        updateParticles();
        
        // Draw and update existing fruits
        for (let i = fruits.length - 1; i >= 0; i--) {
          const fruit = fruits[i];
          
          // Draw the fruit
          p.fill(fruit.color);
          p.push();
          p.translate(fruit.x, fruit.y);
          p.textSize(fruit.size);
          p.textAlign(p.CENTER, p.CENTER);
          
          // Use emojis to represent fruits
          if (fruit.sliced) {
            // Draw sliced fruit (show cut version)
            if (fruit.type === 'apple') p.text('🍎', -10, 0);
            else if (fruit.type === 'banana') p.text('🍌', -10, 0);
            else if (fruit.type === 'peach') p.text('🍑', -10, 0);
            else if (fruit.type === 'watermelon') p.text('🍉', -10, 0);
            else if (fruit.type === 'bomb') p.text('💣', -10, 0);
          } else {
            // Draw whole fruit
            if (fruit.type === 'apple') p.text('🍎', 0, 0);
            else if (fruit.type === 'banana') p.text('🍌', 0, 0);
            else if (fruit.type === 'peach') p.text('🍑', 0, 0);
            else if (fruit.type === 'watermelon') p.text('🍉', 0, 0);
            else if (fruit.type === 'bomb') p.text('💣', 0, 0);
          }
          p.pop();
          
          // Update fruit position
          updateFruit(fruit);
          
          // Check if the fruit is sliced by the current swipe
          checkSlice(fruit);
          
          // Remove invisible fruits
          if (!fruit.visible) {
            fruits.splice(i, 1);
          }
        }
        
        // Draw swipes (the sword/blade)
        p.stroke(255);
        p.strokeWeight(3);
        for (let i = 0; i < swipes.length - 1; i++) {
          p.line(swipes[i].x, swipes[i].y, swipes[i + 1].x, swipes[i + 1].y);
        }
        
        // Gradually remove old swipes
        if (swipes.length > 10) {
          swipes.splice(0, 1);
        }
        
        // Track mouse movement for swipes
        if (p.mouseIsPressed && p.mouseX !== lastMouseX && p.mouseY !== lastMouseY) {
          swipes.push({ x: p.mouseX, y: p.mouseY });
          lastMouseX = p.mouseX;
          lastMouseY = p.mouseY;
        }
      };
      
      // Register mouse release to clear swipes
      p.mouseReleased = () => {
        swipes.splice(0, swipes.length);
      };
    };

    // Create new p5 instance
    p5InstanceRef.current = new p5(sketch, gameContainerRef.current);
  };

  // Initialize p5 sketch
  useEffect(() => {
    if (!showMenu) {
      createP5Sketch();
    }
    
    // Clean up on component unmount
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
      }
    };
  }, [showMenu]);

  return (
    <div className="fruit-ninja-container">
      {showMenu ? (
        <div className="game-menu">
          <h1>Fruit Ninja</h1>
          <p className="high-score">High Score: {highScore}</p>
          <div className="mode-buttons">
            <button onClick={startGame}>Start Game</button>
          </div>
          <div className="instructions">
            <h2>How to Play</h2>
            <p>Slice fruits with your mouse or finger. Avoid bombs!</p>
            <p>You have 3 lives and 60 seconds.</p>
            <p>Miss a fruit and lose a life.</p>
            <p>Slice a bomb and lose a life.</p>
            <p>Score as many points as possible before time runs out or you lose all lives!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="game-info">
            <div className="score">Score: {score}</div>
            <div className="timer">Time: {timeLeft}s</div>
            <div className="lives">Lives: {lives}</div>
          </div>
          
          <div className="game-area" ref={gameContainerRef} />
          
          {gameOver && (
            <div className="game-over">
              <h2>Game Over!</h2>
              <p>Your score: {score}</p>
              {score > highScore && (
                <p className="new-high-score">New High Score!</p>
              )}
              <div className="game-over-buttons">
                <button onClick={handleRestart}>Play Again</button>
                <button onClick={() => setShowMenu(true)}>Main Menu</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FruitNinja;
