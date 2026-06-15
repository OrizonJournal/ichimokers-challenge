'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'

function LoginInner() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('Link non valido o scaduto. Riprova.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore nell\'invio')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Qualcosa è andato storto')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-12">
      {/* Background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(73,177,155,0.2), transparent)',
        }}
      />

      <div />

      <div className="flex flex-col items-center gap-8 w-full max-w-xs animate-fade-in relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-glow">
              <span className="text-4xl">🔥</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-success rounded-full flex items-center justify-center border-2 border-background">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l2.5 2.5L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-text-primary text-glow">
              ICHIMOKERS
            </h1>
            <p className="text-accent-light font-semibold text-sm tracking-widest uppercase mt-1">
              56-Day Challenge
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 w-full">
          <div className="flex-1 card text-center">
            <div className="text-2xl font-black text-accent">56</div>
            <div className="text-text-muted text-xs mt-0.5">Giorni</div>
          </div>
          <div className="flex-1 card text-center">
            <div className="text-2xl font-black text-success">+5</div>
            <div className="text-text-muted text-xs mt-0.5">Punti/giorno</div>
          </div>
          <div className="flex-1 card text-center">
            <div className="text-2xl font-black text-text-primary">🏆</div>
            <div className="text-text-muted text-xs mt-0.5">Classifica</div>
          </div>
        </div>

        {/* Description */}
        <div className="text-center space-y-1">
          <p className="text-text-secondary text-sm leading-relaxed">
            Dal <span className="text-text-primary font-medium">19 Agosto</span> al{' '}
            <span className="text-text-primary font-medium">13 Ott 2026</span>
          </p>
          <p className="text-text-muted text-xs">
            1 punto per attività • max 5/giorno
          </p>
        </div>

        {/* Form / Sent state */}
        {sent ? (
          <div className="w-full card text-center py-6 space-y-3">
            <div className="text-3xl">📬</div>
            <p className="text-text-primary font-bold text-base">Controlla la tua email!</p>
            <p className="text-text-secondary text-sm leading-relaxed">
              Abbiamo inviato un link di accesso a<br />
              <span className="text-accent-light font-medium">{email}</span>
            </p>
            <button
              onClick={() => { setSent(false); setEmail('') }}
              className="text-text-muted text-xs underline mt-2"
            >
              Usa un'altra email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="La tua email Circle"
                required
                className="w-full bg-surface-2 border border-white/10 rounded-2xl px-4 py-4 text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            {error && (
              <p className="text-danger text-xs text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Invio in corso…</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M2 4h14v10a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" stroke="white" strokeWidth="1.5"/>
                    <path d="M2 4l7 6 7-6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span>Accedi con email Circle</span>
                </>
              )}
            </button>

            <p className="text-text-muted text-xs text-center">
              Usa l&apos;email del tuo account{' '}
              <a
                href="https://ichimokers.circle.so"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-light hover:underline"
              >
                Ichimokers Circle
              </a>
            </p>
          </form>
        )}
      </div>

      <p className="text-text-muted text-xs relative z-10">
        © 2026 Ichimokers Community
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  )
}
