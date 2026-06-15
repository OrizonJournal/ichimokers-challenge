export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // No BottomNav here — profile uses its own back button
  return <>{children}</>
}
