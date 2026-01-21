import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { useContext, useEffect, useRef } from 'react';
import Message from '../../components/Message';
import MessageInput from '../../components/MessageInput';
import { addMessage, useStore } from '../../lib/Store';
import UserContext from '../../lib/UserContext';


const ChannelPage = () => {
  const router = useRouter()
  const {user} = useContext(UserContext)
  const messagesEndRef = useRef<HTMLHRElement>(null)
  const {id} = router.query
  const channelId = typeof id === 'string' ? Number(id) : Number.NaN
  const {messages, channels, channelsLoaded, refreshChannels} = useStore({
    channelId: Number.isFinite(channelId) ? channelId : 0
  })
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      block: 'start',
      behavior: 'smooth'
    })
  })
  useEffect(() => {
    if (!router.isReady) return
    if (!channelsLoaded) return
    if (!Number.isFinite(channelId) || channelId <= 0) {
      router.replace('/channels/1')
      return
    }
    if (channels.length > 0 && !channels.some(channel => channel.id === channelId)) {
      router.replace('/channels/1')
    }
  }, [router.isReady, channelsLoaded, channels, channelId])
  return (
    <Layout channels={channels} activeChannelId={channelId} refreshChannels={refreshChannels}>
      <div className='relative h-screen'>
        <div className='Messages h-full pb-16'>
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
