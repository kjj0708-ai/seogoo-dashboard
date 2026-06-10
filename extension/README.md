# 서구 도시주택국 현안이슈 알림 (Chrome 확장프로그램)

총괄관리자가 신규 현안이슈를 **빨간 배지(숫자)** 와 **데스크톱 알림**으로 실시간 확인하기 위한 Chrome MV3 확장프로그램.

---

## 설치 방법 (최초 1회)

1. Chrome 주소창에 `chrome://extensions` 입력 → 우측 상단 **"개발자 모드"** ON
2. 좌측 상단 **"압축해제된 확장 프로그램을 로드합니다"** 클릭
3. 이 폴더(`extension`)를 선택
4. 확장 목록에 **"서구 도시주택국 현안이슈 알림"** 가 표시되면 완료
5. 우측 상단 퍼즐(🧩) 아이콘에서 본 확장을 **고정(📌)** 해두면 편함

> 알림 권한을 묻는 경우 **허용**을 눌러주세요.

---

## 사용 방법

1. 한 번 [dashboard.choshg.com](https://dashboard.choshg.com/) 을 열어 **로그인**
   → 로그인 토큰이 확장에 자동 저장됨
2. 이후 탭을 닫아도 **1분마다 자동 폴링**
3. 신규 이슈 발생 시
   - 확장 아이콘에 **빨간 배지 숫자** 표시
   - 데스크톱 알림 표시 (클릭하면 대시보드로 이동)
4. 확장 아이콘 클릭 → 신규 이슈 목록 확인
   - **모두 확인** : 배지 0으로 초기화
   - **대시보드 열기** : 대시보드 탭으로 이동
   - **↻** : 즉시 폴링

---

## 동작 원리

```
┌─ dashboard.choshg.com 탭 ─────────────┐
│  page-bridge.js  (MAIN world)         │
│   ├ firebase.auth().currentUser →     │
│   │   getIdToken() 추출               │
│   └ window.issues 추출                │
│        │                              │
│        ▼ postMessage                  │
│  content.js  (ISOLATED world)         │
│        │                              │
└────────┼──────────────────────────────┘
         │ chrome.runtime.sendMessage
         ▼
┌─ background.js (Service Worker) ───────┐
│  • token / issues 저장                 │
│  • alarms 1분 주기 폴링                │
│     GET /issues.json?auth=<TOKEN>      │
│  • 신규 감지 → 배지 + notifications    │
└────────┬───────────────────────────────┘
         ▼
   chrome.action.setBadgeText("3")
   chrome.notifications.create(...)
```

- 대시보드 탭이 **열려 있으면** : content script가 즉시 push (빠름)
- 대시보드 탭이 **닫혀 있어도** : 저장된 ID 토큰으로 1분마다 REST 폴링
- ID 토큰은 약 1시간 후 만료됨 → 대시보드를 다시 한 번 열면 자동 갱신

---

## 권한

| 권한 | 용도 |
|------|------|
| `storage` | 토큰, 본 이슈 ID, 배지 카운트 저장 |
| `alarms`  | 1분 주기 폴링 |
| `notifications` | 신규 이슈 데스크톱 알림 |
| `https://dashboard.choshg.com/*` | 토큰/이슈 추출 |
| `https://*.firebaseio.com/*` | Firebase REST 호출 |

---

## 트러블슈팅

- **배지가 안 뜸 / "로그인 토큰 없음" 경고**
  → dashboard.choshg.com 을 한 번 열고 로그인하세요. 토큰이 캡처되면 자동으로 사라집니다.

- **인증 실패(HTTP_401/403)**
  → 토큰 만료. 대시보드 탭을 한 번 새로고침하세요.

- **신규 이슈가 1분 늦게 뜸**
  → MV3 alarms 최소 주기가 1분입니다. 대시보드 탭을 켜두면 거의 실시간으로 갱신됩니다.

- **알림이 안 옴**
  → Windows 설정 → 시스템 → 알림에서 Chrome 알림 허용 확인.

---

## 파일 구조

```
extension/
├─ manifest.json       MV3 설정
├─ background.js       서비스 워커 (폴링 + 배지 + 알림)
├─ page-bridge.js      대시보드 페이지 MAIN world 주입
├─ content.js          ISOLATED ↔ MAIN 메시지 중계
├─ popup.html / .js    툴바 아이콘 클릭 시 팝업
├─ icons/              16/32/48/128 PNG
└─ README.md
```

버전: 1.0.0
