declare module 'polygon-offset' {
  class PolygonOffset {
    constructor();
    data(points: number[][]): PolygonOffset;
    offset(distance: number): number[][][];
  }
  export = PolygonOffset;
}