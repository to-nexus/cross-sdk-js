import type { VisualType } from '@to-nexus/appkit-ui'
import { customElement } from '@to-nexus/appkit-ui'

import { LitElement, html } from 'lit'
import { property } from 'lit/decorators.js'

type Data = {
  images: VisualType[]
  title: string
  text: string
}

@customElement('cross-w3m-help-widget')
export class W3mHelpWidget extends LitElement {
  // -- State & Properties -------------------------------- //
  @property({ type: Array }) public data: Data[] = []

  // -- Render -------------------------------------------- //
  public override render() {
    return html`
      <cross-wui-flex flexDirection="column" alignItems="center" gap="l">
        ${this.data.map(
          item => html`
            <cross-wui-flex flexDirection="column" alignItems="center" gap="xl">
              <cross-wui-flex flexDirection="row" justifyContent="center" gap="1xs">
                ${item.images.map(image => html`<cross-wui-visual name=${image}></cross-wui-visual>`)}
              </cross-wui-flex>
            </cross-wui-flex>
            <cross-wui-flex flexDirection="column" alignItems="center" gap="xxs">
              <cross-wui-text variant="paragraph-500" color="fg-100" align="center">
                ${item.title}
              </cross-wui-text>
              <cross-wui-text variant="small-500" color="fg-200" align="center">${item.text}</cross-wui-text>
            </cross-wui-flex>
          `
        )}
      </cross-wui-flex>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cross-w3m-help-widget': W3mHelpWidget
  }
}
