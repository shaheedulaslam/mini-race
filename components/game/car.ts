export type Car = {
  id?: string
  x: number
  y: number
  angle: number
  speed: number

  // Interpolation targets
  targetX?: number
  targetY?: number
  targetAngle?: number

  // Race State
  currentLap: number
  checkpointIndex: number
  finished: boolean

  // Visual effects
  history: { x: number; y: number }[]
  skin: string
  isBot: boolean
}

export const lerp = (start: number, end: number, factor: number) => {
  return start + (end - start) * factor
}

export const lerpAngle = (start: number, end: number, factor: number) => {
  const diff = ((end - start + Math.PI * 3) % (Math.PI * 2)) - Math.PI
  return start + diff * factor
}

export const createCar = (id?: string): Car => ({
  id,
  x: 100, // Adjusted for track start
  y: 300,
  speed: 0,
  angle: 0,
  currentLap: 1,
  checkpointIndex: 0,
  finished: false,
  history: [],
  skin: "classic",
  isBot: false,
})

export const updateCar = (car: Car, input: any) => {
  const ACC = 0.2
  const MAX = 5
  const FRICTION = 0.05
  const TURN = 0.04

  if (input.up) car.speed += ACC
  if (input.down) car.speed -= ACC

  car.speed = Math.max(-MAX / 2, Math.min(MAX, car.speed))

  if (!input.up && !input.down) {
    car.speed *= (1 - FRICTION)
  }

  if (car.speed !== 0) {
    const flip = car.speed > 0 ? 1 : -1
    if (input.left) car.angle -= TURN * flip
    if (input.right) car.angle += TURN * flip
  }

  car.x += Math.cos(car.angle) * car.speed
  car.y += Math.sin(car.angle) * car.speed

  return car
}
