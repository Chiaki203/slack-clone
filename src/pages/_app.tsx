// import '../styles/globals.css'
// import type { AppProps } from 'next/app'

// function MyApp({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />
// }

// export default MyApp


import '../styles/styles.scss'
import type { AppProps } from 'next/app'
import Router from 'next/router'
import { useEffect, useState } from 'react'
import { supabase, fetchUserRoles } from '../lib/Store'
import { UserRole } from '../lib/models'
import UserContext from '../lib/UserContext'
import { User, AuthSession } from '@supabase/supabase-js'

type SignInUser = {
  id?: string
  email?: string
}

const SupabaseSlackClone = ({Component, pageProps}:AppProps) => {
  const [userLoaded, setUserLoaded] = useState(false)
  const [user, setUser] = useState<User|null>(null)
  const [session, setSession] = useState<AuthSession|null>(null)
  const [userRoles, setUserRoles] = useState<('admin'|'moderator')[]>([])
  // console.log('userRoles', userRoles)
  const signIn = async({id, email}:SignInUser) => {
    await fetchUserRoles((userRoles:UserRole[]) => {
      setUserRoles(userRoles?.map(userRole => userRole.role))
    })
    console.log('await fetchUserRoles しました！')
  }
  const signOut = async() => {
    const result = await supabase.auth.signOut()
    Router.push('/')
  }
  useEffect(() => {
    const session = supabase.auth.session()
    console.log('supabase.auth.session()', session)
    setSession(session)
    setUser(session?.user ?? null)
    console.log('session user', session?.user)
    setUserLoaded(session ? true : false)
    console.log('user loaded?', userLoaded)
    if (user) {
      signIn({})
      // Router.push('/channels/[id]', '/channels/1')
    }
    const {data:authListener} = supabase.auth.onAuthStateChange(async(event, session) => {
      console.log('onAuthStateChange event', event)
      console.log('onAuthStateChange session', session)
      setSession(session)
      const currentUser = session?.user
      setUser(currentUser ?? null)
      setUserLoaded(!!currentUser)
      console.log('!!currentUser', !!currentUser)
      if (currentUser) {
        signIn({
          id: currentUser.id,
          email: currentUser.email
        })
        // Router.push('/channels/[id]', '/channels/1')
      }
    })
    return () => {
      authListener?.unsubscribe()
    }
  }, [user])
  return (
    <UserContext.Provider
      value={{
        userLoaded,
        user,
        userRoles,
        signIn,
        signOut
      }}>
      <Component {...pageProps}/>
    </UserContext.Provider>
  )
}

export default SupabaseSlackClone