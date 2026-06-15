import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLeaderboard } from '@/lib/supabase'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const leaderboard = await getLeaderboard()
    // Each entry already includes `id` (UUID) which is used for profile links
    return NextResponse.json({ leaderboard })
  } catch (error) {
    console.error('GET /api/leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
