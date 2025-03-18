import {
  useAppKitAccount,
  useAppKitNetwork,
  useAppKitState,
} from '@cross/sdk/react'

export function InfoList() {
  const accountState = useAppKitAccount()
  const networkState = useAppKitNetwork()
  const appKitState = useAppKitState()

  return (
    <div className="code-container-wrapper">
      <section className="code-container">
        <h2 className="code-container-title">useAppKitAccount()</h2>
        <div className="code-container-content">
          <pre>{JSON.stringify(accountState, (key, val)=>typeof val === 'bigint' ? val.toString() : val)}</pre>
        </div>
      </section>

      <section className="code-container">
        <h2 className="code-container-title">useAppKitNetwork()</h2>
        <div className="code-container-content">
          <pre>{JSON.stringify(networkState, null, 2)}</pre>
        </div>
      </section>

      <section className="code-container">
        <h2 className="code-container-title">useAppKitState()</h2>
        <div className="code-container-content">
          <pre>{JSON.stringify(appKitState, null, 2)}</pre>
        </div>
      </section>

    </div>
  )
}

export default InfoList
