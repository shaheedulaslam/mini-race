import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// --- USER STATS ---
export const updatePlayerStats = async (userId: string, wins: number, bestTime: number) => {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, wins, best_time: bestTime, last_played: new Date() })
  
  if (error) console.error("Error updating stats:", error)
  return data
}

// --- LEADERBOARD ---
export const getLeaderboard = async (limit = 10) => {
  const { data, error } = await supabase
    .from("profiles")
    .select("username, wins, best_time")
    .order("wins", { ascending: false })
    .limit(limit)
  
  if (error) console.error("Error fetching leaderboard:", error)
  return data || []
}
