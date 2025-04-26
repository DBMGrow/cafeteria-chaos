import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";
import p5 from "p5";

/* ——— Plain-object factories (no class) ——— */
const makeFruit = (pg: p5) => {
  const radius = 28;
  const x = pg.random(radius, 800 - radius);
  let y = 650;
  let vy = pg.random(-15, -10);
  const gravity = 0.4;

  return {
    sliced: false,
    update() {
      y += vy;
      vy += gravity;
    },
    offScreen() {
      return y - radius > 650;
    },
    draw() {
      pg.fill(255, 50, 50);
      pg.noStroke();
      pg.circle(x, y, radius * 2);
    },
    hit(px: number, py: number) {
      return pg.dist(x, y, px, py) < radius;
    },
    get pos() {
      return { x, y };
    },
  };
};

const makeSword = () => {
  const trail: { x: number; y: number }[] = [];

  return {
    swipe(x: number, y: number) {
      trail.push({ x, y });
      if (trail.length > 12) trail.shift();
    },
    reset() {
      trail.length = 0;
    },
    lastPoint() {
      return trail[trail.length - 1];
    },
    draw(pg: p5) {
      pg.noFill();
      pg.stroke(255);
      pg.strokeWeight(3);
      pg.beginShape();
      trail.forEach((pt) => pg.vertex(pt.x, pt.y));
      pg.endShape();
    },
  };
};

/* ——— p5 sketch ——— */
const sketch: Sketch = (pg) => {
  let fruits: ReturnType<typeof makeFruit>[] = [];
  const sword = makeSword();
  let score = 0;
  let isPlaying = false;

  pg.setup = () => {
    pg.createCanvas(800, 635);
    pg.frameRate(60);
  };

  pg.draw = () => {
    pg.background(30);

    /* home screen */
    if (!isPlaying) {
      pg.fill(255);
      pg.textAlign(pg.CENTER, pg.CENTER);
      pg.textSize(32);
      pg.text("Click to Start", pg.width / 2, pg.height / 2);
      return;
    }

    /* spawn fruit every ~15 frames */
    if (pg.frameCount % 15 === 0) fruits.push(makeFruit(pg));

    /* update + draw fruits */
    fruits.forEach((f) => {
      f.update();
      f.draw();
    });

    /* remove off-screen fruit */
    fruits = fruits.filter((f) => !f.offScreen() && !f.sliced);

    /* draw sword trail */
    sword.draw(pg);

    /* HUD */
    pg.fill(255);
    pg.noStroke();
    pg.textSize(20);
    pg.textAlign(pg.LEFT, pg.TOP);
    pg.text(`Score: ${score}`, 10, 10);
  };

  pg.mousePressed = () => {
    if (!isPlaying) {
      isPlaying = true;
      score = 0;
      fruits = [];
      return;
    }
    sword.reset(); // new swipe
    sword.swipe(pg.mouseX, pg.mouseY);
  };

  pg.mouseDragged = () => {
    sword.swipe(pg.mouseX, pg.mouseY);

    /* collision: last trail point vs fruit centre */
    const lp = sword.lastPoint();
    fruits.forEach((f) => {
      if (!f.sliced && f.hit(lp.x, lp.y)) {
        f.sliced = true;
        score += 1;
      }
    });
    return false; // prevent default drag
  };
};

export default function FruitNinjaLite() {
  return <ReactP5Wrapper sketch={sketch} />;
}
