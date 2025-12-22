# CROSSx Browser - JS Injection 명세서

> CROSSx Browser에서 웹페이지 로드 시 `window.__crossx` 마커를 주입하여 SDK가 CROSSx 환경임을 감지할 수 있도록 하는 명세입니다.

## 배경

기존에는 UserAgent 문자열(`CROSSx/${version}`)로 CROSSx Browser를 감지했으나, 다음과 같은 문제가 있었습니다:

- UserAgent 스푸핑이 가능
- 플랫폼별로 UserAgent 형식이 일관되지 않을 수 있음
- WebView 환경에서 UserAgent 설정이 누락될 수 있음

JS Injection 방식을 사용하면 더 안정적이고 신뢰할 수 있는 감지가 가능합니다.

---

## 마커 인터페이스

```typescript
interface CROSSxBrowserMarker {
  browser: true // 항상 true (필수)
  version: string // 브라우저/앱 버전, 예: "1.0.0" (필수)
  platform: 'ios' | 'android' | 'desktop' // 플랫폼 (필수)
  injectedAt?: number // injection 시점 timestamp (선택, 디버깅용)
}
```

### 예시

```javascript
window.__crossx = {
  browser: true,
  version: '1.2.3',
  platform: 'ios',
  injectedAt: 1702814400000
}
```

---

## Injection 타이밍

> ⚠️ **중요**: 반드시 페이지의 JavaScript가 실행되기 **전**에 injection되어야 합니다.

| 플랫폼             | 권장 시점                                   |
| ------------------ | ------------------------------------------- |
| iOS (WKWebView)    | `WKUserScriptInjectionTime.atDocumentStart` |
| Android (WebView)  | JavaScript 활성화 직후, `loadUrl()` 호출 전 |
| Desktop (Electron) | `webPreferences.preload` 스크립트           |

---

## 플랫폼별 구현 예시

### iOS (Swift + WKWebView)

```swift
import WebKit

class CROSSxWebViewController: UIViewController {
    var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        let config = WKWebViewConfiguration()
        let userContentController = WKUserContentController()

        // CROSSx 마커 injection 스크립트
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        let script = """
        window.__crossx = {
            browser: true,
            version: "\(version)",
            platform: "ios",
            injectedAt: Date.now()
        };
        """

        let userScript = WKUserScript(
            source: script,
            injectionTime: .atDocumentStart,  // ⚠️ 반드시 atDocumentStart
            forMainFrameOnly: true
        )

        userContentController.addUserScript(userScript)
        config.userContentController = userContentController

        webView = WKWebView(frame: view.bounds, configuration: config)
        view.addSubview(webView)
    }
}
```

### Android (Kotlin + WebView)

```kotlin
import android.webkit.WebView
import android.webkit.WebViewClient

class CROSSxWebViewActivity : AppCompatActivity() {
    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)
        setContentView(webView)

        webView.settings.javaScriptEnabled = true

        val version = packageManager.getPackageInfo(packageName, 0).versionName

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)

                // ⚠️ 페이지 시작 시 즉시 injection
                val script = """
                    window.__crossx = {
                        browser: true,
                        version: "$version",
                        platform: "android",
                        injectedAt: Date.now()
                    };
                """.trimIndent()

                view?.evaluateJavascript(script, null)
            }
        }

        webView.loadUrl("https://your-dapp.com")
    }
}
```

### Desktop (Electron)

**preload.js:**

```javascript
const { contextBridge } = require('electron')
const { app } = require('@electron/remote')

// 페이지 로드 전에 실행됨
window.__crossx = {
  browser: true,
  version: app.getVersion(),
  platform: 'desktop',
  injectedAt: Date.now()
}
```

**main.js:**

```javascript
const { BrowserWindow } = require('electron')
const path = require('path')

const win = new BrowserWindow({
  webPreferences: {
    preload: path.join(__dirname, 'preload.js'),
    contextIsolation: false // __crossx를 window에 직접 설정하기 위해
  }
})
```

---

## SDK 감지 로직

SDK에서는 다음 순서로 CROSSx 환경을 감지합니다:

```
1순위: window.__crossx 마커 확인
   ├─ boolean (true) - 레거시 지원
   └─ object { browser: true, ... } - 새 방식 ✅

2순위: userAgent fallback (하위 호환성)
   └─ /CROSSx\/[\d.]+/i 패턴 매칭
```

---

## 테스트 방법

### 1. 브라우저 콘솔에서 확인

```javascript
// SDK 감지 확인 (webapp 패키지 사용 시)
import { getCROSSxBrowserInfo, isCROSSxEnvironment } from '@to-nexus/webapp'

// injection 확인
console.log('__crossx:', window.__crossx)

console.log('Is CROSSx:', isCROSSxEnvironment())
console.log('Browser Info:', getCROSSxBrowserInfo())
```

### 2. 예상 출력

```javascript
// window.__crossx
{
  browser: true,
  version: "1.2.3",
  platform: "ios",
  injectedAt: 1702814400000
}

// isCROSSxEnvironment()
true

// getCROSSxBrowserInfo()
{
  browser: true,
  version: "1.2.3",
  platform: "ios",
  injectedAt: 1702814400000
}
```

---

## 하위 호환성

| 방식                                       | 지원 여부 | 비고                  |
| ------------------------------------------ | --------- | --------------------- |
| `window.__crossx = true` (boolean)         | ✅ 지원   | 레거시, 권장하지 않음 |
| `window.__crossx = { browser: true, ... }` | ✅ 지원   | **권장**              |
| UserAgent에 `CROSSx/${version}` 포함       | ✅ 지원   | Fallback으로 동작     |

> 💡 **권장**: 새로운 객체 형식 (`{ browser: true, version, platform }`)을 사용하면 SDK에서 버전과 플랫폼 정보를 활용할 수 있습니다.

---

## 주의사항

1. **Injection 타이밍**: 반드시 페이지 JavaScript 실행 전에 injection 되어야 함
2. **HTTPS**: 보안상 HTTPS 페이지에서만 동작하도록 권장
3. **Frame 제한**: `forMainFrameOnly: true`로 설정하여 iframe에서는 injection되지 않도록 권장
4. **버전 형식**: Semantic Versioning (예: `1.2.3`) 형식 권장

---

## 변경 이력

| 버전  | 날짜       | 변경 내용      |
| ----- | ---------- | -------------- |
| 1.0.0 | 2025-12-17 | 최초 명세 작성 |

---

## 문의

SDK 관련 문의: [SDK 개발팀]
