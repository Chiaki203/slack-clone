import Link from 'next/link';
import { useContext, ReactNode } from 'react';
import UserContext from '../lib/UserContext';
import TrashIcon from './TrashIcon';
import { Channel } from '../lib/models';
import { addChannel, deleteChannel } from '../lib/Store';
import { User } from '@supabase/supabase-js';

type LayoutProps = {
  channels: Channel[]
  activeChannelId: number
  children: ReactNode
}

type SidebarItemProps = {
  channel: Channel
  isActiveChannel: boolean
  user: User|null
  userRoles: ('admin'|'moderator')[]
}


const Layout = (props:LayoutProps) => {
  const {signOut, user, userRoles} = useContext(UserContext)
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
      console.log('slugify slug', slugify(slug))
      addChannel(slugify(slug), user!.id)
    }
  }
  return (
    <main className='main flex h-screen w-screen overflow-hidden'>
      <nav 
        className='w-64 bg-gray-900 text-gray-100 overflow-scroll'
        // className='w-64 bg-gray-900 text-gray-100 overflow-scroll flex-none'
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
          <h6 className='text-xs'>{user?.email}</h6>
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
            />
          ))}
        </ul>
      </nav>
      <div className='flex-1 bg-gray-800 h-screen'>{props.children}</div>
    </main>
  )
}

const SidebarItem = ({channel, isActiveChannel, user, userRoles}:SidebarItemProps) => (
  <>
    <li className='flex items-center justify-between'>
      <Link
        // href={`/channels/${channel.id}`}
        href="/channels/[id]"
        as={`/channels/${channel.id}`}
        >
        <a className={isActiveChannel ? 'font-bold' : ''}>
          {channel.slug}
        </a>
      </Link>
      {channel.id !== 1 && (channel.created_by === user?.id || userRoles.includes('admin')) && (
        <button onClick={() => deleteChannel(channel.id)}>
          <TrashIcon/>
        </button>
      )}
    </li>
  </>
)

export default Layout