import '../styles/styles.scss'
import type { AppProps } from 'next/app'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import { supabase, fetchUser, fetchUserRoles, updateUsername } from '../lib/Store'
import { UserRole } from '../lib/models'
import UserContext from '../lib/UserContext'
import { User, AuthSession } from '@supabase/supabase-js'
import type { User as DbUser } from '../lib/models'

type SignInUser = {
  id?: string
  email?: string
  displayName?: string
}

const SupabaseSlackClone = ({Component, pageProps}:AppProps) => {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState<User|null>(null)
  const [session, setSession] = useState<AuthSession|null>(null)
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [userRoles, setUserRoles] = useState<('admin'|'moderator')[]>([])

  const looksLikeEmail = (value?: string) => {
    if (!value) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  }

  const normalizeDisplayName = (value?: string) => {
    const trimmed = value?.trim()
    if (!trimmed) return null
    if (looksLikeEmail(trimmed)) return null
    return trimmed
  }

  const migrateUsernameIfNeeded = async(options: {
    userId: string
    authEmail?: string
    preferredDisplayName?: string
  }) => {
    const {userId, authEmail, preferredDisplayName} = options
    const dbUser = await fetchUser(userId)
    if (!dbUser) return null

    const current = dbUser.username
    const isEmailUsername = looksLikeEmail(current) || (!!authEmail && current === authEmail)
    if (!isEmailUsername) return dbUser

    const next = normalizeDisplayName(preferredDisplayName)
    if (!next) return dbUser

    await updateUsername(userId, next)
    return await fetchUser(userId)
  }
  const refreshProfile = async(
    userId?: string,
    authEmail?: string,
    preferredDisplayName?: string
  ) => {
    const id = userId ?? user?.id
    if (!id) return
    const dbUser = await migrateUsernameIfNeeded({
      userId: id,
      authEmail,
      preferredDisplayName
    })
    setProfile(dbUser ?? null)
  }

  const signIn = async({id, email, displayName}:SignInUser) => {
    await fetchUserRoles((userRoles:UserRole[]) => {
      setUserRoles(userRoles?.map(userRole => userRole.role))
    })
    await refreshProfile(id, email, displayName)
  }
  const signOut = async() => {
    const result = await supabase.auth.signOut()
    setProfile(null)
    Router.push('/')
  }
  useEffect(() => {
    const session = supabase.auth.session()
    setSession(session)
    const currentUser = session?.user ?? null
    setUser(currentUser)
    setUserLoaded(!!currentUser)
    if (currentUser) {
      void signIn({
        id: currentUser.id,
        email: currentUser.email,
        displayName: (currentUser as any)?.user_metadata?.display_name
      })
    }
    const {data:authListener} = supabase.auth.onAuthStateChange(async(event, session) => {
      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      if (currentUser) {
        await signIn({
          id: currentUser.id,
          email: currentUser.email,
          displayName: (currentUser as any)?.user_metadata?.display_name
        })
      } else {
        setProfile(null)
      }
    })
    return () => {
      authListener?.unsubscribe()
    }
  }, [])
  return (
    <UserContext.Provider
      value={{
        userLoaded,
        user,
        profile,
        userRoles,
        signIn,
        signOut,
        refreshProfile
      }}>
      <Component {...pageProps}/>
    </UserContext.Provider>
  )
}

export default SupabaseSlackClone
