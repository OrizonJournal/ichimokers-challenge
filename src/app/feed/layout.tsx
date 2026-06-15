import BottomNav from '@/components/BottomNav'

export default function FeedLayout({
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
