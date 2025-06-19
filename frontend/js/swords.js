// Sword
function Sword(color){
    this.swipes = [];
    this.color = color;
};

Sword.prototype.draw = function(){

    var l = this.swipes.length;
    for(var i=0; i< this.swipes.length; i++){
        var size = map(i, 0, this.swipes.length, 2, 27);
        noStroke();
        fill(this.color);
        ellipse(this.swipes[i].x, this.swipes[i].y, size);
    }
    if(l<1){
        return;
    }
    fill(255);
    textSize(20);
};

Sword.prototype.update = function(){
    
    if(this.swipes.length > 20){ // fade swipe - delete last value
        this.swipes.splice(0,1);
        this.swipes.splice(0,1);
    }
    if(this.swipes.length > 0){
        this.swipes.splice(0,1);
    }
};

Sword.prototype.checkSlice = function (fruit) {
    // already sliced or not enough swipe data?
  
    if (!fruit) {
      console.error("Invalid fruit object passed to checkSlice")
      return false
    }
  
    if (fruit.sliced || this.swipes.length < 2) return false
  
    // Recommended: Shrink buffer slightly or match visual style
    const buffer = 4
    const hitRadiusFactor = 0.45 // smaller than 0.5 for more precise feel
  
    for (let i = this.swipes.length - 2; i >= Math.max(0, this.swipes.length - 6); i--) {
      const p1 = this.swipes[i]
      const p2 = this.swipes[i + 1]
      const vx = p2.x - p1.x
      const vy = p2.y - p1.y
      const lenSq = vx * vx + vy * vy
  
      if (lenSq < 5) continue
  
      const fx = fruit.x
      const fy = fruit.y
  
      let t = ((fx - p1.x) * vx + (fy - p1.y) * vy) / lenSq
      t = constrain(t, 0, 1)
  
      const cx = p1.x + t * vx
      const cy = p1.y + t * vy
  
      const d = dist(fx, fy, cx, cy)
      const sliceThreshold = fruit.size * hitRadiusFactor + buffer
  
      if (d <= sliceThreshold) {
        fruit.sliced = true
        return true
      }
    }
  
    return false
  }  

Sword.prototype.swipe = function(x,y){ // sword
    this.swipes.push(createVector(x, y));
}