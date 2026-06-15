import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getActivityFeed } from '@/lib/supabase'
import ActivityFeed from '@/components/ActivityFeed'

// Revalidate every 60 seconds (ISR)
export const revalidate = 60

export default async function FeedPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/')
  }

  const events = await getActivityFeed(40).catch(() => [])

  return (
    <div className="page-content animate-fade-in">
      {/* Header */}
      <div className="pt-2 mb-6">
        <h1 className="text-text-primary font-black text-xl tracking-tight">
          Community Feed
        </h1>
        <p className="text-text-muted text-xs mt-0.5">
          Attività recente degli Ichimokers
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-5">
        <div className="flex items-center gap-1.5 bg-success/10 border border-success/20 rounded-xl px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <span className="text-success text-xs font-medium">Live</span>
        </div>
        <span className="text-text-muted text-xs">
          {events.length} attività recenti
        </span>
      </div>

      <ActivityFeed events={events} />
    </div>
  )
}
