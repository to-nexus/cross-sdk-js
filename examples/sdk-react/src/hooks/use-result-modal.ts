import { useCallback, useState } from 'react'

export const useResultModal = () => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean
    title: string
    content: string
    type: 'success' | 'error' | 'info'
  }>({
    isOpen: false,
    title: '',
    content: '',
    type: 'info'
  })

  const showSuccess = useCallback((title: string, content: string) => {
    setModalState({
      isOpen: true,
      title,
      content,
      type: 'success'
    })
  }, [])

  const showError = useCallback((title: string, content: string) => {
    setModalState({
      isOpen: true,
      title,
      content,
      type: 'error'
    })
  }, [])

  const showInfo = useCallback((title: string, content: string) => {
    setModalState({
      isOpen: true,
      title,
      content,
      type: 'info'
    })
  }, [])

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }, [])

  return {
    ...modalState,
    showSuccess,
    showError,
    showInfo,
    closeModal
  }
}
