// Lightweight transient toasts. push() adds one; it auto-dismisses after a few
// seconds. Rendered by <ToastHost> in the default layout.
export interface Toast {
  id: number
  title: string
  body?: string
  link?: string
}

export const useToast = () => {
  const toasts = useState<Toast[]>('toasts', () => [])
  const seq = useState<number>('toast_seq', () => 0)

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function push(t: Omit<Toast, 'id'>) {
    seq.value += 1
    const id = seq.value
    toasts.value = [...toasts.value, { id, ...t }]
    setTimeout(() => dismiss(id), 6000)
  }

  return { toasts, push, dismiss }
}
