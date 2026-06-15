'use client'

import Image from 'next/image'
import Link from 'next/link'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface FeedEvent {
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

function timeAgo(isoString: string): string {
  try {
    return formatDistanceToNow(parseISO(isoString), { addSuffix: true, locale: it })
  } catch {
    return ''
  }
}

function PairPill({ pair }: { pair: string }) {
  return (
    <span className="inline-flex items-center bg-accent/15 text-accent-light border border-accent/25 rounded-full px-2 py-0.5 text-xs font-medium">
      {pair}
    </span>
  )
}

function FeedCard({ event }: { event: FeedEvent }) {
  const firstName = event.userName.split(' ')[0]
  const lastName = event.userName.split(' ').slice(1).map((n) => n[0]).join('')
  const displayName = `${firstName}${lastName ? ' ' + lastName + '.' : ''}`

  const renderContent = () => {
    if (event.type === 'milestone') {
      const milestoneEmoji =
        event.milestone === 56 ? '🏆' :
        event.milestone === 28 ? '💎' :
        event.milestone === 14 ? '🎉' :
        '⭐'
      return (
        <p className="text-text-secondary text-sm leading-snug">
          <span className="text-text-primary font-semibold">{displayName}</span>
          {' '}ha raggiunto{' '}
          <span className="text-accent-light font-bold">{event.milestone} giorni</span>
          ! {milestoneEmoji}
        </p>
      )
    }

    if (event.type === 'joined') {
      return (
        <p className="text-text-secondary text-sm leading-snug">
          <span className="text-text-primary font-semibold">{displayName}</span>
          {' '}ha iniziato la challenge 🚀
        </p>
      )
    }

    // checkin
    return (
      <div>
        <p className="text-text-secondary text-sm leading-snug mb-1.5">
          <span className="text-text-primary font-semibold">{displayName}</span>
          {event.pairs.length > 0 ? (
            <> loggato {' '}</>
          ) : (
            <> ha fatto il check-in</>
          )}
        </p>
        {event.pairs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {event.pairs.slice(0, 6).map((pair) => (
              <PairPill key={pair} pair={pair} />
            ))}
            {event.pairs.length > 6 && (
              <span className="text-text-muted text-xs self-center">
                +{event.pairs.length - 6} altri
              </span>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={`/profile/${event.userId}`}
      className="flex items-start gap-3 p-4 bg-surface-2 border border-white/5 rounded-2xl transition-all active:scale-[0.98] hover:border-white/10"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {event.avatarUrl ? (
          <Image
            src={event.avatarUrl}
            alt={event.userName}
            width={38}
            height={38}
            className="w-9.5 h-9.5 rounded-full object-cover border-2 border-white/10"
            unoptimized
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent/40 to-accent-dark/40 border border-accent/20 flex items-center justify-center flex-shrink-0">
            <span className="text-accent-light font-bold text-sm">
              {event.userName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {renderContent()}
        <p className="text-text-muted text-xs mt-1.5">{timeAgo(event.createdAt)}</p>
      </div>

      {/* Type icon */}
      <div className="flex-shrink-0 mt-0.5">
        {event.type === 'milestone' ? (
          <span className="text-base">🎯</span>
        ) : event.type === 'joined' ? (
          <span className="text-base">👋</span>
        ) : (
          <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2.5 2.5L8 2.5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </div>
    </Link>
  )
}

export default function ActivityFeed({ events }: { events: FeedEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="text-4xl mb-3">📡</div>
        <p className="text-text-secondary font-medium">Nessuna attività ancora</p>
        <p className="text-text-muted text-sm mt-1">Sii il primo a fare il check-in!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {events.map((event) => (
        <FeedCard key={event.id} event={event} />
      ))}
    </div>
  )
}
