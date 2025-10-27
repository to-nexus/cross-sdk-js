import { css } from 'lit'

export default css`
  cross-wui-flex {
    width: 100%;
  }

  cross-wui-promo {
    position: absolute;
    top: -32px;
  }

  cross-wui-profile-button {
    margin-top: calc(-1 * var(--wui-spacing-2l));
  }

  wui-promo + cross-wui-profile-button {
    margin-top: var(--wui-spacing-2l);
  }

  cross-wui-tabs {
    width: 100%;
  }

  .contentContainer {
    height: 280px;
  }

  .contentContainer > cross-wui-icon-box {
    width: 40px;
    height: 40px;
    border-radius: var(--wui-border-radius-xxs);
  }

  .contentContainer > .textContent {
    width: 65%;
  }
`
