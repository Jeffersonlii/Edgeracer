export type Position = {
    x: number,
    y: number
  };
export function intersectPoint(startPos1 : Position, endPos1 : Position, startPos2: Position, endPos2: Position) {
  const x1 = startPos1.x;
  const y1 = startPos1.y;
  const x2 = endPos1.x;
  const y2 = endPos1.y;
  const x3 = startPos2.x;
  const y3 = startPos2.y;
  const x4 = endPos2.x;
  const y4 = endPos2.y;

  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

  if (denominator === 0) {
    return null; // Lines are parallel or coincident
  }

  const intersectX = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denominator;
  const intersectY = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denominator;

  return { x: intersectX, y: intersectY };
}