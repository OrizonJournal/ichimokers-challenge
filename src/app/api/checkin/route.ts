import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseAdmin, getUserByCircleId } from '@/lib/supabase'
import { parseISO, startOfDay } from 'date-fns'
import { CHALLENGE_START, CHALLENGE_END } from '@/lib/challenge'

// GET: fetch all check-ins for current user
export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dbUser = await getUserByCircleId(session.user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('check_ins')
      .select('checked_date, activities, notes')
      .eq('user_id', dbUser.id)
      .order('checked_date', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      checkedDates: data.map((row) => row.checked_date),
      checkIns: data,
    })
  } catch (error) {
    console.error('GET /api/checkin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: toggle a check-in for a given date, optionally with activities
export async function POST(request: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { date?: string; activities?: string[]; notes?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { date, activities, notes } = body

  if (!date || typeof date !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid date' }, { status: 400 })
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  // Validate activities if provided
  if (activities !== undefined && !Array.isArray(activities)) {
    return NextResponse.json({ error: 'activities must be an array' }, { status: 400 })
  }

  // Parse and validate the date is within challenge range
  let parsedDate: Date
  try {
    parsedDate = startOfDay(parseISO(date))
  } catch {
    return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
  }

  const challengeStart = startOfDay(CHALLENGE_START)
  const challengeEnd = startOfDay(CHALLENGE_END)
  const today = startOfDay(new Date())

  if (parsedDate < challengeStart || parsedDate > challengeEnd) {
    return NextResponse.json(
      { error: 'Date is outside the challenge period (Aug 19 - Oct 13, 2026)' },
      { status: 400 }
    )
  }

  try {
    const dbUser = await getUserByCircleId(session.user.id)
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabase = getSupabaseAdmin()

    // Check if this date is already checked in
    const { data: existing, error: fetchError } = await supabase
      .from('check_ins')
      .select('id')
      .eq('user_id', dbUser.id)
      .eq('checked_date', date)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    if (existing) {
      // Already checked in — toggle off (delete)
      const { error: deleteError } = await supabase
        .from('check_ins')
        .delete()
        .eq('id', existing.id)

      if (deleteError) throw deleteError

      return NextResponse.json({ checked: false, date })
    } else {
      // Not checked in — create with optional pairs
      const { error: insertError } = await supabase
        .from('check_ins')
        .insert({
          user_id: dbUser.id,
          checked_date: date,
          activities: activities ?? [],
          notes: notes ?? null,
        })

      if (insertError) throw insertError

      return NextResponse.json({ checked: true, date, activities: activities ?? [] })
    }
  } catch (error) {
    console.error('POST /api/checkin error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
