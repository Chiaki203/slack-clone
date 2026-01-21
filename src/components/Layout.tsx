import Link from 'next/link';
import { useContext, ReactNode } from 'react';
import UserContext from '../lib/UserContext';
import TrashIcon from './TrashIcon';
import { Channel } from '../lib/models';
import { addChannel, deleteChannel, updateUsername } from '../lib/Store';
import { User } from '@supabase/supabase-js';

type LayoutProps = {
  channels: Channel[]
  activeChannelId: number
  refreshChannels?: () => Promise<void>
  children: ReactNode
}

type SidebarItemProps = {
  channel: Channel
  isActiveChannel: boolean
  user: User|null
  userRoles: ('admin'|'moderator')[]
  refreshChannels?: () => Promise<void>
}


const Layout = (props:LayoutProps) => {
  const {signOut, user, userRoles, profile, refreshProfile} = useContext(UserContext)
  const slugify = (text:string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w-]+/g, '') // Remove all non-word chars
      .replace(/--+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, '') // Trim - from end of text
  }
  const newChannel = async() => {
    const slug = prompt('Please enter the channel title')
    if (slug) {
      addChannel(slugify(slug), user!.id)
    }
  }

  const editUsername = async() => {
    if (!user) return
    const current = profile?.username ?? user.email ?? ''
    const next = prompt('Enter a new username', current)
    if (next === null) return
    if (!next.trim() || next.trim() === current) return
    await updateUsername(user.id, next)
    await refreshProfile()
  }
  return (
    <main className='main flex h-screen w-screen overflow-hidden'>
      <nav 
        className='w-64 bg-gray-900 text-gray-100 overflow-scroll'
        style={{maxWidth: '20%', minWidth: 150, maxHeight: '100vh'}}
        >
        <div className='p-2'>
          <button
            className='bg-blue-900 hover:bg-blue-800 text-white py-2 px-4 rounded w-full transition duration-150'
            onClick={newChannel}>
            New Channel
          </button>
        </div>
        <hr className='m-2'/>
        <div className='p-2 flex flex-col space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='min-w-0 mr-2'>
              <div className='text-sm font-bold text-gray-300 truncate'>
                {profile?.username ?? 'Anonymous'}
              </div>
              {/* <div className='text-xs text-gray-400 truncate'>{user?.email}</div> */}
            </div>
            <button
              className='text-xs underline opacity-80 hover:opacity-100'
              onClick={editUsername}
              type="button"
            >
              Edit username
            </button>
          </div>
          <button
            className='bg-blue-900 hover:bg-gray-800 text-white py-2 px-4 rounded w-full transition duration-150'
            onClick={signOut}>
            Log out
          </button>
        </div>
        <hr className='m-2'/>
        <h4 className='font-bold'>Channels</h4>
        <ul className='channel-list'>
          {props.channels.map(channel => (
            <SidebarItem
              key={channel.id}
              channel={channel}
              isActiveChannel={channel.id === props.activeChannelId}
              user={user}
              userRoles={userRoles}
              refreshChannels={props.refreshChannels}
            />
          ))}
        </ul>
      </nav>
      <div className='flex-1 bg-gray-800 h-screen'>{props.children}</div>
    </main>
  )
}

const SidebarItem = ({channel, isActiveChannel, user, userRoles, refreshChannels}:SidebarItemProps) => {
  return (
    <>
      <li className='flex items-center justify-between'>
        <Link
          href="/channels/[id]"
          as={`/channels/${channel.id}`}
          >
          <a className={isActiveChannel ? 'font-bold' : ''}>
            {channel.slug}
          </a>
        </Link>
        {channel.id !== 1 && (channel.created_by === user?.id || userRoles.includes('admin')) && (
          <button
            type="button"
            onClick={async() => {
              const ok = confirm(`Delete #${channel.slug}?`)
              if (!ok) return
              try {
                await deleteChannel(channel.id)
                await refreshChannels?.()
              } catch (error:any) {
                alert(error?.message ?? String(error))
              }
            }}>
            <TrashIcon/>
          </button>
        )}
      </li>
    </>
  )
}

export default Layout
