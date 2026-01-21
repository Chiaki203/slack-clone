import { createClient } from '@supabase/supabase-js';
import {useState, useEffect, Dispatch, SetStateAction} from 'react'
import {User, UserRole, Channel, Message} from './models';


export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

type Props = {
  channelId: number
}

export const useStore = ({channelId}:Props) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [channelsLoaded, setChannelsLoaded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [users] = useState(new Map())
  const [newMessage, handleNewMessage] = useState<Message>()
  const [newChannel, handleNewChannel] = useState<Channel>()
  const [newOrUpdatedUser, handleNewOrUpdatedUser] = useState<User>()
  const [deletedChannel, handleDeletedChannel] = useState<Channel>()
  const [deletedMessage, handleDeletedMessage] = useState<Message>()
  useEffect(() => {
    fetchChannels(setChannels).finally(() => setChannelsLoaded(true))
    const userListener = supabase
      .from('users')
      .on('*', (payload) => {
        handleNewOrUpdatedUser(payload.new)
      })
      .subscribe()
    const channelListener = supabase
      .from('channels')
      .on('INSERT', (payload) => {
        handleNewChannel(payload.new)
      })
      .on('DELETE', (payload) => {
        handleDeletedChannel(payload.old)
      })
      .subscribe()
    const messageListener = supabase
      .from('messages')
      .on('INSERT', (payload) => {
        handleNewMessage(payload.new)
      })
      .on('DELETE', (payload) => {
        handleDeletedMessage(payload.old)
      })
      .subscribe()
    return () => {
      userListener.unsubscribe()
      channelListener.unsubscribe()
      messageListener.unsubscribe()
    }
  }, [])
  useEffect(() => {
    if (channelId > 0) {
      fetchMessages(channelId, (messages) => {
        messages.forEach(message => users.set(message.author.id, message.author))
        setMessages(messages)
      })
    }
  }, [channelId])
  useEffect(() => {
    if (newMessage && newMessage.channel_id === Number(channelId)) {
      const handleAsync = async() => {
        let authorId = newMessage.user_id
        if (!users.get(authorId)) {
          return await fetchUser(authorId, (user) => {
            handleNewOrUpdatedUser(user)
          })
        }
      }
      setMessages(messages.concat(newMessage))
      handleAsync()
    }
  }, [newMessage])
  useEffect(() => {
    if (deletedMessage) {
      setMessages(messages.filter(message => message.id !== deletedMessage.id))
    }
  }, [deletedMessage])
  useEffect(() => {
    if (newChannel) {
      setChannels((prev) => prev.concat(newChannel))
    }
  }, [newChannel])
  useEffect(() => {
    if (deletedChannel?.id) {
      setChannels((prev) => prev.filter((channel) => channel.id !== deletedChannel.id))
    }
  }, [deletedChannel])
  useEffect(() => {
    if (newOrUpdatedUser) {
      users.set(newOrUpdatedUser.id, newOrUpdatedUser)
    }
  }, [newOrUpdatedUser])
  
  return {
    messages: messages.map(message => {
      return {
        ...message,
        author: users.get(message.user_id)
      }
    }),
    channels: channels !== null ? (
      channels.sort((a, b) => a.slug.localeCompare(b.slug))
    ) : [],
    channelsLoaded,
    refreshChannels: async() => fetchChannels(setChannels),
    users
  }
}

export const fetchUser = async(userId:string, setState?:(user:User)=>void) => {
  try {
    let {body} = await supabase
      .from<User>('users')
      .select('*')
      .eq('id', userId)
    let user = body?.[0]
    if (setState && user) {
      setState(user)
    }
    return user
  } catch(error) {
  }
}

export const fetchChannels = async(setState?:Dispatch<SetStateAction<Channel[]>>) => {
  try {
    let data = await supabase
      .from('channels')
      .select('*')
    if (setState && data.body) {
      setState(data.body)
    }
  } catch(error) {
  }
}

export const fetchMessages = async(channelId:number, setState?:(messages:Message[])=>void) => {
  try {
    let {body} = await supabase
      .from('messages')
      .select('*, author:users(*)')
      .match({channel_id: channelId})
      .order('inserted_at', {ascending: true})
    if (setState && body) {
      setState(body)
    }
    return body
  } catch(error) {
  }
}


export const fetchUserRoles = async(setState?:(userRoles:UserRole[]) => void) => {
  try {
    let {body} = await supabase
      .from('user_roles')
      .select('*')
    if (setState && body) {
      setState(body)
    }
    return body
  } catch(error) {
  }
}

export const addChannel = async(slug:string, user_id:string) => {
  try {
    let {body} = await supabase
      .from('channels')
      .insert([{slug, created_by: user_id}])
    return body
  } catch(error) {
  }
}

export const deleteChannel = async(channel_id:number) => {
  try {
    const {data, error} = await supabase
      .from('channels')
      .delete()
      .match({id: channel_id})
    if (error) throw error
    return data
  } catch(error) {
    throw error
  }
}

export const addMessage = async(message:string, channel_id:number, user_id:string) => {
  try {
    let {body} = await supabase
      .from('messages')
      .insert([{message, channel_id, user_id}])
    return body
  } catch(error) {
  } 
}

export const deleteMessage = async(message_id:number) => {
  try {
    let {body} = await supabase
      .from('messages')
      .delete()
      .match({id: message_id})
    return body
  } catch(error) {
  }
}

export const updateUsername = async(user_id: string, username: string) => {
  try {
    const trimmed = username.trim()
    if (!trimmed) return null
    let {body} = await supabase
      .from('users')
      .update({username: trimmed})
      .match({id: user_id})
    return body
  } catch (error) {
  }
}
