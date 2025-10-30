import { useEffect, useRef } from 'react'

interface Network {
  chainId: number
  name: string
  icon?: string
}

interface NetworkSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectNetwork: (chainId: number) => void
  networks: Network[]
  currentChainId?: number
}

export function NetworkSelectorModal({
  isOpen,
  onClose,
  onSelectNetwork,
  networks,
  currentChainId
}: NetworkSelectorModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
            네트워크 선택
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {networks.map(network => {
            const isCurrentNetwork = currentChainId === network.chainId
            return (
              <button
                key={network.chainId}
                onClick={() => {
                  onSelectNetwork(network.chainId)
                  onClose()
                }}
                disabled={isCurrentNetwork}
                style={{
                  padding: '16px',
                  border: isCurrentNetwork ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: isCurrentNetwork ? '#e7f3ff' : 'white',
                  cursor: isCurrentNetwork ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  opacity: isCurrentNetwork ? 0.7 : 1
                }}
                onMouseEnter={e => {
                  if (!isCurrentNetwork) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                    e.currentTarget.style.borderColor = '#007bff'
                  }
                }}
                onMouseLeave={e => {
                  if (!isCurrentNetwork) {
                    e.currentTarget.style.backgroundColor = 'white'
                    e.currentTarget.style.borderColor = '#ddd'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {network.icon && (
                    <img
                      src={network.icon}
                      alt={network.name}
                      style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                      {network.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Chain ID: {network.chainId}
                    </div>
                  </div>
                </div>
                {isCurrentNetwork && (
                  <span
                    style={{
                      color: '#007bff',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    ✓ 현재 네트워크
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
