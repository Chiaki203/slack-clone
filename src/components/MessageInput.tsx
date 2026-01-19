import {useState, KeyboardEvent} from 'react'

type MessageInputProps = {
  onSubmit: (text:string) => Promise<any[]|null|undefined>
}

const MessageInput = ({onSubmit}:MessageInputProps) => {
  const [messageText, setMessageText] = useState('')
  const submitOnEnter = (e:KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Enter') {
      onSubmit(messageText)
      setMessageText('')
      console.log('messageText deleted', messageText)
    }
  }
  return (
    <>
      <input
        type="text"
        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
        placeholder="Send a message"
        value={messageText}
        onChange={e => setMessageText(e.target.value)}
        onKeyDown={e => submitOnEnter(e)}
      />
    </>
  )
}

export default MessageInput