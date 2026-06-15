'use client'

import { useState } from 'react'

const PRESET_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'XAU/USD',
]

interface ProfileEditFormProps {
  userId: string
  initialBio: string
  initialTradingPairs: string[]
  initialTradingStyle: 'pro-trend' | 'counter-trend' | null
  initialName: string
}

export default function ProfileEditForm({
  userId,
  initialBio,
  initialTradingPairs,
  initialTradingStyle,
  initialName,
}: ProfileEditFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio)
  const [tradingPairs, setTradingPairs] = useState<string[]>(initialTradingPairs)
  const [tradingStyle, setTradingStyle] = useState<'pro-trend' | 'counter-trend' | null>(initialTradingStyle)
  const [customPair, setCustomPair] = useState('')

  // Saved state (what's actually persisted)
  const [savedName, setSavedName] = useState(initialName)
  const [savedBio, setSavedBio] = useState(initialBio)
  const [savedPairs, setSavedPairs] = useState<string[]>(initialTradingPairs)
  const [savedStyle, setSavedStyle] = useState<'pro-trend' | 'counter-trend' | null>(initialTradingStyle)

  const togglePair = (pair: string) => {
    setTradingPairs((prev) =>
      prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]
    )
  }

  const addCustomPair = () => {
    const trimmed = customPair.trim().toUpperCase()
    if (!trimmed || tradingPairs.includes(trimmed)) return
    setTradingPairs((prev) => [...prev, trimmed])
    setCustomPair('')
  }

  const handleCancel = () => {
    setName(savedName)
    setBio(savedBio)
    setTradingPairs(savedPairs)
    setTradingStyle(savedStyle)
    setCustomPair('')
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || savedName,
          bio: bio.trim() || null,
          trading_pairs: tradingPairs,
          trading_style: tradingStyle,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      // Commit saved state
      setSavedName(name.trim() || savedName)
      setSavedBio(bio.trim())
      setSavedPairs(tradingPairs)
      setSavedStyle(tradingStyle)

      setIsEditing(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isEditing) {
    return (
      <div className="space-y-4">
        {success && (
          <div className="px-4 py-3 bg-success/15 border border-success/30 rounded-xl text-success text-sm animate-fade-in">
            Profile saved!
          </div>
        )}

        {/* Read view with Edit button */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest">
              Profile Info
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-accent-light text-xs font-medium hover:text-accent transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" />
              </svg>
              Edit
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-text-muted text-xs mb-1">Name</p>
              <p className="text-text-primary text-sm font-medium">{savedName}</p>
            </div>

            <div>
              <p className="text-text-muted text-xs mb-1">Bio</p>
              {savedBio ? (
                <p className="text-text-secondary text-sm leading-relaxed">{savedBio}</p>
              ) : (
                <p className="text-text-muted text-sm italic">No bio yet</p>
              )}
            </div>

            <div>
              <p className="text-text-muted text-xs mb-2">Trading style</p>
              {savedStyle ? (
                <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-1 border ${
                  savedStyle === 'pro-trend'
                    ? 'bg-accent/15 text-accent-light border-accent/25'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/25'
                }`}>
                  {savedStyle === 'pro-trend' ? '📈 Pro-Trend' : '📉 Counter-Trend'}
                </span>
              ) : (
                <p className="text-text-muted text-sm italic">Not set</p>
              )}
            </div>

            <div>
              <p className="text-text-muted text-xs mb-2">Favourite pairs</p>
              {savedPairs.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {savedPairs.map((pair) => (
                    <span
                      key={pair}
                      className="inline-flex items-center bg-accent/15 text-accent-light border border-accent/25 rounded-full px-2.5 py-1 text-xs font-medium"
                    >
                      {pair}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm italic">No pairs selected</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Edit mode
  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-danger/15 border border-danger/30 rounded-xl text-danger text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="card">
        <label className="text-text-secondary text-xs font-semibold uppercase tracking-widest block mb-2">
          Name
        </label>
        <input
          type="text"
          className="input-field text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={60}
        />
      </div>

      {/* Bio */}
      <div className="card">
        <label className="text-text-secondary text-xs font-semibold uppercase tracking-widest block mb-2">
          Bio
        </label>
        <textarea
          className="input-field text-sm resize-none"
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell the community about yourself…"
          maxLength={280}
        />
        <p className="text-text-muted text-xs mt-1.5 text-right">{bio.length}/280</p>
      </div>

      {/* Trading style */}
      <div className="card">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-3">
          Trading style
        </p>
        <div className="flex gap-3">
          {(['pro-trend', 'counter-trend'] as const).map((style) => {
            const active = tradingStyle === style
            return (
              <button
                key={style}
                onClick={() => setTradingStyle(active ? null : style)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                  active
                    ? style === 'pro-trend'
                      ? 'bg-accent/20 text-accent-light border-accent/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-surface-3 text-text-secondary border-white/10'
                }`}
              >
                {style === 'pro-trend' ? '📈 Pro-Trend' : '📉 Counter-Trend'}
              </button>
            )
          })}
        </div>
      </div>

      {/* Favourite pairs */}
      <div className="card">
        <p className="text-text-secondary text-xs font-semibold uppercase tracking-widest mb-3">
          Favourite pairs
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_PAIRS.map((pair) => {
            const active = tradingPairs.includes(pair)
            return (
              <button
                key={pair}
                onClick={() => togglePair(pair)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                  active
                    ? 'bg-accent text-white border-accent'
                    : 'bg-surface-3 text-text-secondary border-white/10 hover:border-accent/40'
                }`}
              >
                {pair}
              </button>
            )
          })}
        </div>

        {/* Custom pair */}
        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1 text-sm"
            placeholder="Custom pair (e.g. BTC/USD)"
            value={customPair}
            onChange={(e) => setCustomPair(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomPair()}
            maxLength={12}
          />
          <button
            onClick={addCustomPair}
            disabled={!customPair.trim()}
            className="btn-secondary px-4 py-2.5 text-sm disabled:opacity-40"
          >
            Add
          </button>
        </div>

        {/* Custom pairs (those not in preset) */}
        {tradingPairs.filter((p) => !PRESET_PAIRS.includes(p)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tradingPairs
              .filter((p) => !PRESET_PAIRS.includes(p))
              .map((pair) => (
                <span
                  key={pair}
                  className="inline-flex items-center gap-1 bg-accent/20 text-accent-light border border-accent/30 rounded-full px-2.5 py-1 text-xs font-medium"
                >
                  {pair}
                  <button
                    onClick={() => togglePair(pair)}
                    className="text-accent-light/70 hover:text-accent-light ml-0.5"
                    aria-label={`Remove ${pair}`}
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3">
        <button onClick={handleCancel} className="btn-secondary flex-1" disabled={isSaving}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeDashoffset="10" />
              </svg>
              Saving…
            </>
          ) : (
            'Save profile'
          )}
        </button>
      </div>
    </div>
  )
}
