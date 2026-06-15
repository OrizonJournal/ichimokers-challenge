import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email } = body
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email richiesta' }, { status: 400 })
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const redirectUri = `${baseUrl}/auth/circle`

  try {
    const res = await fetch(
      'https://app.circle.so/api/headless/v1/auth/request_magic_link',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${process.env.CIRCLE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          community_id: process.env.CIRCLE_COMMUNITY_ID,
          redirect_uri: redirectUri,
        }),
      }
    )

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const message =
        data?.error ??
        data?.message ??
        'Email non trovata nella community Circle'
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('request-magic-link error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
