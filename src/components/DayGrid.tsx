'use client'

import { useState, useCallback } from 'react'
import { getAllChallengeDays, groupDaysByMonth, type ChallengeDay, type MonthGroup } from '@/lib/challenge'
import { format } from 'date-fns'
import CheckInModal from './CheckInModal'

interface DayGridProps {
  initialCheckedDates: string[]
  // Map from dateString → pairs traded (used for dots)
  initialPairsMap?: Record<string, string[]>
  userId: string
}

function DayCellComponent({
  day,
  isChecked,
  hasPairs,
  onTap,
  isLoading,
}: {
  day: ChallengeDay
  isChecked: boolean
  hasPairs: boolean
  onTap: (dateString: string) => void
  isLoading: boolean
}) {
  const dayNum = format(day.date, 'd')

  const handleClick = () => {
    if (isLoading) return
    onTap(day.dateString)
  }

  let cellClass = ''
  let title = ''

  if (day.isFuture) {
    cellClass = isChecked ? 'day-cell-checked' : 'day-cell-future'
    title = format(day.date, 'MMM d')
  } else if (day.isToday) {
    cellClass = isChecked ? 'day-cell-today-checked' : 'day-cell-today'
    title = `Today - ${isChecked ? 'checked!' : 'tap to check in'}`
  } else if (day.isPast) {
    if (isChecked) {
      cellClass = 'day-cell-checked'
      title = `${format(day.date, 'MMM d')} - checked!`
    } else {
      cellClass = 'day-cell-missed'
      title = `${format(day.date, 'MMM d')} - missed`
    }
  }

  return (
    <button
      className={`relative ${cellClass} ${isLoading ? 'opacity-50' : ''} active:scale-90`}
      onClick={handleClick}
      title={title}
      aria-label={title}
    >
      {dayNum}
      {/* Pairs dot indicator */}
      {isChecked && hasPairs && (
        <span
          className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-light"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

function MonthSection({
  group,
  checkedDates,
  pairsMap,
  onTap,
  loadingDate,
}: {
  group: MonthGroup
  checkedDates: Set<string>
  pairsMap: Record<string, string[]>
  onTap: (dateString: string) => void
  loadingDate: string | null
}) {
  return (
    <div className="mb-6">
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-widest">
          {group.monthName}
        </h3>
        <span className="text-text-muted text-xs">
          {group.days.filter((d) => checkedDates.has(d.dateString)).length}/{group.days.length}
        </span>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="w-7 h-5 flex items-center justify-center text-text-muted text-xs">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <MonthDaysGrid
        group={group}
        checkedDates={checkedDates}
        pairsMap={pairsMap}
        onTap={onTap}
        loadingDate={loadingDate}
      />
    </div>
  )
}

function MonthDaysGrid({
  group,
  checkedDates,
  pairsMap,
  onTap,
  loadingDate,
}: {
  group: MonthGroup
  checkedDates: Set<string>
  pairsMap: Record<string, string[]>
  onTap: (dateString: string) => void
  loadingDate: string | null
}) {
  const firstDay = group.days[0].date
  const startDayOfWeek = firstDay.getDay()

  const cells: (ChallengeDay | null)[] = [
    ...Array(startDayOfWeek).fill(null),
    ...group.days,
  ]

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((day, index) => {
        if (!day) {
          return <div key={`empty-${index}`} className="w-7 h-7" />
        }
        const pairs = pairsMap[day.dateString] ?? []
        return (
          <DayCellComponent
            key={day.dateString}
            day={day}
            isChecked={checkedDates.has(day.dateString)}
            hasPairs={pairs.length > 0}
            onTap={onTap}
            isLoading={loadingDate === day.dateString}
          />
        )
      })}
    </div>
  )
}

export default function DayGrid({ initialCheckedDates, initialPairsMap = {}, userId }: DayGridProps) {
  const [checkedDates, setCheckedDates] = useState<Set<string>>(
    new Set(initialCheckedDates)
  )
  const [pairsMap, setPairsMap] = useState<Record<string, string[]>>(initialPairsMap)
  const [loadingDate, setLoadingDate] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Modal state
  const [modalDate, setModalDate] = useState<string | null>(null)

  const allDays = getAllChallengeDays()
  const monthGroups = groupDaysByMonth(allDays)

  // Called when user taps a day cell
  const handleTap = useCallback(
    (dateString: string) => {
      if (loadingDate) return

      // If already checked — toggle off immediately (no modal needed)
      if (checkedDates.has(dateString)) {
        void handleToggleOff(dateString)
        return
      }

      // Not checked yet — open modal to pick pairs
      setModalDate(dateString)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [checkedDates, loadingDate]
  )

  const handleToggleOff = async (dateString: string) => {
    if (loadingDate) return
    setLoadingDate(dateString)
    setError(null)

    setCheckedDates((prev) => {
      const next = new Set(prev)
      next.delete(dateString)
      return next
    })

    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateString }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update check-in')
      }

      const data = await response.json()
      setCheckedDates((prev) => {
        const next = new Set(prev)
        if (data.checked) {
          next.add(dateString)
        } else {
          next.delete(dateString)
          setPairsMap((prev) => {
            const next = { ...prev }
            delete next[dateString]
            return next
          })
        }
        return next
      })
    } catch (err) {
      // Revert
      setCheckedDates((prev) => {
        const next = new Set(prev)
        next.add(dateString)
        return next
      })
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setTimeout(() => setError(null), 3000)
    } finally {
      setLoadingDate(null)
    }
  }

  // Called when user confirms check-in from modal
  const handleModalConfirm = useCallback(
    async (dateString: string, pairs: string[]) => {
      setLoadingDate(dateString)
      setError(null)

      // Optimistic update
      setCheckedDates((prev) => {
        const next = new Set(prev)
        next.add(dateString)
        return next
      })
      setPairsMap((prev) => ({ ...prev, [dateString]: pairs }))

      try {
        const response = await fetch('/api/checkin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: dateString, activities: pairs }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to update check-in')
        }

        const data = await response.json()
        setCheckedDates((prev) => {
          const next = new Set(prev)
          if (data.checked) {
            next.add(dateString)
          } else {
            next.delete(dateString)
          }
          return next
        })
        if (data.activities) {
          setPairsMap((prev) => ({ ...prev, [dateString]: data.activities }))
        }
      } catch (err) {
        // Revert
        setCheckedDates((prev) => {
          const next = new Set(prev)
          next.delete(dateString)
          return next
        })
        setPairsMap((prev) => {
          const next = { ...prev }
          delete next[dateString]
          return next
        })
        setError(err instanceof Error ? err.message : 'Something went wrong')
        setTimeout(() => setError(null), 3000)
      } finally {
        setLoadingDate(null)
        setModalDate(null)
      }
    },
    []
  )

  const handleModalCancel = useCallback(() => {
    setModalDate(null)
  }, [])

  return (
    <div className="mt-2">
      {/* Error toast */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-danger/15 border border-danger/30 rounded-xl text-danger text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5 text-xs text-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-success" />
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-danger/20 border border-danger/30" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded border-2 border-accent" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="relative w-4 h-4 rounded bg-success flex items-center justify-center">
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-light" />
          </div>
          <span>+ attività</span>
        </div>
      </div>

      {/* Month groups */}
      {monthGroups.map((group) => (
        <MonthSection
          key={`${group.year}-${group.month}`}
          group={group}
          checkedDates={checkedDates}
          pairsMap={pairsMap}
          onTap={handleTap}
          loadingDate={loadingDate}
        />
      ))}

      {/* Check-in modal */}
      {modalDate && (
        <CheckInModal
          dateString={modalDate}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          isLoading={loadingDate === modalDate}
        />
      )}
    </div>
  )
}
