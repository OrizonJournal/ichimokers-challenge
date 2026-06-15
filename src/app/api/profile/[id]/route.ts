import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import {
  getUserById,
  getUserByCircleId,
  getUserRecentCheckIns,
  updateUserProfile,
} from '@/lib/supabase'

// GET /api/profile/[id] — fetch profile + recent check-ins
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const [profileUser, recentCheckIns] = await Promise.all([
      getUserById(id),
      getUserRecentCheckIns(id, 15),
    ])

    if (!profileUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine if this is the viewer's own profile
    const viewerDbUser = await getUserByCircleId(session.user.id)
    const isOwn = viewerDbUser?.id === profileUser.id

    return NextResponse.json({
      user: {
        id: profileUser.id,
        name: profileUser.name,
        avatar_url: profileUser.avatar_url,
        bio: profileUser.bio,
        trading_pairs: profileUser.trading_pairs ?? [],
        trading_style: profileUser.trading_style,
        bonus_points: profileUser.bonus_points,
        created_at: profileUser.created_at,
      },
      recentCheckIns,
      isOwn,
    })
  } catch (error) {
    console.error('GET /api/profile/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/profile/[id] — update own profile
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const viewerDbUser = await getUserByCircleId(session.user.id)
    if (!viewerDbUser || viewerDbUser.id !== id) {
      return NextResponse.json({ error: 'Forbidden: can only edit your own profile' }, { status: 403 })
    }

    let body: {
      bio?: string | null
      trading_pairs?: string[]
      trading_style?: 'pro-trend' | 'counter-trend' | null
      name?: string
    }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    // Validate trading_style
    if (
      body.trading_style !== undefined &&
      body.trading_style !== null &&
      body.trading_style !== 'pro-trend' &&
      body.trading_style !== 'counter-trend'
    ) {
      return NextResponse.json(
        { error: 'trading_style must be "pro-trend", "counter-trend", or null' },
        { status: 400 }
      )
    }

    const updated = await updateUserProfile(id, {
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.trading_pairs !== undefined && { trading_pairs: body.trading_pairs }),
      ...(body.trading_style !== undefined && { trading_style: body.trading_style }),
      ...(body.name !== undefined && body.name.trim() !== '' && { name: body.name.trim() }),
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('PATCH /api/profile/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
