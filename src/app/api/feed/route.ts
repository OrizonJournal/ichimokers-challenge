import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActivityFeed } from '@/lib/supabase'

export const revalidate = 60 // ISR: revalidate every 60 seconds

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const events = await getActivityFeed(40)
    return NextResponse.json({ events })
  } catch (error) {
    console.error('GET /api/feed error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
