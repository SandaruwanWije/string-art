export class BresenhamAlgorithm {
    public getCoordinates(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
      const lineCoordinates: Array<[number, number]> = [];
  
      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;
  
      while (true) {
        lineCoordinates.push([x0, y0]);
  
        if (x0 === x1 && y0 === y1) {
          break;
        }
  
        const e2 = err * 2;
  
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
  
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
  
      return lineCoordinates;
    }
  }
  