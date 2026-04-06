import { useEffect, useRef } from "react"

export const useGameLoop = (callback: (delta: number) => void) => {
  const last = useRef(0)
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    let frame: number

    const loop = (time: number) => {
      const delta = time - last.current
      last.current = time

      savedCallback.current(delta)
      frame = requestAnimationFrame(loop)
    }

    frame = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(frame)
  }, [])
}
