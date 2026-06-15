import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

function verifyAdminPassword(request: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminPassword) return false

  const providedPassword =
    request.headers.get('x-admin-password') ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  return providedPassword === adminPassword
}

export async function GET(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Fetch all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })

    if (usersError) throw usersError

    const { data: checkIns, error: checkInsError } = await supabase
      .from('check_ins')
      .select('user_id, activities')

    if (checkInsError) throw checkInsError

    // Count days and sum activities per user
    const daysCounts: Record<string, number> = {}
    const activityCounts: Record<string, number> = {}
    for (const ci of checkIns) {
      daysCounts[ci.user_id] = (daysCounts[ci.user_id] || 0) + 1
      const n = Array.isArray(ci.activities) ? ci.activities.length : 0
      activityCounts[ci.user_id] = (activityCounts[ci.user_id] || 0) + n
    }

    // Build full stats for each user
    const usersWithStats = users.map((user) => {
      const daysChecked = daysCounts[user.id] || 0
      const totalPoints = (activityCounts[user.id] || 0) + user.bonus_points
      return {
        id: user.id,
        circle_member_id: user.circle_member_id,
        name: user.name,
        avatar_url: user.avatar_url,
        email: user.email,
        days_checked: daysChecked,
        bonus_points: user.bonus_points,
        total_points: totalPoints,
        created_at: user.created_at,
      }
    })

    return NextResponse.json({ users: usersWithStats })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
