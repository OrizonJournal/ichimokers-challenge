import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          circle_member_id: string
          name: string
          avatar_url: string | null
          email: string | null
          bonus_points: number
          trading_pairs: string[]
          trading_style: 'pro-trend' | 'counter-trend' | null
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          circle_member_id: string
          name: string
          avatar_url?: string | null
          email?: string | null
          bonus_points?: number
          trading_pairs?: string[]
          trading_style?: 'pro-trend' | 'counter-trend' | null
          bio?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          circle_member_id?: string
          name?: string
          avatar_url?: string | null
          email?: string | null
          bonus_points?: number
          trading_pairs?: string[]
          trading_style?: 'pro-trend' | 'counter-trend' | null
          bio?: string | null
          created_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          user_id: string
          checked_date: string
          activities: string[]
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          checked_date: string
          activities?: string[]
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          checked_date?: string
          activities?: string[]
          notes?: string | null
          created_at?: string
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client-side Supabase client (uses anon key, respects RLS)
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (uses service role key, bypasses RLS)
export function getSupabaseAdmin() {
  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Get or create a user in Supabase from Circle OAuth data
export async function upsertUser(data: {
  circle_member_id: string
  name: string
  avatar_url?: string | null
  email?: string | null
}) {
  const supabase = getSupabaseAdmin()

  const { data: user, error } = await supabase
    .from('users')
    .upsert(
      {
        circle_member_id: data.circle_member_id,
        name: data.name,
        avatar_url: data.avatar_url ?? null,
        email: data.email ?? null,
      },
      {
        onConflict: 'circle_member_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single()

  if (error) {
    console.error('Error upserting user:', error)
    throw error
  }

  return user
}

// Get a user by their Circle member ID
export async function getUserByCircleId(circleMemberId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('circle_member_id', circleMemberId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

// Get a user by their UUID
export async function getUserById(userId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  return data
}

// Update a user's profile fields
export async function updateUserProfile(
  userId: string,
  fields: {
    trading_pairs?: string[]
    trading_style?: 'pro-trend' | 'counter-trend' | null
    bio?: string | null
    name?: string
  }
) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('users')
    .update(fields)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Get all check-ins for a user (with pairs data)
export async function getUserCheckIns(userId: string) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('check_ins')
    .select('checked_date, activities, notes, created_at')
    .eq('user_id', userId)
    .order('checked_date', { ascending: true })

  if (error) throw error

  return data
}

// Get only the checked dates as strings (for day grid)
export async function getUserCheckedDates(userId: string): Promise<string[]> {
  const rows = await getUserCheckIns(userId)
  return rows.map((r) => r.checked_date)
}

// Get recent check-ins for a user's profile page (most recent first, limited)
export async function getUserRecentCheckIns(userId: string, limit = 10) {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('check_ins')
    .select('id, checked_date, activities, notes, created_at')
    .eq('user_id', userId)
    .order('checked_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

// Get leaderboard data
export async function getLeaderboard() {
  const supabase = getSupabaseAdmin()

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, avatar_url, bonus_points')

  if (usersError) throw usersError

  const { data: checkIns, error: checkInsError } = await supabase
    .from('check_ins')
    .select('user_id, activities')

  if (checkInsError) throw checkInsError

  // Sum activities per user (1 point each) and count days
  const activityCounts: Record<string, number> = {}
  const daysCounts: Record<string, number> = {}
  for (const checkIn of checkIns) {
    daysCounts[checkIn.user_id] = (daysCounts[checkIn.user_id] || 0) + 1
    const n = Array.isArray(checkIn.activities) ? checkIn.activities.length : 0
    activityCounts[checkIn.user_id] = (activityCounts[checkIn.user_id] || 0) + n
  }

  // Build leaderboard
  const leaderboard = users.map((user) => {
    const daysChecked = daysCounts[user.id] || 0
    const totalPoints = (activityCounts[user.id] || 0) + user.bonus_points
    return {
      id: user.id,
      name: user.name,
      avatar_url: user.avatar_url,
      days_checked: daysChecked,
      bonus_points: user.bonus_points,
      total_points: totalPoints,
    }
  })

  // Sort by total points descending, then days checked
  leaderboard.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    return b.days_checked - a.days_checked
  })

  return leaderboard
}

// Get activity feed: recent check-ins + milestone events across all users
export async function getActivityFeed(limit = 30) {
  const supabase = getSupabaseAdmin()

  // Fetch recent check-ins with user info
  const { data: checkIns, error: checkInsError } = await supabase
    .from('check_ins')
    .select(`
      id,
      checked_date,
      activities,
      created_at,
      user_id,
      users!inner (
        id,
        name,
        avatar_url,
        created_at
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (checkInsError) throw checkInsError

  // Fetch all check-in counts per user for milestone detection
  const { data: allCheckIns, error: allError } = await supabase
    .from('check_ins')
    .select('user_id')

  if (allError) throw allError

  const checkInCounts: Record<string, number> = {}
  for (const ci of allCheckIns) {
    checkInCounts[ci.user_id] = (checkInCounts[ci.user_id] || 0) + 1
  }

  // Build feed events
  type FeedEvent = {
    id: string
    type: 'checkin' | 'milestone' | 'joined'
    userId: string
    userName: string
    avatarUrl: string | null
    pairs: string[]
    date: string
    createdAt: string
    milestone?: number
  }

  const events: FeedEvent[] = checkIns.map((ci) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = (ci as any).users
    const count = checkInCounts[ci.user_id] ?? 0
    const milestones = [7, 14, 21, 28, 35, 42, 49, 56]
    const hitMilestone = milestones.find((m) => m === count)

    return {
      id: ci.id,
      type: hitMilestone ? 'milestone' : 'checkin',
      userId: ci.user_id,
      userName: user.name,
      avatarUrl: user.avatar_url,
      pairs: ci.activities ?? [],
      date: ci.checked_date,
      createdAt: ci.created_at,
      milestone: hitMilestone,
    }
  })

  return events
}
