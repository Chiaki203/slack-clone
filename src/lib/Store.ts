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
  const [messages, setMessages] = useState<Message[]>([])
  const [users] = useState(new Map())
  const [newMessage, handleNewMessage] = useState<Message>()
  const [newChannel, handleNewChannel] = useState<Channel>()
  const [newOrUpdatedUser, handleNewOrUpdatedUser] = useState<User>()
  const [deletedChannel, handleDeletedChannel] = useState<Channel>()
  const [deletedMessage, handleDeletedMessage] = useState<Message>()
  useEffect(() => {
    fetchChannels(setChannels)
    const userListener = supabase
      .from('users')
      .on('*', (payload) => {
        console.log('user action payload', payload)
        console.log('user action payload new or update', payload.new)
        handleNewOrUpdatedUser(payload.new)
      })
      .subscribe()
    const channelListener = supabase
      .from('channels')
      .on('INSERT', (payload) => {
        console.log('channels insert payload', payload)
        console.log('channels insert payload new', payload.new)
        handleNewChannel(payload.new)
      })
      .on('DELETE', (payload) => {
        console.log('channel delete payload', payload)
        console.log('channel delete payload.old', payload.old)
        handleDeletedChannel(payload.old)
      })
      .subscribe()
    const messageListener = supabase
      .from('messages')
      .on('INSERT', (payload) => {
        console.log('message insert payload', payload)
        console.log('message insert payload.new', payload.new)
        handleNewMessage(payload.new)
      })
      .on('DELETE', (payload) => {
        console.log('message delete payload', payload)
        console.log('message delete payload old', payload)
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
        console.log('fetch messages users map set', users)
        setMessages(messages)
      })
    }
  }, [channelId])
  useEffect(() => {
    if (newMessage && newMessage.channel_id === Number(channelId)) {
      const handleAsync = async() => {
        let authorId = newMessage.user_id
        console.log('new message, authorId', newMessage, authorId)
        if (!users.get(authorId)) {
          return await fetchUser(authorId, (user) => {
            console.log('new message author ')
            handleNewOrUpdatedUser(user)
          })
        }
      }
      setMessages(messages.concat(newMessage))
      console.log('realtime message added', messages)
      handleAsync()
    }
  }, [newMessage])
  useEffect(() => {
    if (deletedMessage) {
      setMessages(messages.filter(message => message.id !== deletedMessage.id))
      console.log('realTime message deleted', messages, deletedMessage)
    }
  }, [deletedMessage])
  useEffect(() => {
    if (newChannel) {
      setChannels(channels.concat(newChannel))
      console.log('realTime channel added', newChannel)
    }
  }, [newChannel])
  useEffect(() => {
    if (newOrUpdatedUser) {
      users.set(newOrUpdatedUser.id, newOrUpdatedUser)
      console.log('realTime users set', users)
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
    users
  }
}

export const fetchUser = async(userId:string, setState?:(user:User)=>void) => {
  try {
    let {body} = await supabase
      .from<User>('users')
      .select('*')
      .eq('id', userId)
    console.log('fetch user body', body)
    let user = body?.[0]
    console.log('fetch user body[0]', user)
    if (setState && user) {
      setState(user)
    }
    return user
  } catch(error) {
    console.log('fetch user error', error)
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
    console.log('PostgrestResponse channels select data', data)
    console.log('fetchChannels body', data.body)
  } catch(error) {
    console.log('fetchChannels error', error)
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
    console.log('fetch messages body', body)
    return body
  } catch(error) {
    console.log('fetch message error', error)
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
    console.log('fetchUserRoles body', body)
    return body
  } catch(error) {
    console.log('fetchUserRoles error', error)
  }
}

export const addChannel = async(slug:string, user_id:string) => {
  try {
    let {body} = await supabase
      .from('channels')
      .insert([{slug, created_by: user_id}])
    console.log('addChannel body', body)
    return body
  } catch(error) {
    console.log('addChannel error', error)
  }
}

export const deleteChannel = async(channel_id:number) => {
  try {
    let {body} = await supabase
      .from('channels')
      .delete()
      .match({id: channel_id})
    console.log('deleteChannel body', body)
    return body
  } catch(error) {
    console.log('deleteChannel error', error)
  }
}

export const addMessage = async(message:string, channel_id:number, user_id:string) => {
  try {
    let {body} = await supabase
      .from('messages')
      .insert([{message, channel_id, user_id}])
    console.log('add message body', body)
    return body
  } catch(error) {
    console.log('add message error', error)
  } 
}

export const deleteMessage = async(message_id:number) => {
  try {
    let {body} = await supabase
      .from('messages')
      .delete()
      .match({id: message_id})
    console.log('deleteMessage body', body)
    return body
  } catch(error) {
    console.log('deleteMessage error', error)
  }
}