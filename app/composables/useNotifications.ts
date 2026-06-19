// In-app notifications: a shared list, unread count, mark-as-read, and a
// realtime subscription that prepends new rows the moment they arrive.
export interface AppNotification {
  id: number
  user_id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

export const useNotifications = () => {
  const client = useSupabaseClient<any>()
  const items = useState<AppNotification[]>('notifications', () => [])
  const ready = useState<boolean>('notifications_ready', () => false)

  const unread = computed(() => items.value.filter((n) => !n.read).length)

  async function load() {
    const uid = currentUid()
    if (!uid) return
    const { data } = await client
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(40)
    items.value = (data as AppNotification[]) ?? []
    ready.value = true
  }

  async function markRead(n: AppNotification) {
    if (n.read) return
    n.read = true
    await client.from('notifications').update({ read: true }).eq('id', n.id)
  }

  async function markAllRead() {
    const ids = items.value.filter((n) => !n.read).map((n) => n.id)
    if (!ids.length) return
    items.value = items.value.map((n) => ({ ...n, read: true }))
    await client.from('notifications').update({ read: true }).in('id', ids)
  }

  // One realtime channel per session. onNew fires for each fresh row (used to
  // pop a toast).
  let channel: any = null
  function subscribe(onNew?: (n: AppNotification) => void) {
    const uid = currentUid()
    if (!uid || channel) return
    channel = client
      .channel(`notif:${uid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
        (payload: any) => {
          const n = payload.new as AppNotification
          if (items.value.some((x) => x.id === n.id)) return
          items.value = [n, ...items.value]
          onNew?.(n)
        }
      )
      .subscribe()
  }

  function unsubscribe() {
    if (channel) {
      client.removeChannel(channel)
      channel = null
    }
  }

  return { items, unread, ready, load, markRead, markAllRead, subscribe, unsubscribe }
}
