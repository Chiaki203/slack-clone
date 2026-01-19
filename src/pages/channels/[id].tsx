import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useContext, useEffect, useRef } from 'react';
import Message from '../../components/Message';
import MessageInput from '../../components/MessageInput';
import { addMessage, useStore } from '../../lib/Store';
import UserContext from '../../lib/UserContext';


const ChannelPage = () => {
  const router = useRouter()
  console.log('channelPage router', router)
  const {user} = useContext(UserContext)
  const messagesEndRef = useRef<HTMLHRElement>(null)
  // console.log('messagesEndRef', messagesEndRef)
  const {id} = router.query
  const channelId = Number(id)
  // console.log('router.query', router.query)
  const {messages, channels} = useStore({channelId})
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: 'start',
      behavior: 'smooth'
    })
  })
  useEffect(() => {
    if (!channels.some(channel => channel.id === channelId)) {
      router.push('/channels/1')
    }
  }, [channels, channelId])
  return (
    <Layout channels={channels} activeChannelId={channelId}>
      <div className='relative h-screen'>
        <div className='Messages h-full pb-16'>
          {/* <div>{user?.id}</div> */}
          <div className='p-2 overflow-y-auto'>
            {messages.map(message => (
              <Message key={message.id} message={message}/>
            ))}
            <hr ref={messagesEndRef}/>
          </div>
        </div>
        <div className='p-2 absolute bottom-0 left-0 w-full'>
          <MessageInput
            onSubmit={async(text) => addMessage(text, channelId, user!.id)}
          />
        </div>
      </div>
    </Layout>
  )
}

export default ChannelPage