import { css } from 'lit'

export default css`
  :host {
    display: block;
    width: 100%;
    min-width: 700px;
  }

  /* 전역 CSS 변수 오버라이드 - 더 강력한 방법 */
  :host {
    --w3m-modal-width: 700px !important;
  }

  /* 직접적인 wui-card 타겟팅 */
  cross-wui-card {
    max-width: 700px !important;
    width: 700px !important;
    height: 360px !important;
    max-height: 360px !important;
    margin: 0 !important;
  }

  .landscape-container {
    display: flex;
    flex-direction: row;
    width: 100%;
    min-width: 700px;
    height: 100%;
    max-height: 100%;
    background: var(--wui-color-modal-bg);
    position: relative;
    box-sizing: border-box;
  }

  .landscape-left {
    flex: 0 0 300px;
    width: 300px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    background: var(--wui-color-modal-bg);
    overflow: visible;
    position: relative;
  }

  .landscape-right {
    flex: 1;
    min-width: 300px;
    height: 100%;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--wui-color-gray-glass-005);
    background: var(--wui-color-modal-bg);
  }

  .landscape-tabs {
    flex: 0 0 auto;
    padding: var(--wui-spacing-l);
    border-bottom: 1px solid var(--wui-color-gray-glass-005);
    background: var(--wui-color-modal-bg);
  }

  .landscape-desc {
    flex: 1;
    padding: var(--wui-spacing-l);
    background: var(--wui-color-modal-bg);
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
  }

  .landscape-store {
    flex: 0 0 auto;
    padding: var(--wui-spacing-l);
    background: var(--wui-color-modal-bg);
    border-top: 1px solid var(--wui-color-gray-glass-005);
  }

  .qr-section {
    width: 280px;
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--wui-color-modal-bg);
    border-radius: var(--wui-border-radius-m);
    overflow: visible;
    margin: 0;
    padding: 0;
    flex-shrink: 0;
  }

  .store-links {
    display: flex;
    flex-direction: column;
    gap: var(--wui-spacing-s);
    height: 100%;
    justify-content: center;
  }

  .store-links cross-w3m-mobile-download-links {
    display: block;
  }

  /* 왼쪽 영역 컴포넌트 스타일 */
  .landscape-left cross-w3m-connecting-wc-mobile {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 0;
    margin: 0;
  }

  .landscape-left cross-w3m-connecting-wc-mobile cross-wui-flex {
    padding: 0 var(--wui-spacing-s) 0 var(--wui-spacing-s) !important;
    margin: 0 !important;
    transform: translateY(0) !important;
    justify-content: flex-start !important;
    align-items: center !important;
  }

  .landscape-left cross-w3m-connecting-wc-mobile cross-wui-wallet-image {
    margin: 0 !important;
  }

  .landscape-left cross-w3m-connecting-wc-mobile cross-wui-text {
    margin: var(--wui-spacing-xs) 0 !important;
  }

  .landscape-left cross-w3m-connecting-wc-mobile cross-wui-button {
    margin: var(--wui-spacing-s) 0 0 0 !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode {
    width: 100%;
    height: 100%;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode cross-wui-flex {
    width: 100% !important;
    height: 100% !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode cross-wui-shimmer {
    width: 280px !important;
    height: 280px !important;
    max-width: 280px !important;
    max-height: 280px !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode cross-wui-flex {
    width: 100% !important;
    height: 100% !important;
    justify-content: center !important;
    align-items: center !important;
    padding: 0 !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode cross-wui-qr-code {
    width: 280px !important;
    height: 280px !important;
    max-width: 280px !important;
    max-height: 280px !important;
  }

  .qr-section cross-w3m-connecting-wc-qrcode cross-wui-text {
    display: none !important;
  }

  /* 모바일 다운로드 링크 스타일 조정 */
  cross-w3m-mobile-download-links {
    padding: 0 !important;
  }

  /* 반응형은 일단 제거하고 고정 레이아웃 */

  /* 헤더와 탭 스타일 조정 */
  .landscape-tabs cross-w3m-connecting-header {
    width: 100%;
  }
`
