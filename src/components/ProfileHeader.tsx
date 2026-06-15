'use client'

import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { calculateProgress, TOTAL_DAYS } from '@/lib/challenge'

interface ProfileHeaderProps {
  name: string
  avatarUrl?: string | null
  daysChecked: number
  totalPoints: number
  streakCount?: number
  userId?: string  // Supabase UUID for profile link
}

export default function ProfileHeader({
  name,
  avatarUrl,
  daysChecked,
  totalPoints,
  streakCount = 0,
  userId,
}: ProfileHeaderProps) {
  const [showMenu, setShowMenu] = useState(false)
  const progress = calculateProgress(daysChecked)
  const firstName = name.split(' ')[0]

  return (
    <div className="relative">
      {/* Profile row */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          {/* Avatar — tapping goes to own profile */}
          {userId ? (
            <Link
              href={`/profile/${userId}`}
              className="relative active:scale-95 transition-transform block"
              aria-label="View your profile"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="avatar w-12 h-12"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center border-2 border-accent/30">
                  <span className="text-white font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
            </Link>
          ) : (
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="relative active:scale-95 transition-transform"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={48}
                  height={48}
                  className="avatar w-12 h-12"
                  unoptimized
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center border-2 border-accent/30">
                  <span className="text-white font-bold text-lg">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-background" />
            </button>
          )}

          <div>
            <p className="text-text-muted text-xs">Welcome back</p>
            <h2 className="text-text-primary font-bold text-base leading-tight">{firstName}</h2>
          </div>
        </div>

        {/* Points badge + menu trigger */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-1.5 bg-accent/15 border border-accent/30 rounded-xl px-3 py-2 active:scale-95 transition-transform"
        >
          <span className="text-accent-light text-sm">⚡</span>
          <span className="text-accent-light font-bold text-sm">{totalPoints}</span>
          <span className="text-text-muted text-xs">pts</span>
        </button>
      </div>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute top-14 right-0 z-50 bg-surface-2 border border-white/10 rounded-xl shadow-card overflow-hidden w-44 animate-fade-in">
            {userId && (
              <Link
                href={`/profile/${userId}`}
                onClick={() => setShowMenu(false)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="8" cy="5" r="3" />
                  <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
                </svg>
                My profile
              </Link>
            )}
            <button
              onClick={() => {
                setShowMenu(false)
                signOut({ callbackUrl: '/' })
              }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-text-secondary hover:bg-surface-3 hover:text-text-primary transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center py-3">
          <div className="text-xl font-black text-text-primary">{daysChecked}</div>
          <div className="text-text-muted text-xs mt-0.5">Days done</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-success">{streakCount}</div>
          <div className="text-text-muted text-xs mt-0.5">Streak 🔥</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-text-primary">
            {TOTAL_DAYS - daysChecked}
          </div>
          <div className="text-text-muted text-xs mt-0.5">Remaining</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-text-secondary text-xs font-medium">Challenge progress</span>
          <span className="text-accent-light text-xs font-bold">{progress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-text-muted text-xs">19 Ago</span>
          <span className="text-text-muted text-xs">{daysChecked} / {TOTAL_DAYS} giorni</span>
          <span className="text-text-muted text-xs">13 Ott</span>
        </div>
      </div>
    </div>
  )
}
