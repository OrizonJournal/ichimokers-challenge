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

export async function POST(request: NextRequest) {
  if (!verifyAdminPassword(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { userId?: string; amount?: number }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { userId, amount } = body

  if (!userId || typeof userId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid userId' }, { status: 400 })
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount)) {
    return NextResponse.json({ error: 'Amount must be an integer' }, { status: 400 })
  }

  try {
    const supabase = getSupabaseAdmin()

    // Fetch current user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, bonus_points')
      .eq('id', userId)
      .single()

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate new bonus points (ensure it doesn't go below 0)
    const newBonusPoints = Math.max(0, user.bonus_points + amount)

    // Update bonus points
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ bonus_points: newBonusPoints })
      .eq('id', userId)
      .select('bonus_points')
      .single()

    if (updateError) throw updateError

    // Sum all activities for this user to compute total points
    const { data: userCheckIns, error: countError } = await supabase
      .from('check_ins')
      .select('activities')
      .eq('user_id', userId)

    if (countError) throw countError

    const totalActivities = (userCheckIns ?? []).reduce(
      (sum, ci) => sum + (Array.isArray(ci.activities) ? ci.activities.length : 0),
      0
    )
    const totalPoints = totalActivities + (updatedUser?.bonus_points ?? 0)

    return NextResponse.json({
      success: true,
      userId,
      bonus_points: updatedUser?.bonus_points ?? newBonusPoints,
      total_points: totalPoints,
    })
  } catch (error) {
    console.error('POST /api/admin/points error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
