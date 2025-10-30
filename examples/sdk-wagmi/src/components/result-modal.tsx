import React from 'react'
import { createPortal } from 'react-dom'

interface ResultModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  content: string
  type?: 'success' | 'error' | 'info'
}

export const ResultModal: React.FC<ResultModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  type = 'info'
}) => {
  if (!isOpen) return null

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return {
          bg: '#fff',
          border: '#fff',
          icon: '#fff'
        }
      case 'error':
        return {
          bg: '#fff',
          border: '#fff',
          icon: '#fff'
        }
      case 'info':
      default:
        return {
          bg: '#fff',
          border: '#fff',
          icon: '#fff'
        }
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'info':
      default:
        return 'ℹ️'
    }
  }

  const colors = getTypeColors()

  const backdropStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'fadeIn 0.2s ease-out'
  }

  const modalStyle: React.CSSProperties = {
    position: 'relative',
    backgroundColor: colors.bg,
    borderRadius: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    maxWidth: '28rem',
    width: '100%',
    margin: '0 1rem',
    border: `2px solid ${colors.border}`,
    animation: 'slideIn 0.3s ease-out'
  }

  const contentStyle: React.CSSProperties = {
    padding: '1.5rem'
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem'
  }

  const iconStyle: React.CSSProperties = {
    marginRight: '0.75rem',
    fontSize: '1.5rem',
    color: colors.icon
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '1.125rem',
    fontWeight: 600,
    margin: 0,
    color: '#1f2937'
  }

  const bodyStyle: React.CSSProperties = {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all', // 모든 문자에서 줄바꿈
    fontSize: '0.875rem',
    backgroundColor: '#f3f4f6',
    color: '#1f2937',
    padding: '0.75rem',
    borderRadius: '4px',
    overflow: 'auto',
    overflowX: 'hidden', // 가로 스크롤 차단
    maxHeight: '16rem',
    maxWidth: '100%', // ✅ 부모 너비 제한
    fontFamily: 'Courier New, monospace',
    lineHeight: 1.4
  }

  const footerStyle: React.CSSProperties = {
    marginTop: '1.5rem',
    display: 'flex',
    justifyContent: 'flex-end'
  }

  const buttonStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'background-color 0.2s ease'
  }

  return createPortal(
    <div style={backdropStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={contentStyle}>
          <div style={headerStyle}>
            <div style={iconStyle}>{getIcon()}</div>
            <h3 style={titleStyle}>{title}</h3>
          </div>

          <div style={bodyStyle}>{content}</div>

          <div style={footerStyle}>
            <button
              onClick={onClose}
              style={buttonStyle}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
