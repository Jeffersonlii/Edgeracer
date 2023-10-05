import { DisplayObject, IPointData } from "pixi.js";

export type Position = {
  x: number,
  y: number
};
export function intersectionOfSegments(startPos1: Position, endPos1: Position, startPos2: Position, endPos2: Position) {
  const x1 = startPos1.x;
  const y1 = startPos1.y;
  const x2 = endPos1.x;
  const y2 = endPos1.y;
  const x3 = startPos2.x;
  const y3 = startPos2.y;
  const x4 = endPos2.x;
  const y4 = endPos2.y;

  var a_dx = x2 - x1;
  var a_dy = y2 - y1;
  var b_dx = x4 - x3;
  var b_dy = y4 - y3;
  var s = (-a_dy * (x1 - x3) + a_dx * (y1 - y3)) / (-b_dx * a_dy + a_dx * b_dy);
  var t = (+b_dx * (y1 - y3) - b_dy * (x1 - x3)) / (-b_dx * a_dy + a_dx * b_dy);
  return (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    ? { x: x1 + t * a_dx, y: y1 + t * a_dy }
    : null;
}

export function calcVelocity(initialPosition: Position, finalPosition: Position) {
  const time = 1;

  const velocityX = (finalPosition.x - initialPosition.x) / time;
  const velocityY = (finalPosition.y - initialPosition.y) / time;

  return Math.sqrt(velocityX ** 2 + velocityY ** 2);
}

export function calcDist(point1: Position, point2: Position) {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

export function clamp(number: number, lowerBound: number, upperBound: number) {
  return Math.max(lowerBound, Math.min(number, upperBound));
}

export function getRandomSubarray(arr: any[], size: number) {
  var shuffled = arr.slice(0), i = arr.length, min = i - size, temp, index;
  while (i-- > min) {
      index = Math.floor((i + 1) * Math.random());
      temp = shuffled[index];
      shuffled[index] = shuffled[i];
      shuffled[i] = temp;
  }
  return shuffled.slice(min);
}

export function positionOfFacing(pos: Position, angle : number, distance: number){
  return{
    x: pos.x + distance * Math.cos(toRad(angle)),
    y: pos.y + distance * Math.sin(toRad(angle))
  }
}
export function toRad(degree: number){
  return degree * (Math.PI / 180);
}

export function angleBetween(p1: Position, p2: Position){
  let rad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  let deg = rad * (180 / Math.PI); // convert to degree
  return deg < 0 ? deg + 360 : deg
}