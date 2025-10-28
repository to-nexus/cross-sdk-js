import type { WuiCard } from '../components/wui-card/index.js'
import type { WuiIcon } from '../components/wui-icon/index.js'
import type { WuiImage } from '../components/wui-image/index.js'
import type { WuiLoadingHexagon } from '../components/wui-loading-hexagon/index.js'
import type { WuiLoadingSpinner } from '../components/wui-loading-spinner/index.js'
import type { WuiLoadingThumbnail } from '../components/wui-loading-thumbnail/index.js'
import type { WuiShimmer } from '../components/wui-shimmer/index.js'
import type { WuiText } from '../components/wui-text/index.js'
import type { WuiVisual } from '../components/wui-visual/index.js'
import type { WuiAccountButton } from '../composites/wui-account-button/index.js'
import type { WuiAlertBar } from '../composites/wui-alertbar/index.js'
import type { WuiAllWalletsImage } from '../composites/wui-all-wallets-image/index.js'
import type { WuiAvatar } from '../composites/wui-avatar/index.js'
import type { WuiBalance } from '../composites/wui-balance/index.js'
import type { WuiBanner } from '../composites/wui-banner/index.js'
import type { WuiButton } from '../composites/wui-button/index.js'
import type { WuiCardSelectLoader } from '../composites/wui-card-select-loader/index.js'
import type { WuiCardSelect } from '../composites/wui-card-select/index.js'
import type { WuiCertifiedSwitch } from '../composites/wui-certified-switch/index.js'
import type { WuiCheckBox } from '../composites/wui-checkbox/index.js'
import type { WuiChipButton } from '../composites/wui-chip-button/index.js'
import type { WuiChip } from '../composites/wui-chip/index.js'
import type { WuiCompatibleNetwork } from '../composites/wui-compatible-network/index.js'
import type { WuiConnectButton } from '../composites/wui-connect-button/index.js'
import type { WuiCtaButton } from '../composites/wui-cta-button/index.js'
import type { WuiDetailsGroupItem } from '../composites/wui-details-group-item/index.js'
import type { WuiDetailsGroup } from '../composites/wui-details-group/index.js'
import type { WuiEmailInput } from '../composites/wui-email-input/index.js'
import type { WuiEnsInput } from '../composites/wui-ens-input/index.js'
import type { WuiIconBox } from '../composites/wui-icon-box/index.js'
import type { WuiIconButton } from '../composites/wui-icon-button/index.js'
import type { WuiIconLink } from '../composites/wui-icon-link/index.js'
import type { WuiInputAmount } from '../composites/wui-input-amount/index.js'
import type { WuiInputElement } from '../composites/wui-input-element/index.js'
import type { WuiInputNumeric } from '../composites/wui-input-numeric/index.js'
import type { WuiInputText } from '../composites/wui-input-text/index.js'
import type { WuiLink } from '../composites/wui-link/index.js'
import type { WuiListAccordion } from '../composites/wui-list-accordion/index.js'
import type { WuiListAccount } from '../composites/wui-list-account/index.js'
import type { WuiListButton } from '../composites/wui-list-button/index.js'
import type { WuiListContent } from '../composites/wui-list-content/index.js'
import type { WuiListDescription } from '../composites/wui-list-description/index.js'
import type { WuiListItem } from '../composites/wui-list-item/index.js'
import type { WuiListNetwork } from '../composites/wui-list-network/index.js'
import type { WuiListSocial } from '../composites/wui-list-social/index.js'
import type { WuiListToken } from '../composites/wui-list-token/index.js'
import type { WuiListWalletTransaction } from '../composites/wui-list-wallet-transaction/index.js'
import type { WuiListWallet } from '../composites/wui-list-wallet/index.js'
import type { WuiLogoSelect } from '../composites/wui-logo-select/index.js'
import type { WuiLogo } from '../composites/wui-logo/index.js'
import type { WuiNetworkButton } from '../composites/wui-network-button/index.js'
import type { WuiNetworkImage } from '../composites/wui-network-image/index.js'
import type { WuiNoticeCard } from '../composites/wui-notice-card/index.js'
import type { WuiOtp } from '../composites/wui-otp/index.js'
import type { WuiPreviewItem } from '../composites/wui-preview-item/index.js'
import type { WuiProfileButtonV2 } from '../composites/wui-profile-button-v2/index.js'
import type { WuiProfileButton } from '../composites/wui-profile-button/index.js'
import type { WuiPromo } from '../composites/wui-promo/index.js'
import type { WuiQrCode } from '../composites/wui-qr-code/index.js'
import type { WuiSearchBar } from '../composites/wui-search-bar/index.js'
import type { WuiSelect } from '../composites/wui-select/index.js'
import type { WuiSnackbar } from '../composites/wui-snackbar/index.js'
import type { WuiSwitch } from '../composites/wui-switch/index.js'
import type { WuiTabs } from '../composites/wui-tabs/index.js'
import type { WuiTag } from '../composites/wui-tag/index.js'
import type { WuiTokenButton } from '../composites/wui-token-button/index.js'
import type { WuiTokenListItem } from '../composites/wui-token-list-item/index.js'
import type { WuiTooltip } from '../composites/wui-tooltip/index.js'
import type { WuiTransactionListItemLoader } from '../composites/wui-transaction-list-item-loader/index.js'
import type { WuiTransactionListItem } from '../composites/wui-transaction-list-item/index.js'
import type { WuiTransactionVisual } from '../composites/wui-transaction-visual/index.js'
import type { WuiVisualThumbnail } from '../composites/wui-visual-thumbnail/index.js'
import type { WuiWalletButton } from '../composites/wui-wallet-button/index.js'
import type { WuiWalletImage } from '../composites/wui-wallet-image/index.js'
import type { WuiFlex } from '../layout/wui-flex/index.js'
import type { WuiGrid } from '../layout/wui-grid/index.js'
import type { WuiSeparator } from '../layout/wui-separator/index.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CustomElement<E> = Partial<E & { children?: any; onClick: any }>

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      // -- Components ------------------------------------------- //
      'cross-wui-card': CustomElement<WuiCard>
      'cross-wui-icon': CustomElement<WuiIcon>
      'cross-wui-image': CustomElement<WuiImage>
      'cross-wui-loading-hexagon': CustomElement<WuiLoadingHexagon>
      'cross-wui-loading-spinner': CustomElement<WuiLoadingSpinner>
      'cross-wui-loading-thumbnail': CustomElement<WuiLoadingThumbnail>
      'cross-wui-shimmer': CustomElement<WuiShimmer>
      'cross-wui-text': CustomElement<WuiText>
      'cross-wui-visual': CustomElement<WuiVisual>
      // -- Composites ------------------------------------------- //
      'cross-wui-account-button': CustomElement<WuiAccountButton>
      'cross-wui-all-wallets-image': CustomElement<WuiAllWalletsImage>
      'cross-wui-avatar': CustomElement<WuiAvatar>
      'cross-wui-balance': CustomElement<WuiBalance>
      'cross-wui-button': CustomElement<WuiButton>
      'cross-wui-card-select-loader': CustomElement<WuiCardSelectLoader>
      'cross-wui-card-select': CustomElement<WuiCardSelect>
      'cross-wui-chip-button': CustomElement<WuiChipButton>
      'cross-wui-chip': CustomElement<WuiChip>
      'cross-wui-compatible-network': CustomElement<WuiCompatibleNetwork>
      'cross-wui-connect-button': CustomElement<WuiConnectButton>
      'cross-wui-cta-button': CustomElement<WuiCtaButton>
      'cross-wui-details-group-item': CustomElement<WuiDetailsGroupItem>
      'cross-wui-details-group': CustomElement<WuiDetailsGroup>
      'cross-wui-email-input': CustomElement<WuiEmailInput>
      'cross-wui-ens-input': CustomElement<WuiEnsInput>
      'cross-wui-icon-box': CustomElement<WuiIconBox>
      'cross-wui-icon-link': CustomElement<WuiIconLink>
      'cross-wui-input-amount': CustomElement<WuiInputAmount>
      'cross-wui-input-element': CustomElement<WuiInputElement>
      'cross-wui-input-numeric': CustomElement<WuiInputNumeric>
      'cross-wui-input-text': CustomElement<WuiInputText>
      'cross-wui-link': CustomElement<WuiLink>
      'cross-wui-list-accordion': CustomElement<WuiListAccordion>
      'cross-wui-list-button': CustomElement<WuiListButton>
      'cross-wui-list-content': CustomElement<WuiListContent>
      'cross-wui-list-description': CustomElement<WuiListDescription>
      'cross-wui-list-item': CustomElement<WuiListItem>
      'cross-wui-list-network': CustomElement<WuiListNetwork>
      'cross-wui-list-social': CustomElement<WuiListSocial>
      'cross-wui-list-token': CustomElement<WuiListToken>
      'cross-wui-list-wallet-transaction': CustomElement<WuiListWalletTransaction>
      'cross-wui-list-wallet': CustomElement<WuiListWallet>
      'cross-wui-logo-select': CustomElement<WuiLogoSelect>
      'cross-wui-logo': CustomElement<WuiLogo>
      'cross-wui-network-button': CustomElement<WuiNetworkButton>
      'cross-wui-network-image': CustomElement<WuiNetworkImage>
      'cross-wui-notice-card': CustomElement<WuiNoticeCard>
      'cross-wui-otp': CustomElement<WuiOtp>
      'cross-wui-preview-item': CustomElement<WuiPreviewItem>
      'cross-wui-profile-button': CustomElement<WuiProfileButton>
      'wui-profile-button-v2': CustomElement<WuiProfileButtonV2>
      'cross-wui-promo': CustomElement<WuiPromo>
      'cross-wui-qr-code': CustomElement<WuiQrCode>
      'cross-wui-search-bar': CustomElement<WuiSearchBar>
      'cross-wui-select': CustomElement<WuiSelect>
      'cross-wui-snackbar': CustomElement<WuiSnackbar>
      'cross-wui-alertbar': CustomElement<WuiAlertBar>
      'cross-wui-tabs': CustomElement<WuiTabs>
      'cross-wui-tag': CustomElement<WuiTag>
      'cross-wui-token-button': CustomElement<WuiTokenButton>
      'cross-wui-token-list-item': CustomElement<WuiTokenListItem>
      'cross-wui-icon-button': CustomElement<WuiIconButton>
      'cross-wui-tooltip': CustomElement<WuiTooltip>
      'cross-wui-transaction-list-item-loader': CustomElement<WuiTransactionListItemLoader>
      'cross-wui-transaction-list-item': CustomElement<WuiTransactionListItem>
      'cross-wui-transaction-visual': CustomElement<WuiTransactionVisual>
      'cross-wui-visual-thumbnail': CustomElement<WuiVisualThumbnail>
      'cross-wui-wallet-image': CustomElement<WuiWalletImage>
      'cross-wui-wallet-button': CustomElement<WuiWalletButton>
      'cross-wui-banner': CustomElement<WuiBanner>
      'cross-wui-list-account': CustomElement<WuiListAccount>
      'cross-wui-checkbox': CustomElement<WuiCheckBox>
      'cross-wui-switch': CustomElement<WuiSwitch>
      'cross-wui-certified-switch': CustomElement<WuiCertifiedSwitch>
      // -- Layout ------------------------------------------- //
      'cross-wui-flex': CustomElement<WuiFlex>
      'cross-wui-grid': CustomElement<WuiGrid>
      'cross-wui-separator': CustomElement<WuiSeparator>
    }
  }
}
