const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const cors = require("cors")

const app = express()
app.use(cors())
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

let players = {}
let bots = {}

// --- AI BOT LOGIC ---
const BOT_COUNT = 3
const spawnBot = (id) => {
  return {
    id: `bot_${id}`,
    x: 100 + Math.random() * 50,
    y: 300 + Math.random() * 50,
    angle: 0,
    speed: 0,
    currentLap: 1,
    checkpointIndex: 0,
    finished: false,
    isBot: true,
    skin: "bot_ghost"
  }
}

// Initial bots
for (let i = 0; i < BOT_COUNT; i++) {
  bots[`bot_${i}`] = spawnBot(i)
}

const updateBots = () => {
    Object.values(bots).forEach(bot => {
        if (bot.finished) return;
        
        // Simple AI: Move towards the next checkpoint (placeholder)
        const ACC = 0.1
        const MAX = 3
        const FRICTION = 0.05
        
        bot.speed += ACC
        if (bot.speed > MAX) bot.speed = MAX
        
        // Random slight steering
        bot.angle += (Math.random() - 0.5) * 0.05
        
        bot.x += Math.cos(bot.angle) * bot.speed
        bot.y += Math.sin(bot.angle) * bot.speed

        // Boundary sanity (Simplified)
        if (bot.x < 20 || bot.x > 780 || bot.y < 20 || bot.y > 580) {
            bot.angle += Math.PI / 2
        }
    })
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  players[socket.id] = {
    id: socket.id,
    x: 100,
    y: 300,
    angle: 0,
    speed: 0,
    currentLap: 1,
    checkpointIndex: 0,
    finished: false,
    isBot: false,
    skin: "classic"
  }

  socket.emit("init", socket.id)

  socket.on("move", (data) => {
    if (players[socket.id]) {
        players[socket.id] = { ...players[socket.id], ...data }
    }
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
    delete players[socket.id]
  })
})

// Broadcast state including bots every 50ms
setInterval(() => {
  updateBots()
  io.emit("state", { ...players, ...bots })
}, 50)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`)
})
