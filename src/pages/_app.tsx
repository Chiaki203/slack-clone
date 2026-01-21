import '../styles/styles.scss'
import type { AppProps } from 'next/app'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import { supabase, fetchUser, fetchUserRoles } from '../lib/Store'
import { UserRole } from '../lib/models'
import UserContext from '../lib/UserContext'
import { User, AuthSession } from '@supabase/supabase-js'
import type { User as DbUser } from '../lib/models'

type SignInUser = {
  id?: string
  email?: string
}

const SupabaseSlackClone = ({Component, pageProps}:AppProps) => {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState<User|null>(null)
  const [session, setSession] = useState<AuthSession|null>(null)
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [userRoles, setUserRoles] = useState<('admin'|'moderator')[]>([])
  const refreshProfile = async(userId?: string) => {
    const id = userId ?? user?.id
    if (!id) return
    const dbUser = await fetchUser(id)
    setProfile(dbUser ?? null)
  }

  const signIn = async({id}:SignInUser) => {
    await fetchUserRoles((userRoles:UserRole[]) => {
      setUserRoles(userRoles?.map(userRole => userRole.role))
    })
    await refreshProfile(id)
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
        email: currentUser.email
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
          email: currentUser.email
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
