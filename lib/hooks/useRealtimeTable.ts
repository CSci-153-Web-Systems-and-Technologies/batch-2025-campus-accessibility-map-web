import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeTable(
  table: string,
  filter: string | null,
  handlers: {
    onInsert?: (payload: any) => void
    onUpdate?: (payload: any) => void
    onDelete?: (payload: any) => void
  }
) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    const supabase = createClient()
    const channelName = `${table}_changes_${Math.random().toString(36).slice(2, 8)}`

    const channel = supabase.channel(channelName)

    const makeFilter = () => {
      return filter ? { event: '*', schema: 'public', table, filter } : { event: '*', schema: 'public', table }
    }

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: filter || undefined }, (payload) => {
        try { handlersRef.current.onInsert?.(payload) } catch (e) {}
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: filter || undefined }, (payload) => {
        try { handlersRef.current.onUpdate?.(payload) } catch (e) {}
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table, filter: filter || undefined }, (payload) => {
        try { handlersRef.current.onDelete?.(payload) } catch (e) {}
      })
      .subscribe()

    return () => {
      try { supabase.removeChannel(channel) } catch (e) {}
    }
  }, [table, filter])
}
