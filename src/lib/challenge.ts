import {
  format,
  eachDayOfInterval,
  isBefore,
  isAfter,
  isSameDay,
  parseISO,
  startOfDay,
} from 'date-fns'

export const CHALLENGE_START = new Date(2026, 7, 19)  // August 19, 2026
export const CHALLENGE_END = new Date(2026, 9, 13)   // October 13, 2026
export const TOTAL_DAYS = 56
export const POINTS_PER_ACTIVITY = 1

export interface ChallengeDay {
  date: Date
  dateString: string // YYYY-MM-DD
  dayNumber: number  // 1-indexed
  month: number
  monthName: string
  isPast: boolean
  isToday: boolean
  isFuture: boolean
}

export interface MonthGroup {
  monthName: string
  month: number
  year: number
  days: ChallengeDay[]
}

export function formatDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function parseDateString(dateStr: string): Date {
  return parseISO(dateStr)
}

export function getDayNumber(date: Date): number {
  const start = startOfDay(CHALLENGE_START)
  const target = startOfDay(date)
  const diff = target.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1
}

export function getAllChallengeDays(): ChallengeDay[] {
  const today = startOfDay(new Date())
  const days = eachDayOfInterval({ start: CHALLENGE_START, end: CHALLENGE_END })

  return days.map((date, index) => {
    const d = startOfDay(date)
    return {
      date: d,
      dateString: formatDateString(d),
      dayNumber: index + 1,
      month: d.getMonth(),
      monthName: format(d, 'MMMM'),
      isPast: isBefore(d, today),
      isToday: isSameDay(d, today),
      isFuture: isAfter(d, today),
    }
  })
}

export function groupDaysByMonth(days: ChallengeDay[]): MonthGroup[] {
  const groups: Map<string, MonthGroup> = new Map()

  for (const day of days) {
    const key = `${day.date.getFullYear()}-${day.month}`
    if (!groups.has(key)) {
      groups.set(key, {
        monthName: day.monthName,
        month: day.month,
        year: day.date.getFullYear(),
        days: [],
      })
    }
    groups.get(key)!.days.push(day)
  }

  return Array.from(groups.values())
}

export function calculatePoints(totalActivities: number, bonusPoints: number): number {
  return totalActivities * POINTS_PER_ACTIVITY + bonusPoints
}

export function calculateProgress(checkInCount: number): number {
  return Math.min((checkInCount / TOTAL_DAYS) * 100, 100)
}

export function getStreakCount(checkedDates: Set<string>): number {
  const today = startOfDay(new Date())
  let streak = 0
  let current = new Date(today)

  while (true) {
    if (!isInChallenge(current)) break
    const dateStr = formatDateString(current)
    if (!checkedDates.has(dateStr)) break
    streak++
    current = new Date(current.getTime() - 24 * 60 * 60 * 1000)
  }

  return streak
}

export function getTodayDateString(): string {
  return formatDateString(startOfDay(new Date()))
}

export function isInChallenge(date: Date): boolean {
  const d = startOfDay(date)
  return !isBefore(d, startOfDay(CHALLENGE_START)) && !isAfter(d, startOfDay(CHALLENGE_END))
}

export function isChallengeActive(): boolean {
  const today = startOfDay(new Date())
  return !isBefore(today, startOfDay(CHALLENGE_START)) && !isAfter(today, startOfDay(CHALLENGE_END))
}

export function getDaysElapsed(): number {
  const today = startOfDay(new Date())
  if (isBefore(today, startOfDay(CHALLENGE_START))) return 0
  if (isAfter(today, startOfDay(CHALLENGE_END))) return TOTAL_DAYS
  return getDayNumber(today)
}
