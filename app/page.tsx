"use client"

import { useState, useEffect } from "react"
import CanvasGame from "@/components/game/CanvasGame"
import { Trophy, Users, Zap, ShoppingBag, BarChart3, CloudLightning, Share2, Crown, Star, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/store/useUserStore"
import { getLeaderboard } from "@/lib/supabase"

export default function Home() {
  const { username, wins, coins, unlockedSkins, currentSkin, setUser, unlockSkin } = useUserStore()
  const [activeTab, setActiveTab] = useState<"race" | "shop" | "leaderboard">("race")
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    if (activeTab === "leaderboard") {
      getLeaderboard().then(setLeaderboard)
    }
  }, [activeTab])

  const skins = [
    { id: "classic", name: "Classic Blue", price: 0, color: "#004aac" },
    { id: "nitro", name: "Nitro Ember", price: 500, color: "#f59e0b" },
    { id: "ghost", name: "Ghost Silver", price: 1000, color: "#94a3b8" },
    { id: "neon", name: "Neon Pulse", price: 2000, color: "#10b981" },
  ]

  const handleBuySkin = (skin: any) => {
    if (coins >= skin.price) {
      setUser({ coins: coins - skin.price })
      unlockSkin(skin.id)
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Navigation & Profille */}
        <div className="lg:col-span-3 flex flex-col gap-6 order-2 lg:order-1">
          <div className="p-8 bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] shadow-2xl">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-4 shadow-xl shadow-blue-600/20">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">{username}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="px-3 py-1 bg-blue-600/20 rounded-full border border-blue-500/30">
                   <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{wins} Total Wins</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <NavButton active={activeTab === "race"} onClick={() => setActiveTab("race")} icon={<Zap />} label="Arena Race" />
              <NavButton active={activeTab === "shop"} onClick={() => setActiveTab("shop")} icon={<ShoppingBag />} label="Cosmetic Shop" />
              <NavButton active={activeTab === "leaderboard"} onClick={() => setActiveTab("leaderboard")} icon={<BarChart3 />} label="Leaderboards" />
            </div>

            <div className="mt-8 pt-8 border-t border-white/5">
               <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-bold uppercase tracking-widest opacity-40">Coins</span>
                  </div>
                  <span className="text-lg font-black italic">{coins}</span>
               </div>
            </div>
          </div>

          <div className="p-6 bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[2rem] space-y-4">
             <div className="flex items-center gap-2 text-indigo-400">
                <Target className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Daily Challenge</span>
             </div>
             <p className="text-xs text-slate-400 leading-relaxed font-medium">Win <span className="text-white font-bold">1 match</span> today to earn <span className="text-blue-400 font-bold">100 bonus coins</span>.</p>
             <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full w-[30%]" />
             </div>
          </div>
        </div>

        {/* Center: Main Game Area */}
        <div className="lg:col-span-9 w-full order-1 lg:order-2 space-y-6">
           <AnimatePresence mode="wait">
             {activeTab === "race" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="race">
                   <CanvasGame />
                </motion.div>
             )}

             {activeTab === "shop" && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} key="shop" className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 min-h-[600px]">
                   <div className="mb-10">
                      <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Cosmetic Shop</h2>
                      <p className="text-slate-400 font-medium">Customize your arena presence with premium skins.</p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {skins.map((skin) => {
                        const isUnlocked = unlockedSkins.includes(skin.id)
                        const isSelected = currentSkin === skin.id
                        return (
                          <div key={skin.id} className={`p-8 rounded-[2rem] border transition-all ${isSelected ? 'bg-blue-600/10 border-blue-500/40' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
                             <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl" style={{ backgroundColor: skin.color, boxShadow: `0 0 20px ${skin.color}44` }} />
                                {isUnlocked ? (
                                   <div className="px-3 py-1 bg-emerald-600/20 text-emerald-400 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Unlocked</div>
                                ) : (
                                   <div className="flex items-center gap-2 text-yellow-400 font-black italic">
                                      <Star className="w-4 h-4 fill-yellow-400" />
                                      {skin.price}
                                   </div>
                                )}
                             </div>
                             <h3 className="text-xl font-bold mb-6">{skin.name}</h3>
                             <button 
                               onClick={() => isUnlocked ? setUser({ currentSkin: skin.id }) : handleBuySkin(skin)}
                               disabled={!isUnlocked && coins < skin.price}
                               className={`w-full py-4 rounded-xl font-black italic text-sm transition-all ${isSelected ? 'bg-blue-600 text-white' : 'bg-white/5 hover:bg-white/10 text-white border border-white/5 disabled:opacity-30'}`}
                             >
                               {isSelected ? "EQUIPPED" : isUnlocked ? "SELECT SKIN" : "PURCHASE"}
                             </button>
                          </div>
                        )
                      })}
                   </div>
                </motion.div>
             )}

             {activeTab === "leaderboard" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} key="leaderboard" className="bg-slate-900/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 min-h-[600px]">
                   <div className="mb-10">
                      <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Leaderboards</h2>
                      <p className="text-slate-400 font-medium">Top racers in the Mini Car Arena.</p>
                   </div>
                   <div className="space-y-3">
                      {leaderboard.length > 0 ? leaderboard.map((player, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5">
                           <div className="flex items-center gap-6">
                              <span className="text-2xl font-black italic text-slate-600 w-8">#{idx + 1}</span>
                              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center font-bold">
                                 {player.username[0].toUpperCase()}
                              </div>
                              <span className="text-lg font-bold">{player.username}</span>
                           </div>
                           <div className="flex items-center gap-12 text-right">
                              <div className="flex flex-col">
                                 <span className="text-[10px] uppercase opacity-30 font-bold">Best Lap</span>
                                 <span className="font-mono text-blue-400">{(player.best_time / 1000).toFixed(2)}s</span>
                              </div>
                              <div className="flex flex-col w-20">
                                 <span className="text-[10px] uppercase opacity-30 font-bold">Wins</span>
                                 <span className="text-xl font-black italic">{player.wins}</span>
                              </div>
                           </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-20">
                           <BarChart3 className="w-20 h-20 mb-4" />
                           <span className="font-bold uppercase tracking-widest">Loading stats...</span>
                        </div>
                      )}
                   </div>
                </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
    </main>
  )
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 w-full p-4 rounded-2xl font-bold transition-all text-sm group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}
    >
      <span className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>{icon}</span>
      {label}
    </button>
  )
}
