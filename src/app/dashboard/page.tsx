import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserByCircleId, getUserCheckIns } from '@/lib/supabase'
import { calculatePoints, getStreakCount, getTodayDateString, getDaysElapsed, TOTAL_DAYS } from '@/lib/challenge'
import ProfileHeader from '@/components/ProfileHeader'
import DayGrid from '@/components/DayGrid'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  // Fetch user from Supabase
  const dbUser = await getUserByCircleId(session.user.id).catch(() => null)

  if (!dbUser) {
    redirect('/')
  }

  const checkInRows = await getUserCheckIns(dbUser.id).catch(() => [] as Awaited<ReturnType<typeof getUserCheckIns>>)
  const checkInDates = checkInRows.map((r) => r.checked_date)
  const checkedDatesSet = new Set(checkInDates)

  // Build activities map: dateString → activities[]
  const pairsMap: Record<string, string[]> = {}
  let totalActivities = 0
  for (const row of checkInRows) {
    if (row.activities && row.activities.length > 0) {
      pairsMap[row.checked_date] = row.activities
    }
    totalActivities += row.activities?.length ?? 0
  }

  // Calculate stats
  const daysChecked = checkInDates.length
  const totalPoints = calculatePoints(totalActivities, dbUser.bonus_points)
  const streakCount = getStreakCount(checkedDatesSet)
  const daysElapsed = getDaysElapsed()
  const today = getTodayDateString()
  const todayChecked = checkedDatesSet.has(today)

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <div>
          <h1 className="text-text-primary font-black text-xl tracking-tight">
            My Progress
          </h1>
          <p className="text-text-muted text-xs mt-0.5">
            Day {Math.min(daysElapsed, TOTAL_DAYS)} of {TOTAL_DAYS}
          </p>
        </div>
        {/* Today's check-in status pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
            todayChecked
              ? 'bg-success/15 text-success border-success/30'
              : daysElapsed > 0
              ? 'bg-danger/15 text-danger border-danger/30'
              : 'bg-surface-3 text-text-muted border-white/10'
          }`}
        >
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              todayChecked ? 'bg-success' : daysElapsed > 0 ? 'bg-danger' : 'bg-text-muted'
            }`}
          />
          {todayChecked ? 'Checked in!' : daysElapsed > 0 ? 'Not yet today' : 'Not started'}
        </div>
      </div>

      {/* Profile + Stats + Progress */}
      <ProfileHeader
        name={session.user.name ?? dbUser.name}
        avatarUrl={session.user.image ?? dbUser.avatar_url}
        daysChecked={daysChecked}
        totalPoints={totalPoints}
        streakCount={streakCount}
        userId={dbUser.id}
      />

      {/* Day Grid section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-text-primary font-bold text-base">
            Daily Grid
          </h2>
          <span className="text-text-muted text-xs">Ago – Ott 2026</span>
        </div>
        <p className="text-text-muted text-xs mb-4">
          Tocca un giorno passato o oggi per registrare le attività
        </p>

        <DayGrid
          initialCheckedDates={checkInDates}
          initialPairsMap={pairsMap}
          userId={dbUser.id}
        />
      </div>
    </div>
  )
}
