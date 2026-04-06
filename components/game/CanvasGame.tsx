"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Trophy, Timer, ChevronRight, Share2, RefreshCcw, ShoppingBag, BarChart3, CloudLightning } from "lucide-react"
import { createCar, updateCar, Car, lerp, lerpAngle } from "./car"
import { useGameLoop } from "./useGameLoop"
import { socket } from "@/lib/socket"
import { track, isColliding } from "./track"
import { useUserStore } from "@/store/useUserStore"
import { updatePlayerStats } from "@/lib/supabase"
import { trackEvent } from "@/lib/analytics"

// --- Types ---
type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
}

export default function CanvasGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentSkin, addWin, username, bestTime } = useUserStore()
  
  // Game state refs (no re-renders)
  const localCar = useRef<Car>(createCar())
  const remotePlayers = useRef<Record<string, Car>>({})
  const myId = useRef<string | null>(null)
  const lastEmitTime = useRef(0)
  const particles = useRef<Particle[]>([])
  const shake = useRef({ x: 0, y: 0, intensity: 0 })
  
  // Visual state refs
  const backgroundParticles = useMemo(() => {
    return Array.from({ length: 50 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 600,
      speed: 0.2 + Math.random() * 0.5
    }))
  }, [])

  // Input ref
  const input = useRef({
    up: false,
    down: false,
    left: false,
    right: false,
  })

  // State for HUD & Animations
  const [hudState, setHudState] = useState({
    speed: 0,
    lap: 1,
    pos: 1,
    totalPlayers: 1,
    finished: false,
  })
  
  const [countdown, setCountdown] = useState<number | null>(null)
  const [isRacing, setIsRacing] = useState(false)

  // --- Sound Logic ---
  const playSound = (type: "collision" | "finish" | "start") => {
     // Placeholder
  }

  // --- Helper: Particle System ---
  const createParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      particles.current.push({
        x, y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 1.0,
        color
      })
    }
  }

  useEffect(() => {
    socket.connect()

    socket.on("init", (id: string) => {
      myId.current = id
      localCar.current.id = id
      localCar.current.skin = currentSkin
      startCountdown()
      trackEvent("game_started", { userId: id, skin: currentSkin })
    })

    socket.on("state", (players: Record<string, any>) => {
      Object.entries(players).forEach(([id, sp]) => {
        if (id === myId.current) return 
        if (!remotePlayers.current[id]) {
          remotePlayers.current[id] = {
            ...createCar(id),
            ...sp,
            targetX: sp.x,
            targetY: sp.y,
            targetAngle: sp.angle,
            history: []
          }
        } else {
          const p = remotePlayers.current[id]
          p.targetX = sp.x
          p.targetY = sp.y
          p.targetAngle = sp.angle
          p.speed = sp.speed
          p.currentLap = sp.currentLap
          p.checkpointIndex = sp.checkpointIndex
          p.finished = sp.finished
          p.skin = sp.skin || "classic"
          p.isBot = sp.isBot || false
        }
      })

      Object.keys(remotePlayers.current).forEach(id => {
        if (!players[id]) delete remotePlayers.current[id]
      })

      const allPlayers = [localCar.current, ...Object.values(remotePlayers.current)]
      allPlayers.sort((a, b) => {
        if (a.finished && !b.finished) return -1
        if (!a.finished && b.finished) return 1
        if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap
        if (b.checkpointIndex !== a.checkpointIndex) return b.checkpointIndex - a.checkpointIndex
        return 0 
      })

      const myPos = allPlayers.findIndex(p => p.id === myId.current) + 1
      setHudState(prev => ({
        ...prev,
        pos: myPos,
        totalPlayers: allPlayers.length,
        lap: localCar.current.currentLap,
        speed: Math.round(localCar.current.speed * 10),
        finished: localCar.current.finished
      }))
    })

    const down = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") input.current.up = true
      if (e.key === "ArrowDown" || e.key === "s") input.current.down = true
      if (e.key === "ArrowLeft" || e.key === "a") input.current.left = true
      if (e.key === "ArrowRight" || e.key === "d") input.current.right = true
    }

    const up = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") input.current.up = false
      if (e.key === "ArrowDown" || e.key === "s") input.current.down = false
      if (e.key === "ArrowLeft" || e.key === "a") input.current.left = false
      if (e.key === "ArrowRight" || e.key === "d") input.current.right = false
    }

    window.addEventListener("keydown", down)
    window.addEventListener("keyup", up)

    return () => {
      window.removeEventListener("keydown", down)
      window.removeEventListener("keyup", up)
      socket.disconnect()
    }
  }, [currentSkin])

  const startCountdown = () => {
    let count = 3
    setCountdown(count)
    const interval = setInterval(() => {
      count--
      if (count === 0) {
        setCountdown(0) 
        setIsRacing(true)
        playSound("start")
        setTimeout(() => setCountdown(null), 1000)
        clearInterval(interval)
      } else {
        setCountdown(count)
      }
    }, 1000)
  }

  useGameLoop(() => {
    if (isRacing && !localCar.current.finished) {
      updateCar(localCar.current, input.current)
      if (input.current.up) shake.current.intensity = Math.max(shake.current.intensity, 0.5)

      track.walls.forEach(wall => {
        if (isColliding(localCar.current.x, localCar.current.y, wall)) {
          localCar.current.speed *= -0.5
          localCar.current.x -= Math.cos(localCar.current.angle) * 12
          localCar.current.y -= Math.sin(localCar.current.angle) * 12
          shake.current.intensity = 4
          createParticles(localCar.current.x, localCar.current.y, "#f43f5e", 8)
          playSound("collision")
        }
      })

      const nextCp = track.checkpoints[localCar.current.checkpointIndex]
      if (isColliding(localCar.current.x, localCar.current.y, nextCp)) {
        localCar.current.checkpointIndex++
        createParticles(localCar.current.x, localCar.current.y, "#10b981", 15)
        if (localCar.current.checkpointIndex >= track.checkpoints.length) {
          localCar.current.checkpointIndex = 0
          localCar.current.currentLap++
          if (localCar.current.currentLap > 3) {
            localCar.current.finished = true
            playSound("finish")
            addWin()
            updatePlayerStats("guest", 1, bestTime) // placeholder
            trackEvent("match_finished", { pos: hudState.pos, lap: localCar.current.currentLap })
          }
        }
      }
    }

    const now = Date.now()
    if (now - lastEmitTime.current > 50) {
      socket.emit("move", {
        x: localCar.current.x,
        y: localCar.current.y,
        angle: localCar.current.angle,
        speed: localCar.current.speed,
        currentLap: localCar.current.currentLap,
        checkpointIndex: localCar.current.checkpointIndex,
        finished: localCar.current.finished,
        skin: currentSkin
      })
      lastEmitTime.current = now
    }

    Object.values(remotePlayers.current).forEach(p => {
      const dx = (p.targetX || p.x) - p.x
      const dy = (p.targetY || p.y) - p.y
      const factor = 0.12 + Math.sqrt(dx * dx + dy * dy) * 0.005
      
      p.x = lerp(p.x, p.targetX || p.x, Math.min(factor, 0.5))
      p.y = lerp(p.y, p.targetY || p.y, Math.min(factor, 0.5))
      p.angle = lerpAngle(p.angle, p.targetAngle || p.angle, 0.15)
      
      p.history.push({ x: p.x, y: p.y })
      if (p.history.length > 8) p.history.shift()
    })
    
    localCar.current.history.push({ x: localCar.current.x, y: localCar.current.y })
    if (localCar.current.history.length > 8) localCar.current.history.shift()

    if (shake.current.intensity > 0) {
      shake.current.x = (Math.random() - 0.5) * shake.current.intensity
      shake.current.y = (Math.random() - 0.5) * shake.current.intensity
      shake.current.intensity *= 0.9
    } else {
      shake.current.x = 0; shake.current.y = 0;
    }

    particles.current.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.02;
    })
    particles.current = particles.current.filter(p => p.life > 0)

    backgroundParticles.forEach(p => {
       p.y += p.speed
       if (p.y > 600) p.y = -10
    })

    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx || !canvas) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(shake.current.x, shake.current.y)

    ctx.fillStyle = "rgba(15, 23, 42, 0.4)"
    backgroundParticles.forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 1, 0, Math.PI * 2); ctx.fill();
    })

    ctx.fillStyle = "#1e293b"
    track.walls.forEach(wall => ctx.fillRect(wall.x, wall.y, wall.width, wall.height))

    const nextCpv = track.checkpoints[localCar.current.checkpointIndex]
    ctx.strokeStyle = "rgba(16, 185, 129, 0.4)"
    ctx.setLineDash([5, 5])
    ctx.strokeRect(nextCpv.x, nextCpv.y, nextCpv.width, nextCpv.height)
    ctx.setLineDash([])

    Object.values(remotePlayers.current).forEach(p => {
      const color = p.isBot ? "#94a3b8" : (p.skin === "nitro" ? "#f59e0b" : "#6366f1")
      renderCar(ctx, p, color)
    })

    const myColor = currentSkin === "nitro" ? "#f59e0b" : "#004aac"
    renderCar(ctx, localCar.current, myColor)

    particles.current.forEach(p => {
      ctx.globalAlpha = p.life
      ctx.fillStyle = p.color
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    })
    ctx.restore()
  })

  function renderCar(ctx: CanvasRenderingContext2D, car: Car, color: string) {
    if (car.history.length > 2) {
      ctx.beginPath()
      ctx.strokeStyle = color + "22"
      ctx.lineWidth = 14
      ctx.moveTo(car.history[0].x, car.history[0].y)
      car.history.forEach(h => ctx.lineTo(h.x, h.y))
      ctx.stroke()
    }

    ctx.save()
    if (car.finished) ctx.globalAlpha = 0.3
    ctx.translate(car.x, car.y)
    ctx.rotate(car.angle)
    const scale = 1 + (Math.abs(car.speed) / 50)
    ctx.scale(scale, 1)

    ctx.fillStyle = color
    ctx.shadowBlur = 10; ctx.shadowColor = color;
    ctx.fillRect(-15, -8, 30, 16)
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255, 255, 255, 0.6)"
    ctx.fillRect(5, -6, 4, 12)

    if (currentSkin === "nitro") {
       ctx.fillStyle = "#fbbf24"
       ctx.fillRect(-18, -4, 3, 8)
    }

    ctx.restore()
    ctx.globalAlpha = 1.0
  }

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
      <canvas ref={canvasRef} width={800} height={600} className="w-full h-full cursor-crosshair opacity-90 transition-opacity duration-1000 group-hover:opacity-100" />
      
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
        <div className="flex gap-1.5 p-1.5 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl">
          <div className="flex flex-col px-4 py-2 bg-white/5 rounded-[1rem] border border-white/5">
            <span className="text-[10px] uppercase opacity-40 tracking-widest font-bold">Lap progress</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-white">{hudState.finished ? "FIN" : `${Math.min(3, hudState.lap)}`}</span>
              <span className="text-xs pb-1 opacity-20 font-bold">/ 3</span>
            </div>
          </div>
          <div className="flex flex-col px-4 py-2 bg-blue-600/10 rounded-[1rem] border border-blue-500/20">
            <span className="text-[10px] uppercase text-blue-400 tracking-widest font-bold">Arena Rank</span>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-black text-blue-400">#{hudState.pos}</span>
              <span className="text-xs pb-1 opacity-40 text-blue-400 font-bold">of {hudState.totalPlayers}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pointer-events-auto">
          <div className="p-1 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center">
            <div className="flex items-center gap-4 px-6 py-3 bg-white/5 rounded-[1rem]">
               <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
               <div className="flex flex-col">
                 <span className="text-[10px] uppercase opacity-40 font-bold tracking-[0.2em]">Velocity</span>
                 <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black text-white tracking-tighter">{hudState.speed}</span>
                   <span className="text-[10px] opacity-30 font-bold italic">KM/S</span>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {countdown !== null && (
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            key={countdown}
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-40"
          >
            <h1 className="text-[12rem] font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              {countdown === 0 ? "GO!" : countdown}
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {hudState.finished && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50 p-6"
        >
          <motion.div 
            initial={{ y: 50, scale: 0.9 }}
            animate={{ y: 0, scale: 1 }}
            className="w-full max-w-md bg-slate-900 overflow-hidden rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)]"
          >
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(37,99,235,0.4)]">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase mb-2 leading-none">
                {hudState.pos === 1 ? "Victory!" : "Finished!"}
              </h2>
              <p className="text-slate-400 font-medium text-lg mb-10">You dominated the arena at {hudState.speed} KM/S</p>
              
              <div className="grid grid-cols-1 w-full gap-4 mb-10">
                <div className="p-6 bg-white/5 rounded-3xl flex items-center justify-between border border-white/5">
                   <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-blue-400" />
                      <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Final Rank</span>
                   </div>
                   <span className="text-2xl font-black text-white italic">#{hudState.pos}</span>
                </div>
              </div>

              <div className="flex gap-4 w-full">
                <button 
                  onClick={() => window.location.reload()}
                  className="flex-1 py-5 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black text-white transition-all transform hover:-translate-y-1 hover:shadow-2xl flex items-center justify-center gap-3"
                >
                  <RefreshCcw className="w-5 h-5" />
                  RACE AGAIN
                </button>
                <button className="px-5 aspect-square bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center transition-all">
                  <Share2 className="w-6 h-6 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end md:hidden pointer-events-none">
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onPointerDown={() => input.current.left = true}
            onPointerUp={() => input.current.left = false}
            className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl active:scale-95 transition-all flex items-center justify-center text-white"
          >
            ←
          </button>
          <button 
            onPointerDown={() => input.current.right = true}
            onPointerUp={() => input.current.right = false}
            className="w-16 h-16 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl active:scale-95 transition-all flex items-center justify-center text-white"
          >
            →
          </button>
        </div>
        
        <div className="flex flex-col gap-4 pointer-events-auto">
          <button 
            onPointerDown={() => input.current.up = true}
            onPointerUp={() => input.current.up = false}
            className="w-20 h-20 bg-blue-600/50 backdrop-blur-xl border border-blue-500/30 rounded-full active:scale-90 transition-all flex items-center justify-center text-white shadow-lg shadow-blue-600/20"
          >
            DRIVE
          </button>
          <button 
            onPointerDown={() => input.current.down = true}
            onPointerUp={() => input.current.down = false}
            className="w-16 h-16 bg-red-600/30 backdrop-blur-xl border border-red-500/20 rounded-2xl active:scale-95 transition-all flex items-center justify-center text-white"
          >
            REV
          </button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-xl rounded-full border border-white/10 text-white/40 text-[10px] font-bold uppercase tracking-[0.3em] pointer-events-none">
        <div className="w-1 h-1 bg-white/20 rounded-full animate-pulse" />
        {username} connected
      </div>
    </div>
  )
}
