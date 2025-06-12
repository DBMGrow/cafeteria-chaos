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
    console.error("Invalid fruit object passed to checkSlice");
    return false;
   }
   
   if (fruit.sliced || this.swipes.length < 2) return false;

   // last two swipe points  (segment P1-P2)
   var p2 = this.swipes[this.swipes.length - 1];
   var p1 = this.swipes[this.swipes.length - 2];
 
   // vector P1 → P2
   var vx = p2.x - p1.x;
   var vy = p2.y - p1.y;
   var lenSq = vx * vx + vy * vy;
   if (lenSq === 0) return false;          // identical points → no segment
 
   // project fruit centre F onto the segment, clamped to [0,1]
   var fx = fruit.x;                       // fruit centre
   var fy = fruit.y;
   var t = ((fx - p1.x) * vx + (fy - p1.y) * vy) / lenSq;
   t = constrain(t, 0, 1);                 // p5.js helper
 
   // closest point C on the segment
   var cx = p1.x + t * vx;
   var cy = p1.y + t * vy;
 
   // distance FC
   var d = dist(fx, fy, cx, cy);
 
   // slice if segment passes inside the fruit’s radius (+ a tiny buffer)
   var buffer = 10;                         // feel-free tweak (pixels)
   var sliced = d <= fruit.size * 0.5 + buffer;
 
   fruit.sliced = sliced;
   return sliced;
};

Sword.prototype.swipe = function(x,y){ // sword
    this.swipes.push(createVector(x, y));
}