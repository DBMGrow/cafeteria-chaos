import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import P5Wrapper from './components/P5Wrapper'
import p5 from 'p5'


function App() {
  const [count, setCount] = useState(0)

  const exampleSketch = (p: p5) => {
    let x = 50;
    let y = 50;
  
    p.setup = () => {
      p.createCanvas(400, 400);
    };
  
    p.draw = () => {
      p.background(200);
      p.fill(255, 0, 0);
      p.ellipse(x, y, 50, 50);
  
      x += p.random(-5, 5);
      y += p.random(-5, 5);
    };
  };

  return (
    <>
    <P5Wrapper sketch={exampleSketch} />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
