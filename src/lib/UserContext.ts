import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createContext } from 'react';
import type { User as DbUser } from './models';

type State = {
  userLoaded: boolean
  user: SupabaseUser | null
  profile: DbUser | null
  userRoles: ('admin'|'moderator')[]
  signIn: ({}) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const initialState:State = {
  userLoaded: false,
  user: null,
  profile: null,
  userRoles: [],
  signIn: async() => {},
  signOut: async() => {},
  refreshProfile: async() => {}
}

const UserContext = createContext(initialState)

export default UserContext
