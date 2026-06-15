import Image from 'next/image'
import Link from 'next/link'

interface LeaderboardEntry {
  id: string
  name: string
  avatar_url: string | null
  days_checked: number
  bonus_points: number
  total_points: number
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry
  rank: number
  isCurrentUser?: boolean
}

const RANK_STYLES: Record<number, { bg: string; border: string; rankColor: string; rankLabel: string }> = {
  1: {
    bg: 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5',
    border: 'border-yellow-500/30',
    rankColor: 'text-yellow-400',
    rankLabel: '🥇',
  },
  2: {
    bg: 'bg-gradient-to-r from-slate-400/10 to-slate-500/5',
    border: 'border-slate-400/30',
    rankColor: 'text-slate-300',
    rankLabel: '🥈',
  },
  3: {
    bg: 'bg-gradient-to-r from-amber-700/10 to-amber-800/5',
    border: 'border-amber-700/30',
    rankColor: 'text-amber-600',
    rankLabel: '🥉',
  },
}

export default function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
  const style = RANK_STYLES[rank]
  const isTop3 = rank <= 3

  return (
    <Link
      href={`/profile/${entry.id}`}
      className={`
        flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98]
        ${isTop3
          ? `${style.bg} ${style.border}`
          : isCurrentUser
          ? 'bg-accent/10 border-accent/30'
          : 'bg-surface-2 border-white/5'
        }
        ${isCurrentUser ? 'ring-1 ring-accent/20' : ''}
      `}
    >
      {/* Rank */}
      <div className="w-8 flex items-center justify-center flex-shrink-0">
        {isTop3 ? (
          <span className="text-xl">{style.rankLabel}</span>
        ) : (
          <span className="text-text-muted font-bold text-sm">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className="flex-shrink-0">
        {entry.avatar_url ? (
          <Image
            src={entry.avatar_url}
            alt={entry.name}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full object-cover border-2 border-white/10"
            unoptimized
          />
        ) : (
          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
            isTop3 ? 'border-white/20 bg-white/10' : 'border-white/10 bg-surface-3'
          }`}>
            <span className="text-text-secondary font-bold text-base">
              {entry.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name + days */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${
            isCurrentUser ? 'text-accent-light' : 'text-text-primary'
          }`}>
            {entry.name}
          </p>
          {isCurrentUser && (
            <span className="text-xs text-accent-light bg-accent/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
              you
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-text-muted text-xs">
            {entry.days_checked} days
          </span>
          {entry.bonus_points > 0 && (
            <span className="text-accent-light text-xs">
              +{entry.bonus_points} bonus
            </span>
          )}
        </div>
      </div>

      {/* Points */}
      <div className="flex-shrink-0 text-right">
        <div className={`font-black text-lg ${
          rank === 1 ? 'text-yellow-400' :
          rank === 2 ? 'text-slate-300' :
          rank === 3 ? 'text-amber-600' :
          isCurrentUser ? 'text-accent-light' : 'text-text-primary'
        }`}>
          {entry.total_points}
        </div>
        <div className="text-text-muted text-xs">points</div>
      </div>

      {/* Chevron hint */}
      <div className="flex-shrink-0 ml-1">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#525252" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 3l4 4-4 4" />
        </svg>
      </div>
    </Link>
  )
}
