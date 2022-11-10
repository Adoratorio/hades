import { Vec2 } from "./declarations";

class Boundaries {  
  min : Vec2 = {
    x: 0,
    y: 0,
  }

  max : Vec2 = {
    x: 0,
    y: 0,
  }

  constructor(xMin : number, xMax : number, yMin : number, yMax : number) {
    this.min.x = xMin;
    this.min.y = yMin;
    this.max.x = xMax;
    this.max.y = yMax;
  }
}

export default Boundaries;
