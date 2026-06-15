'use client'

import { useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function CircleAuthInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const attempted = useRef(false)

  useEffect(() => {
    const userToken = searchParams.get('user_token') ?? searchParams.get('token')
    if (!userToken || attempted.current) return
    attempted.current = true

    signIn('circle-magic', {
      user_token: userToken,
      redirect: false,
    }).then((result) => {
      if (result?.ok) {
        router.replace('/dashboard')
      } else {
        router.replace('/?error=auth')
      }
    })
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        <p className="text-text-secondary text-sm">Verifica in corso…</p>
      </div>
    </div>
  )
}

export default function CircleAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <CircleAuthInner />
    </Suspense>
  )
}
