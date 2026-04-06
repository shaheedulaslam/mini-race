export type Rect = {
  x: number
  y: number
  width: number
  height: number
}

export const track = {
  width: 800,
  height: 600,

  // Track boundaries (walls)
  walls: [
    // Outer boundaries
    { x: 0, y: 0, width: 800, height: 20 },
    { x: 0, y: 580, width: 800, height: 20 },
    { x: 0, y: 0, width: 20, height: 600 },
    { x: 780, y: 0, width: 20, height: 600 },

    // Inner obstacles / Track shape
    { x: 200, y: 150, width: 400, height: 20 },
    { x: 200, y: 430, width: 400, height: 20 },
  ],

  // Checkpoints (ordered)
  checkpoints: [
    { x: 50, y: 250, width: 100, height: 20 },  // Start/Finish
    { x: 400, y: 50, width: 20, height: 100 },  // Top
    { x: 650, y: 250, width: 100, height: 20 }, // Right
    { x: 400, y: 450, width: 20, height: 100 }, // Bottom
  ],
}

export const isColliding = (carX: number, carY: number, rect: Rect) => {
  const carSize = 6; // Simple radius-like check
  return (
    carX + carSize > rect.x &&
    carX - carSize < rect.x + rect.width &&
    carY + carSize > rect.y &&
    carY - carSize < rect.y + rect.height
  )
}
