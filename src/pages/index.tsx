import { supabase } from '../lib/Store';
import { useState } from 'react';
import { useRouter } from 'next/router';
const Home = () => {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const handleLogin = async(type:'LOGIN'|'SIGNUP', email:string, password:string) => {
    try {
      if (type === 'SIGNUP' && !displayName.trim()) {
        alert('Please enter a display name')
        return false
      }
      const {error, user} = 
        type === 'LOGIN'
          ? await supabase.auth.signIn({email, password})
          : await supabase.auth.signUp(
              {email, password},
              {data: {display_name: displayName.trim()}}
            )
      if (error) {
        alert(`Error with auth: ${error.message}`)
        return false
      }
      return !!user
    } catch(error:any) {
      alert(error)
      return false
    }
  }
  return (
    <div className='w-full h-full flex justify-center items-center p-4 bg-gray-300'>
      <div className='w-full sm:w-1/2 xl:w-1/3'>
        <div className='border-teal-500 p-8 border-t-18 bg-white mb-6 rounded-lg shadow-lg' >
          <div className='mb-4'>
            <label className='font-bold text-gray-800 block mb-2'>Display name</label>
            <input
              type="text"
              className='block appearance-none w-full bg-white border border-gray-200 hover:border-gray-400 p-2 rounded shadow'
              placeholder="Your name (shown to others)"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
            />
          </div>
          <div className='mb-4'>
            <label className='font-bold text-gray-800 block mb-2'>Email</label>
            <input
              type="text"
              className='block appearance-none w-full bg-white border border-gray-200 hover:border-gray-400 p-2 rounded shadow'
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className='mb-4'>
            <label className='font-bold text-gray-800 block mb-2'>Password</label>
            <input
              type="password"
              className='block appearance-none w-full bg-white border border-gray-200 hover:border-gray-400 p-2 rounded shadow'
              placeholder="Your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className='flex flex-col gap-2'>
            <a
              className='bg-indigo-700 text-white py-2 px-4 rounded text-center transition duration-150 hover:bg-indigo-600'
              href={'/'}
              onClick={e => {
                e.preventDefault()
                void handleLogin('SIGNUP', email, password)
              }}>
              Sign up
            </a>
            <a
              className='border border-indigo-700 text-indigo-700 py-2 px-4 rounded text-center transition duration-150 hover:bg-indigo-700 hover:text-white'
              onClick={async(e) => {
                e.preventDefault()
                const ok = await handleLogin('LOGIN', email, password)
                if (ok) router.push('/channels/[id]', '/channels/1')
              }}>
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
