import { useContext } from 'react';
import UserContext from '../lib/UserContext';
import TrashIcon from './TrashIcon';
import { deleteMessage } from '../lib/Store';
import type { Message } from '../lib/models';

type MessageProps = {
  message: Message
}

const Message = ({message}:MessageProps) => {
  const {user, userRoles} = useContext(UserContext)
  // console.log('message page props', message)
  return (
    <div className='py-1 flex items-center space-x-4'>
      <div className='text-gray-100 w-4'>
        {(user?.id === message.author?.id ||
          userRoles.some(role => ['admin', 'moderator'].includes(role))) && (
            <button onClick={() => deleteMessage(message.id)}>
              <TrashIcon/>
            </button>
          )}
      </div>
      <div>
        <p className='text-blue-700 font-bold'> 
          {message.author?.username}
        </p>
        <p className='text-white'>
          {message.message}
        </p>
      </div>
    </div>
  )
}

export default Message