import { css } from 'lit'

export default css`
  cross-wui-grid,
  cross-wui-loading-spinner,
  cross-wui-flex {
    height: 360px;
  }

  cross-wui-grid {
    overflow: scroll;
    scrollbar-width: none;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, 104px);
  }

  wui-grid[data-scroll='false'] {
    overflow: hidden;
  }

  wui-grid::-webkit-scrollbar {
    display: none;
  }

  cross-wui-loading-spinner {
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 350px) {
    cross-wui-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`
