import { useState, useEffect } from 'react'
import { subscribe } from 'valtio/vanilla'

import type { Connection } from '@to-nexus/appkit-utils/solana'

import { SolStoreUtil } from '../src/utils/SolanaStoreUtil.js'

// -- Types -----------------------------------------------------------
export * from '@to-nexus/appkit-utils/solana'

// -- Source -----------------------------------------------------------
export * from '../src/index.js'

// -- Hooks -----------------------------------------------------------
export function useAppKitConnection(): {
  connection: Connection | undefined
} {
  const [connection, setConnection] = useState<Connection | undefined>(
    SolStoreUtil.state.connection
  )

  useEffect(() => {
    const unsubscribe = subscribe(SolStoreUtil.state, () => {
      setConnection(SolStoreUtil.state.connection)
    })
    return unsubscribe
  }, [])

  return {
    connection
  }
}
