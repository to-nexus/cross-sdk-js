import { css } from 'lit'

export default css`
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }

  .mini-container {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--wui-spacing-xs);
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .mini-container:active {
    opacity: 0.8;
  }

  .platform-indicator {
    position: absolute;
    bottom: var(--wui-spacing-s);
    left: 50%;
    transform: translateX(-50%);
    padding: var(--wui-spacing-xs) var(--wui-spacing-s);
    background: var(--wui-color-gray-glass-005);
    border-radius: var(--wui-border-radius-xs);
    white-space: nowrap;
  }

  /* QR 코드 크기 조정 */
  cross-w3m-connecting-wc-qrcode {
    width: 290px !important;
    height: 290px !important;
    max-width: 290px !important;
    max-height: 290px !important;
    min-width: 290px !important;
    min-height: 290px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
    overflow: visible !important;
  }

  cross-w3m-connecting-wc-qrcode * {
    box-sizing: border-box !important;
  }

  cross-w3m-connecting-wc-qrcode wui-flex {
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    gap: 0 !important;
  }

  cross-w3m-connecting-wc-qrcode wui-shimmer {
    width: 280px !important;
    height: 280px !important;
    max-width: 280px !important;
    max-height: 280px !important;
    border-radius: var(--wui-border-radius-l) !important;
  }

  cross-w3m-connecting-wc-qrcode wui-qr-code {
    width: 280px !important;
    height: 280px !important;
    max-width: 280px !important;
    max-height: 280px !important;
  }

  cross-w3m-connecting-wc-qrcode wui-text {
    display: none !important;
  }

  cross-w3m-connecting-wc-qrcode wui-link {
    display: none !important;
  }

  cross-w3m-connecting-wc-qrcode cross-w3m-mobile-download-links {
    display: none !important;
  }

  /* Mobile 연결 뷰 크기 조정 */
  cross-w3m-connecting-wc-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  cross-w3m-connecting-wc-mobile wui-wallet-image {
    width: 60px !important;
    height: 60px !important;
  }

  cross-w3m-connecting-wc-mobile wui-text {
    font-size: 12px !important;
  }

  /* Browser 연결 뷰 크기 조정 */
  cross-w3m-connecting-wc-browser {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`
