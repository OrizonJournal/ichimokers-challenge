import { redirect, notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
  getUserById,
  getUserByCircleId,
  getUserRecentCheckIns,
  getSupabaseAdmin,
} from '@/lib/supabase'
import { calculatePoints } from '@/lib/challenge'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import Image from 'next/image'
import ProfileEditForm from './ProfileEditForm'

export const dynamic = 'force-dynamic'

interface CheckIn {
  id: string
  checked_date: string
  activities: string[]
  notes: string | null
  created_at: string
}

function PairPill({ pair }: { pair: string }) {
  return (
    <span className="inline-flex items-center bg-accent/15 text-accent-light border border-accent/25 rounded-full px-2.5 py-1 text-xs font-semibold">
      {pair}
    </span>
  )
}

function CheckInCard({ checkIn }: { checkIn: CheckIn }) {
  const formattedDate = format(parseISO(checkIn.checked_date), 'EEE, d MMM', { locale: it })
  return (
    <div className="bg-surface-3 border border-white/5 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-text-secondary text-sm font-medium capitalize">{formattedDate}</span>
        <div className="flex items-center gap-1 bg-success/15 border border-success/20 rounded-full px-2 py-0.5">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4l2 2L6.5 2" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-success text-xs font-medium">Check-in</span>
        </div>
      </div>
      {checkIn.activities && checkIn.activities.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {checkIn.activities.map((act) => (
            <PairPill key={act} pair={act} />
          ))}
        </div>
      ) : (
        <p className="text-text-muted text-xs">Nessuna attività registrata</p>
      )}
      {checkIn.notes && (
        <p className="text-text-secondary text-xs mt-2 italic">{checkIn.notes}</p>
      )}
    </div>
  )
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/')
  }

  const { id } = await params

  const [profileUser, viewerDbUser] = await Promise.all([
    getUserById(id).catch(() => null),
    getUserByCircleId(session.user.id).catch(() => null),
  ])

  if (!profileUser) {
    notFound()
  }

  const isOwn = viewerDbUser?.id === profileUser.id

  const recentCheckIns = await getUserRecentCheckIns(profileUser.id, 15).catch(() => [] as CheckIn[])

  // Get all check-ins to count days and sum activity points
  const supabase = getSupabaseAdmin()
  const { data: allCheckIns } = await supabase
    .from('check_ins')
    .select('activities')
    .eq('user_id', profileUser.id)

  const checkInCount = allCheckIns?.length ?? 0
  const totalActivities = (allCheckIns ?? []).reduce(
    (sum, ci) => sum + (Array.isArray(ci.activities) ? ci.activities.length : 0),
    0
  )
  const totalPoints = calculatePoints(totalActivities, profileUser.bonus_points)

  const tradingStyleLabel =
    profileUser.trading_style === 'pro-trend'
      ? 'Pro-Trend'
      : profileUser.trading_style === 'counter-trend'
      ? 'Counter-Trend'
      : null

  const tradingStyleColor =
    profileUser.trading_style === 'pro-trend'
      ? 'bg-accent/15 text-accent-light border-accent/25'
      : profileUser.trading_style === 'counter-trend'
      ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
      : ''

  return (
    <div className="page-content animate-fade-in">
      {/* Back button */}
      <div className="pt-2 mb-5 flex items-center gap-3">
        <a
          href="javascript:history.back()"
          className="flex items-center gap-1.5 text-text-muted hover:text-text-secondary transition-colors active:scale-95"
          aria-label="Go back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 14l-5-5 5-5" />
          </svg>
          <span className="text-sm">Back</span>
        </a>
        {isOwn && (
          <span className="text-xs bg-accent/15 text-accent-light border border-accent/25 rounded-full px-2.5 py-1 font-medium">
            Your profile
          </span>
        )}
      </div>

      {/* Avatar + Name header */}
      <div className="flex items-center gap-4 mb-6">
        {profileUser.avatar_url ? (
          <Image
            src={profileUser.avatar_url}
            alt={profileUser.name}
            width={72}
            height={72}
            className="w-18 h-18 rounded-full object-cover border-2 border-accent/30"
            unoptimized
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-accent/40 to-accent-dark flex items-center justify-center border-2 border-accent/30 flex-shrink-0">
            <span className="text-white font-black text-2xl">
              {profileUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-text-primary font-black text-xl leading-tight truncate">
            {profileUser.name}
          </h1>
          {tradingStyleLabel && (
            <span className={`inline-flex mt-1 items-center text-xs font-semibold rounded-full px-2.5 py-1 border ${tradingStyleColor}`}>
              {tradingStyleLabel === 'Pro-Trend' ? '📈' : '📉'} {tradingStyleLabel}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3">
          <div className="text-xl font-black text-text-primary">{checkInCount ?? 0}</div>
          <div className="text-text-muted text-xs mt-0.5">Days done</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-accent-light">{totalPoints}</div>
          <div className="text-text-muted text-xs mt-0.5">Points</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-text-primary">
            {(profileUser.trading_pairs ?? []).length}
          </div>
          <div className="text-text-muted text-xs mt-0.5">Pairs</div>
        </div>
      </div>

      {/* Editable section (own) or read-only view (others) */}
      {isOwn ? (
        <ProfileEditForm
          userId={profileUser.id}
          initialBio={profileUser.bio ?? ''}
          initialTradingPairs={profileUser.trading_pairs ?? []}
          initialTradingStyle={profileUser.trading_style ?? null}
          initialName={profileUser.name}
        />
      ) : (
        <ReadOnlyProfile
          bio={profileUser.bio}
          tradingPairs={profileUser.trading_pairs ?? []}
          tradingStyle={profileUser.trading_style}
        />
      )}

      {/* Recent check-ins */}
      <div className="mt-7">
        <h2 className="text-text-primary font-bold text-base mb-3">
          Recent Activity
        </h2>
        {recentCheckIns.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-3xl mb-2">📅</div>
            <p className="text-text-muted text-sm">No check-ins yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {(recentCheckIns as CheckIn[]).map((ci) => (
              <CheckInCard key={ci.id} checkIn={ci} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReadOnlyProfile({
  bio,
  tradingPairs,
  tradingStyle,
}: {
  bio: string | null
  tradingPairs: string[]
  tradingStyle: 'pro-trend' | 'counter-trend' | null
}) {
  return (
    <div className="space-y-4">
      {bio && (
        <div className="card">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-2">Bio</p>
          <p className="text-text-secondary text-sm leading-relaxed">{bio}</p>
        </div>
      )}

      {tradingPairs.length > 0 && (
        <div className="card">
          <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-3">
            Favourite pairs
          </p>
          <div className="flex flex-wrap gap-2">
            {tradingPairs.map((pair) => (
              <PairPill key={pair} pair={pair} />
            ))}
          </div>
        </div>
      )}

      {!bio && tradingPairs.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-text-muted text-sm">No profile info yet</p>
        </div>
      )}
    </div>
  )
}
