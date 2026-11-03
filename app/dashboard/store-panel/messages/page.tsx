'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SellerMessagesPage() {
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedChat, setSelectedChat] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [storeId, setStoreId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const initPage = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUser(session.user)

      const { data: storeData } = await supabase.from('stores').select('id').eq('owner_id', session.user.id).maybeSingle()
      if (!storeData) return
      setStoreId(storeData.id)

      // گرفتن پیام‌ها همراه با اطلاعات محصول
      const { data: msgsData } = await supabase
        .from('messages')
        .select('*, products(title, image_url)')
        .eq('store_id', storeData.id)
        .order('created_at', { ascending: true })

      if (msgsData && msgsData.length > 0) {
        const customerIds = new Set<string>()
        msgsData.forEach(msg => {
          if (msg.sender_id !== session.user.id) customerIds.add(msg.sender_id)
          if (msg.receiver_id !== session.user.id) customerIds.add(msg.receiver_id)
        })

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', Array.from(customerIds))

        const profilesMap: any = {}
        if (profilesData) {
          profilesData.forEach(p => { profilesMap[p.id] = p })
        }

        const convs: any = {}
        msgsData.forEach(msg => {
          const isSeller = msg.sender_id === session.user.id
          const customerId = isSeller ? msg.receiver_id : msg.sender_id
          const profile = profilesMap[customerId]
          
          if (!convs[customerId]) {
            convs[customerId] = {
              customerId,
              customerName: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'کاربر ناشناس',
              messages: [],
              lastMessageTime: msg.created_at
            }
          }
          convs[customerId].messages.push(msg)
          convs[customerId].lastMessageTime = msg.created_at
        })
        
        const sortedConvs = Object.values(convs).sort((a: any, b: any) => 
          new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
        )
        setConversations(sortedConvs)
      }
      setLoading(false)
    }
    initPage()
  }, [router])

  const handleSelectChat = (conv: any) => {
    setSelectedChat(conv)
    setMessages(conv.messages)
    
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedChat || !user || !storeId) return

    const msgContent = newMessage.trim()
    setNewMessage('')

    const { data, error } = await supabase.from('messages').insert([{
      sender_id: user.id,
      receiver_id: selectedChat.customerId,
      store_id: storeId,
      content: msgContent
    }]).select().single()

    if (!error && data) {
      const updatedMessages = [...messages, data]
      setMessages(updatedMessages)
      
      setConversations(prev => prev.map(c => 
        c.customerId === selectedChat.customerId 
          ? { ...c, messages: updatedMessages, lastMessageTime: data.created_at } 
          : c
      ))

      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">در حال بارگذاری پیام‌ها...</div>

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-[calc(100vh-8rem)] flex overflow-hidden">
      
      <div className="w-1/3 border-l border-gray-100 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="font-bold text-gray-800">پیام‌های دریافتی</h2>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">هیچ پیامی ندارید.</div>
          ) : (
            conversations.map((conv: any) => (
              <button 
                key={conv.customerId}
                onClick={() => handleSelectChat(conv)}
                className={`w-full text-right p-4 border-b border-gray-100 hover:bg-white transition-colors flex flex-col ${selectedChat?.customerId === conv.customerId ? 'bg-white border-r-4 border-r-indigo-600' : ''}`}
              >
                <span className="font-bold text-sm text-gray-800">{conv.customerName}</span>
                <span className="text-xs text-gray-500 truncate mt-1">{conv.messages[conv.messages.length - 1].content}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="w-2/3 flex flex-col bg-white">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                  {selectedChat.customerName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{selectedChat.customerName}</h3>
                  <span className="text-xs text-green-500">خریدار</span>
                </div>
              </div>
              
              <button 
                onClick={() => setSelectedChat(null)} 
                className="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 p-2 rounded-full transition-colors"
                title="بستن گفتگو"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-grow p-4 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((msg: any) => {
                const isMe = msg.sender_id === user.id
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-tl-none'}`}>
                      
                      {/* نمایش محصول مرتبط با پیام */}
                      {msg.products && (
                        <Link href={`/product/${msg.product_id}`} target="_blank" className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${isMe ? 'bg-indigo-500/50 hover:bg-indigo-500/70' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                          {msg.products.image_url && <img src={msg.products.image_url} className="w-8 h-8 rounded-md object-cover" />}
                          <span className="font-bold text-xs underline">{msg.products.title}</span>
                        </Link>
                      )}

                      {msg.content}
                      <div className={`text-[10px] mt-1 text-left ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="پیام خود را بنویسید..."
                  className="flex-grow bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 -scale-x-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  ارسال
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-grow flex flex-col items-center justify-center text-gray-400 bg-gray-50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p>برای مشاهده پیام‌ها، یک گفتگو را از سمت راست انتخاب کنید.</p>
          </div>
        )}
      </div>
    </div>
  )
}