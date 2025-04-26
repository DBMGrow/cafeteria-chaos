import p5 from "p5";

const fruitNinjaMini = (p: p5) => {
  /* ───── types & state ───── */
  type Fruit = { x: number; y: number; vy: number; sliced: boolean };

  /** NEW ― little background dots */
  type Dot = { x: number; y: number; vx: number; vy: number };

  const fruits: Fruit[] = [];
  const dots: Dot[]   = [];           // ← hold our moving circles
  let lastSpawn = 0;
  let score = 0;
  const gravity = 0.4;

  /* ───── helpers ───── */
  const spawnFruit = () => {
    fruits.push({
      x: p.random(40, p.width - 40),
      y: p.height + 40,
      vy: p.random(-13, -9),
      sliced: false,
    });
  };

  /** NEW ― create a background dot */
  const spawnDot = () => {
    dots.push({
      x: p.random(p.width),
      y: p.random(p.height),
      vx: p.random(-1.5, 1.5),
      vy: p.random(-1.5, 1.5),
    });
  };

  /* ───── p5 lifecycle ───── */
  p.setup = () => {
    p.createCanvas(400, 400);
    p.textSize(18);
    p.textAlign(p.LEFT, p.TOP);

    /* seed ~20 dots */
    for (let i = 0; i < 20; i++) spawnDot();
  };

  p.draw = () => {
    p.background(30);

    /* ----- dots ----- */
    dots.forEach((d) => {
      // move
      d.x += d.vx;
      d.y += d.vy;

      // bounce off walls
      if (d.x < 0 || d.x > p.width)  d.vx *= -1;
      if (d.y < 0 || d.y > p.height) d.vy *= -1;

      // draw
      p.noStroke();
      p.fill(180, 220, 255, 150);     // pale blue, semi-transparent
      p.circle(d.x, d.y, 6);          // small circle (6 px diameter)
    });

    /* ----- fruit stuff (unchanged) ----- */
    if (p.millis() - lastSpawn > 800) {
      spawnFruit();
      lastSpawn = p.millis();
    }

    fruits.forEach((f) => {
      if (f.sliced) return;
      f.y += f.vy;
      f.vy += gravity;

      p.noStroke();
      p.fill(255, 60, 60);
      p.circle(f.x, f.y, 40);
    });

    for (let i = fruits.length - 1; i >= 0; i--) {
      if (fruits[i].sliced || fruits[i].y - 20 > p.height) fruits.splice(i, 1);
    }

    /* HUD */
    p.fill(255);
    p.noStroke();
    p.text(`Score: ${score}`, 10, 10);
  };

  p.mouseDragged = () => {
    fruits.forEach((f) => {
      if (!f.sliced && p.dist(f.x, f.y, p.mouseX, p.mouseY) < 20) {
        f.sliced = true;
        score += 1;
      }
    });
    return false;
  };
};

export default fruitNinjaMini;
