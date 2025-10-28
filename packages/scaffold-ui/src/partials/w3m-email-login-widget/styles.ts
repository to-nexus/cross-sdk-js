import { css } from 'lit'

export default css`
  cross-wui-separator {
    margin: var(--wui-spacing-s) calc(var(--wui-spacing-s) * -1);
    width: calc(100% + var(--wui-spacing-s) * 2);
  }

  cross-wui-email-input {
    width: 100%;
  }

  form {
    width: 100%;
    display: block;
    position: relative;
  }

  cross-wui-icon-link,
  cross-wui-loading-spinner {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }

  cross-wui-icon-link {
    right: var(--wui-spacing-xs);
  }

  cross-wui-loading-spinner {
    right: var(--wui-spacing-m);
  }

  cross-wui-text {
    margin: var(--wui-spacing-xxs) var(--wui-spacing-m) var(--wui-spacing-0) var(--wui-spacing-m);
  }
`
