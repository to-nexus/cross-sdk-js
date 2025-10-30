import type { Platform } from '@to-nexus/appkit-core'
import { ConnectionController } from '@to-nexus/appkit-core'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property, state } from 'lit/decorators.js'

@customElement('cross-w3m-connecting-header')
export class W3mConnectingHeader extends LitElement {
  // -- Members ------------------------------------------- //
  private platformTabs: Platform[] = []

  private unsubscribe: (() => void)[] = []

  // -- State & Properties -------------------------------- //
  @property({ type: Array }) public platforms: Platform[] = []

  @property() public onSelectPlatfrom?: (platform: Platform) => void = undefined

  @state() private buffering = false

  public constructor() {
    super()
    // Persist custom tab colors on host so they survive child re-renders
    this.style.setProperty('--wui-tabs-active-bg', '#ffffff')
    this.style.setProperty('--wui-tabs-active-text-color', '#222222')
    this.style.setProperty('--wui-tabs-active-icon-color', '#222222')
    this.style.setProperty('--wui-tabs-disabled-opacity', '1')
    this.style.setProperty('--wui-tabs-active-disabled-text-color', '#222222')
    this.style.setProperty('--wui-tabs-active-disabled-icon-color', '#222222')
    this.unsubscribe.push(
      ConnectionController.subscribeKey('buffering', val => (this.buffering = val))
    )
  }

  disconnectCallback() {
    this.unsubscribe.forEach(unsubscribe => unsubscribe())
  }

  // -- Render -------------------------------------------- //
  public override render() {
    const tabs = this.generateTabs()

    return html`
      <cross-wui-flex justifyContent="center" .padding=${['0', '0', 'l', '0'] as const}>
        <cross-wui-tabs
          style="--wui-tabs-active-bg:#fff;--wui-tabs-active-text-color:#222;--wui-tabs-active-icon-color:#222;--wui-tabs-disabled-opacity:1;--wui-tabs-active-disabled-text-color:#222;--wui-tabs-active-disabled-icon-color:#222"
          ?disabled=${this.buffering}
          .tabs=${tabs}
          .onTabChange=${this.onTabChange.bind(this)}
        ></cross-wui-tabs>
      </cross-wui-flex>
    `
  }

  // -- Private ------------------------------------------- //
  private generateTabs() {
    const tabs = this.platforms.map(platform => {
      if (platform === 'browser') {
        return { label: 'Extension', icon: 'extension', platform: 'browser' } as const
      } else if (platform === 'mobile') {
        return { label: 'Mobile', icon: 'mobile', platform: 'mobile' } as const
      } else if (platform === 'qrcode') {
        return { label: 'QR Code', icon: 'mobile', platform: 'qrcode' } as const
      } else if (platform === 'web') {
        return { label: 'Webapp', icon: 'browser', platform: 'web' } as const
      } else if (platform === 'desktop') {
        return { label: 'Extension', icon: 'desktop', platform: 'desktop' } as const
      }

      return { label: 'Browser', icon: 'extension', platform: 'unsupported' } as const
    })

    this.platformTabs = tabs.map(({ platform }) => platform)

    return tabs
  }

  private onTabChange(index: number) {
    const tab = this.platformTabs[index]
    if (tab) {
      this.onSelectPlatfrom?.(tab)
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-connecting-header': W3mConnectingHeader
  }
}
