import BottomNav from '@/components/BottomNav'

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  )
}
