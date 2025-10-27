import { ConstantsUtil } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'

@customElement('cross-w3m-upgrade-wallet-view')
export class W3mUpgradeWalletView extends LitElement {
  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex flexDirection="column" alignItems="center" gap="xl" padding="xl">
        <cross-wui-text variant="paragraph-400" color="fg-100">Follow the instructions on</cross-wui-text>
        <cross-wui-chip
          icon="externalLink"
          variant="fill"
          href=${ConstantsUtil.SECURE_SITE_DASHBOARD}
          imageSrc=${ConstantsUtil.SECURE_SITE_FAVICON}
          data-testid="cross-w3m-secure-website-button"
        >
        </cross-wui-chip>
        <cross-wui-text variant="small-400" color="fg-200">
          You will have to reconnect for security reasons
        </cross-wui-text>
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-upgrade-wallet-view': W3mUpgradeWalletView
  }
}
