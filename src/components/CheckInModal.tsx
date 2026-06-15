'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

const ACTIVITIES = [
  { id: 'watchlist',      label: 'Watchlist',        emoji: '👁️' },
  { id: 'backtest',       label: 'Backtest',          emoji: '📊' },
  { id: 'journaling',     label: 'Journaling',        emoji: '📝' },
  { id: 'me-vs-strategia',label: 'Me vs Strategia',  emoji: '⚔️' },
  { id: 'recap',          label: 'Recap giornaliero', emoji: '🔁' },
]

interface CheckInModalProps {
  dateString: string
  initialActivities?: string[]
  onConfirm: (dateString: string, activities: string[]) => void
  onCancel: () => void
  isLoading: boolean
}

export default function CheckInModal({
  dateString,
  initialActivities = [],
  onConfirm,
  onCancel,
  isLoading,
}: CheckInModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialActivities))

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(dateString, Array.from(selected))
  }

  const formattedDate = format(parseISO(dateString), 'EEEE, d MMM')

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-app z-50 animate-slide-up"
        role="dialog"
        aria-modal="true"
      >
        <div className="bg-surface rounded-t-3xl border border-white/10 border-b-0 shadow-card px-5 pt-5 pb-10">
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

          <div className="mb-6">
            <h2 className="text-text-primary font-bold text-lg">Log del giorno</h2>
            <p className="text-text-muted text-sm mt-0.5">{formattedDate}</p>
          </div>

          <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-4">
            Cosa hai fatto oggi?
          </p>

          <div className="flex flex-col gap-3 mb-7">
            {ACTIVITIES.map(({ id, label, emoji }) => {
              const active = selected.has(id)
              return (
                <button
                  key={id}
                  onClick={() => toggle(id)}
                  className={`
                    flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl border
                    transition-all duration-150 active:scale-[0.98] text-left
                    ${active
                      ? 'bg-accent/15 border-accent/50 text-text-primary'
                      : 'bg-surface-2 border-white/5 text-text-secondary'
                    }
                  `}
                >
                  <span className="text-xl w-7 text-center">{emoji}</span>
                  <span className="flex-1 font-semibold text-sm">{label}</span>
                  <span className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all
                    ${active ? 'bg-accent border-accent' : 'border-white/20'}
                  `}>
                    {active && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Counter */}
          <p className="text-text-muted text-xs text-center mb-4">
            {selected.size} / {ACTIVITIES.length} attività completate
            {selected.size === ACTIVITIES.length && ' 🔥'}
          </p>

          <div className="flex gap-3">
            <button onClick={onCancel} className="btn-secondary flex-1" disabled={isLoading}>
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
                  </svg>
                  Salvataggio…
                </>
              ) : (
                'Salva check-in'
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
