import { create } from "zustand"
import { persist } from "zustand/middleware"

interface UserState {
  userId: string | null
  username: string
  wins: number
  bestTime: number
  coins: number
  unlockedSkins: string[]
  currentSkin: string
  
  setUser: (user: Partial<UserState>) => void
  addWin: () => void
  addCoins: (amount: number) => void
  unlockSkin: (skinId: string) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: null,
      username: `Racer_${Math.floor(Math.random() * 9000) + 1000}`,
      wins: 0,
      bestTime: 0,
      coins: 100,
      unlockedSkins: ["classic"],
      currentSkin: "classic",

      setUser: (user) => set((state) => ({ ...state, ...user })),
      addWin: () => set((state) => ({ wins: state.wins + 1, coins: state.coins + 50 })),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      unlockSkin: (skinId) => set((state) => ({ 
        unlockedSkins: [...state.unlockedSkins, skinId] 
      })),
    }),
    { name: "car-race-user-storage" }
  )
)
