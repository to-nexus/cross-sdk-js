import { useCallback, useState, useRef } from 'react'

type ModalData = {
  title: string
  content: string
  type: 'success' | 'error' | 'info'
}

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

  // 모달 큐 관리
  const modalQueueRef = useRef<ModalData[]>([])
  const isModalOpenRef = useRef(false)

  // 다음 모달을 큐에서 꺼내서 표시
  const showNextModal = useCallback(() => {
    if (modalQueueRef.current.length > 0) {
      const nextModal = modalQueueRef.current.shift()
      if (nextModal) {
        setModalState({
          isOpen: true,
          ...nextModal
        })
        isModalOpenRef.current = true
      }
    } else {
      isModalOpenRef.current = false
    }
  }, [])

  // 모달을 표시하는 내부 함수
  const showModal = useCallback(
    (title: string, content: string, type: 'success' | 'error' | 'info') => {
      const modalData: ModalData = { title, content, type }

      // 이미 모달이 열려있으면 큐에 추가
      if (isModalOpenRef.current) {
        modalQueueRef.current.push(modalData)
      } else {
        // 모달이 닫혀있으면 바로 표시
        setModalState({
          isOpen: true,
          title,
          content,
          type
        })
        isModalOpenRef.current = true
      }
    },
    []
  )

  const showSuccess = useCallback(
    (title: string, content: string) => {
      showModal(title, content, 'success')
    },
    [showModal]
  )

  const showError = useCallback(
    (title: string, content: string) => {
      showModal(title, content, 'error')
    },
    [showModal]
  )

  const showInfo = useCallback(
    (title: string, content: string) => {
      showModal(title, content, 'info')
    },
    [showModal]
  )

  const closeModal = useCallback(() => {
    setModalState(prev => ({ ...prev, isOpen: false }))

    // 모달 닫기 애니메이션 후 다음 모달 표시
    setTimeout(() => {
      showNextModal()
    }, 300) // 300ms 지연 (모달 닫히는 애니메이션 시간)
  }, [showNextModal])

  return {
    ...modalState,
    showSuccess,
    showError,
    showInfo,
    closeModal
  }
}
