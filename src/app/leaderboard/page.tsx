import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getLeaderboard, getUserByCircleId } from '@/lib/supabase'
import LeaderboardRow from '@/components/LeaderboardRow'
import { TOTAL_DAYS, getDaysElapsed } from '@/lib/challenge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function LeaderboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const [leaderboard, dbUser] = await Promise.all([
    getLeaderboard().catch(() => []),
    getUserByCircleId(session.user.id).catch(() => null),
  ])

  const currentUserRank = leaderboard.findIndex((e) => e.id === dbUser?.id) + 1
  const daysElapsed = getDaysElapsed()

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="pt-2 mb-6">
        <h1 className="text-text-primary font-black text-xl tracking-tight">
          Leaderboard
        </h1>
        <p className="text-text-muted text-xs mt-0.5">
          Day {Math.min(daysElapsed, TOTAL_DAYS)} of {TOTAL_DAYS} • {leaderboard.length} challengers
        </p>
      </div>

      {/* Top 3 podium - visually distinct */}
      {leaderboard.length >= 3 && (
        <div className="mb-6 grid grid-cols-3 gap-2">
          {/* 2nd place */}
          <PodiumItem
            entry={leaderboard[1]}
            rank={2}
            isCurrentUser={leaderboard[1].id === dbUser?.id}
          />
          {/* 1st place - taller */}
          <PodiumItem
            entry={leaderboard[0]}
            rank={1}
            isCurrentUser={leaderboard[0].id === dbUser?.id}
            tall
          />
          {/* 3rd place */}
          <PodiumItem
            entry={leaderboard[2]}
            rank={3}
            isCurrentUser={leaderboard[2].id === dbUser?.id}
          />
        </div>
      )}

      {/* Your rank banner (if not in top 3) */}
      {currentUserRank > 3 && dbUser && (
        <div className="mb-4 card border-accent/30 bg-accent/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-muted text-xs">Your rank</p>
              <p className="text-accent-light font-bold text-lg">#{currentUserRank}</p>
            </div>
            <div className="text-right">
              <p className="text-text-muted text-xs">Points to next rank</p>
              {currentUserRank > 1 && (
                <p className="text-text-primary font-bold text-sm">
                  +{leaderboard[currentUserRank - 2].total_points - leaderboard[currentUserRank - 1].total_points + 1} pts
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full ranking list */}
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏆</div>
            <p className="text-text-secondary font-medium">No challengers yet</p>
            <p className="text-text-muted text-sm mt-1">Be the first to check in!</p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              rank={index + 1}
              isCurrentUser={entry.id === dbUser?.id}
            />
          ))
        )}
      </div>

      {/* Challenge scoring info */}
      <div className="mt-6 card text-center">
        <p className="text-text-muted text-xs">
          Punti = attività completate (1 pt ciascuna) + bonus
        </p>
        <p className="text-text-muted text-xs mt-1">
          Max possibile: {TOTAL_DAYS * 5} pts ({TOTAL_DAYS} giorni × 5 attività)
        </p>
      </div>
    </div>
  )
}

interface PodiumEntry {
  id: string
  name: string
  avatar_url: string | null
  total_points: number
  days_checked: number
}

function PodiumItem({
  entry,
  rank,
  isCurrentUser,
  tall,
}: {
  entry: PodiumEntry
  rank: number
  isCurrentUser?: boolean
  tall?: boolean
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'
  const borderColor =
    rank === 1
      ? 'border-yellow-500/50'
      : rank === 2
      ? 'border-slate-400/40'
      : 'border-amber-700/40'
  const bgColor =
    rank === 1
      ? 'bg-yellow-500/10'
      : rank === 2
      ? 'bg-slate-400/10'
      : 'bg-amber-700/10'
  const textColor =
    rank === 1
      ? 'text-yellow-400'
      : rank === 2
      ? 'text-slate-300'
      : 'text-amber-600'

  return (
    <Link
      href={`/profile/${entry.id}`}
      className={`flex flex-col items-center ${bgColor} border ${borderColor} rounded-2xl p-3 ${tall ? 'pt-4 pb-5' : ''} ${isCurrentUser ? 'ring-1 ring-accent/30' : ''} transition-all active:scale-95`}
    >
      <div className="text-2xl mb-2">{medal}</div>

      {entry.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.avatar_url}
          alt={entry.name}
          className={`rounded-full object-cover border-2 ${borderColor} ${tall ? 'w-14 h-14' : 'w-11 h-11'}`}
        />
      ) : (
        <div
          className={`rounded-full flex items-center justify-center border-2 ${borderColor} ${bgColor} ${tall ? 'w-14 h-14' : 'w-11 h-11'}`}
        >
          <span className={`font-bold ${tall ? 'text-xl' : 'text-base'} ${textColor}`}>
            {entry.name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <p className="text-text-primary font-semibold text-xs mt-2 text-center line-clamp-1 w-full">
        {entry.name.split(' ')[0]}
        {isCurrentUser && <span className="text-accent-light"> (you)</span>}
      </p>
      <p className={`font-black text-sm mt-1 ${textColor}`}>{entry.total_points}</p>
      <p className="text-text-muted text-xs">pts</p>
    </Link>
  )
}
