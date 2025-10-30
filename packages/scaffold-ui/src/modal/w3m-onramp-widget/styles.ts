import { css } from 'lit'

export default css`
  :host > cross-wui-flex {
    width: 100%;
    max-width: 360px;
  }

  :host > wui-flex > cross-wui-flex {
    border-radius: var(--wui-border-radius-l);
    width: 100%;
  }

  .amounts-container {
    width: 100%;
  }
`
