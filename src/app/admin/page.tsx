'use client'

import { useState, useEffect, useCallback } from 'react'

interface UserStats {
  id: string
  circle_member_id: string
  name: string
  avatar_url: string | null
  email: string | null
  days_checked: number
  bonus_points: number
  total_points: number
  created_at: string
}

type SortField = 'total_points' | 'days_checked' | 'name' | 'bonus_points'
type SortDir = 'asc' | 'desc'

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [users, setUsers] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [bonusInputs, setBonusInputs] = useState<Record<string, string>>({})
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')

  const [sortField, setSortField] = useState<SortField>('total_points')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchUsers = useCallback(
    async (pwd: string) => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/admin/users', {
          headers: { 'x-admin-password': pwd },
        })
        if (res.status === 401) {
          setAuthed(false)
          setAuthError('Invalid password')
          return
        }
        if (!res.ok) throw new Error('Failed to fetch users')
        const data = await res.json()
        setUsers(data.users)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching users')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'x-admin-password': password },
      })
      if (res.status === 401) {
        setAuthError('Wrong password')
        return
      }
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setUsers(data.users)
      setAuthed(true)
    } catch {
      setAuthError('Something went wrong')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleBonusUpdate = async (userId: string, action: 'add' | 'subtract') => {
    const rawVal = bonusInputs[userId]
    const amount = parseInt(rawVal || '0', 10)
    if (isNaN(amount) || amount <= 0) return

    setUpdatingUser(userId)
    setSuccessMsg('')
    setError('')

    try {
      const res = await fetch('/api/admin/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          userId,
          amount: action === 'subtract' ? -amount : amount,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update points')
      }

      const data = await res.json()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                bonus_points: data.bonus_points,
                total_points: data.total_points,
              }
            : u
        )
      )
      setBonusInputs((prev) => ({ ...prev, [userId]: '' }))
      setSuccessMsg(`Updated ${users.find((u) => u.id === userId)?.name}'s points`)
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating points')
    } finally {
      setUpdatingUser(null)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  const handleExportCSV = () => {
    const headers = ['Name', 'Email', 'Circle ID', 'Days Checked', 'Bonus Points', 'Total Points', 'Joined']
    const rows = users.map((u) => [
      u.name,
      u.email ?? '',
      u.circle_member_id,
      u.days_checked,
      u.bonus_points,
      u.total_points,
      new Date(u.created_at).toLocaleDateString(),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((r) => r.map((v) => `"${v}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ichimokers-challenge-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Sort and filter
  const sortedUsers = [...users]
    .filter((u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let va: number | string = a[sortField]
      let vb: number | string = b[sortField]
      if (sortField === 'name') {
        va = a.name.toLowerCase()
        vb = b.name.toLowerCase()
        return sortDir === 'asc'
          ? (va as string).localeCompare(vb as string)
          : (vb as string).localeCompare(va as string)
      }
      return sortDir === 'asc'
        ? (va as number) - (vb as number)
        : (vb as number) - (va as number)
    })

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🔐</div>
            <h1 className="text-text-primary font-black text-2xl">Admin Panel</h1>
            <p className="text-text-muted text-sm mt-1">Ichimokers Challenge</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              autoFocus
            />

            {authError && (
              <p className="text-danger text-sm text-center">{authError}</p>
            )}

            <button
              type="submit"
              disabled={authLoading || !password}
              className="btn-primary w-full"
            >
              {authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                'Enter'
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-6 max-w-app mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-text-primary font-black text-xl">Admin Panel</h1>
          <p className="text-text-muted text-xs mt-0.5">{users.length} challengers</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers(password)}
            className="btn-secondary px-3 py-2 text-sm"
            disabled={loading}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />
            ) : (
              '↻'
            )}
          </button>
          <button onClick={handleExportCSV} className="btn-secondary px-3 py-2 text-sm">
            Export CSV
          </button>
        </div>
      </div>

      {/* Success / error toasts */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-success/15 border border-success/30 rounded-xl text-success text-sm animate-fade-in">
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 px-4 py-3 bg-danger/15 border border-danger/30 rounded-xl text-danger text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card text-center py-3">
          <div className="text-xl font-black text-text-primary">{users.length}</div>
          <div className="text-text-muted text-xs">Members</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-success">
            {users.reduce((sum, u) => sum + u.days_checked, 0)}
          </div>
          <div className="text-text-muted text-xs">Total check-ins</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-xl font-black text-accent-light">
            {users.reduce((sum, u) => sum + u.total_points, 0)}
          </div>
          <div className="text-text-muted text-xs">Total pts</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="search"
        placeholder="Search by name or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="input-field mb-4"
      />

      {/* Sort controls */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(['total_points', 'days_checked', 'bonus_points', 'name'] as SortField[]).map((field) => (
          <button
            key={field}
            onClick={() => handleSort(field)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              sortField === field
                ? 'bg-accent/20 text-accent-light border-accent/40'
                : 'bg-surface-3 text-text-muted border-white/10'
            }`}
          >
            {field === 'total_points' ? 'Points' :
             field === 'days_checked' ? 'Days' :
             field === 'bonus_points' ? 'Bonus' : 'Name'}
            {sortField === field && (
              <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
            )}
          </button>
        ))}
      </div>

      {/* User list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card h-24 skeleton" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedUsers.map((user, index) => (
            <div key={user.id} className="card">
              <div className="flex items-start gap-3">
                {/* Rank */}
                <div className="w-6 flex-shrink-0 text-center">
                  <span className="text-text-muted text-xs font-bold">
                    #{sortedUsers.findIndex(u => u.id === user.id) + 1}
                  </span>
                </div>

                {/* Avatar */}
                {user.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center border border-white/10 flex-shrink-0">
                    <span className="text-text-secondary font-bold">
                      {user.name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* User info */}
                <div className="flex-1 min-w-0">
                  <p className="text-text-primary font-semibold text-sm truncate">{user.name}</p>
                  {user.email && (
                    <p className="text-text-muted text-xs truncate">{user.email}</p>
                  )}
                  <div className="flex gap-3 mt-1">
                    <span className="text-success text-xs font-medium">{user.days_checked} days</span>
                    <span className="text-accent-light text-xs font-medium">{user.total_points} pts</span>
                    {user.bonus_points > 0 && (
                      <span className="text-text-muted text-xs">+{user.bonus_points} bonus</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bonus points input */}
              <div className="mt-3 flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  placeholder="Points..."
                  value={bonusInputs[user.id] ?? ''}
                  onChange={(e) =>
                    setBonusInputs((prev) => ({ ...prev, [user.id]: e.target.value }))
                  }
                  className="input-field py-2 text-sm flex-1"
                />
                <button
                  onClick={() => handleBonusUpdate(user.id, 'add')}
                  disabled={updatingUser === user.id || !bonusInputs[user.id]}
                  className="px-3 py-2 bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {updatingUser === user.id ? '...' : '+Add'}
                </button>
                <button
                  onClick={() => handleBonusUpdate(user.id, 'subtract')}
                  disabled={updatingUser === user.id || !bonusInputs[user.id]}
                  className="px-3 py-2 bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex-shrink-0"
                >
                  {updatingUser === user.id ? '...' : '−Sub'}
                </button>
              </div>
            </div>
          ))}

          {sortedUsers.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-text-secondary">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
