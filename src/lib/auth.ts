import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { upsertUser } from './supabase'

export async function getCircleUser(userToken: string) {
  const res = await fetch('https://app.circle.so/api/headless/v1/auth/me', {
    headers: {
      Authorization: `Token ${userToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Circle API error ${res.status}: ${text}`)
  }
  return res.json()
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: 'circle-magic',
      name: 'Circle',
      credentials: {
        user_token: { type: 'text' },
      },
      async authorize(credentials) {
        const userToken = credentials?.user_token as string
        if (!userToken) return null

        try {
          const circleUser = await getCircleUser(userToken)

          const memberId = String(
            circleUser.community_member?.id ?? circleUser.id
          )
          const name =
            circleUser.community_member?.name ??
            circleUser.name ??
            'Member'
          const avatarUrl =
            circleUser.community_member?.avatar_url ??
            circleUser.avatar_url ??
            null
          const email = circleUser.email ?? null

          await upsertUser({
            circle_member_id: memberId,
            name,
            avatar_url: avatarUrl,
            email,
          })

          return { id: memberId, name, email, image: avatarUrl }
        } catch (err) {
          console.error('Circle auth error:', err)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: '/',
    error: '/',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.circleId = user.id
        token.name = user.name
        token.email = user.email
        token.picture = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.circleId as string
        session.user.name = token.name as string
        session.user.email = token.email as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
})
