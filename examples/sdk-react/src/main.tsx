import React from 'react'
import ReactDOM from 'react-dom/client'

import { sdkVersion } from '@to-nexus/sdk'

import App from './app.jsx'
import './assets/main.css'

;(window as any).__nexus = {
  sdkVersion
}

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
