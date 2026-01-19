import { User } from '@supabase/supabase-js';
import { createContext } from 'react';

type State = {
  userLoaded: boolean
  user: User|null
  userRoles: ('admin'|'moderator')[]
  signIn: ({}) => Promise<void>
  signOut: () => Promise<void>
}

const initialState:State = {
  userLoaded: false,
  user: null,
  userRoles: [],
  signIn: async() => {},
  signOut: async() => {}
}

const UserContext = createContext(initialState)

export default UserContext