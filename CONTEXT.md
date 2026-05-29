# 서구 도시주택국 대시보드 — 프로젝트 인수인계

## 파일 위치
- **메인 파일**: `C:\Users\김종진\Desktop\vibecoding\dashboard\index.html` (단일 HTML SPA)
- **GitHub**: `https://github.com/kjj0708-ai/seogoo-dashboard`
- **배포 URL**: `https://kjj0708-ai.github.io/seogoo-dashboard/`
- **샘플 워드**: `C:\Users\김종진\Downloads\도로과_주간업무보고_샘플.docx`

---

## 기술 스택
- Firebase Realtime Database (compat SDK 9.23.0)
- Firebase Auth (Google Sign-In 팝업)
- GitHub Pages (GitHub Actions 자동 배포)
- 순수 HTML/CSS/JS (프레임워크 없음)

---

## 조직 구조 (var ORG)
```javascript
var ORG = {
  '도로과':        ['건설행정팀','도로팀','보도관리팀','자전거도시팀','도로조명팀'],
  '도시계획과':    ['도시행정팀','도시개발팀','도시계획팀','GB관리팀'],
  '건축과':        ['건축행정팀','건축팀','건축정보팀','공공시설팀','건축안전센터팀'],
  '주택과':        ['주택팀','재개발재건축팀','주택정비팀','주거복지팀','주택민원팀'],
  '도시재생경관과': ['도시재생전략팀','도시재생사업팀','광고물관리팀','도시경관팀']
};
```
- 주택관리과 삭제됨
- 도시재생경관과 개발행위허가팀 삭제됨

---

## Firebase 실제 설정값 (index.html 내)
```javascript
var FB = {
  apiKey: "AIzaSyDDsAzrYojzbVXyaPilfF3Mj57pmat8JVU",
  authDomain: "bureau-dashboard.firebaseapp.com",
  databaseURL: "https://bureau-dashboard-default-rtdb.firebaseio.com",
  projectId: "bureau-dashboard",
  ...
};
var ADMIN_PW = '0708';  // 관리자 코드
var STAFF_PW = '1234';  // (현재 미사용)
```

---

## Firebase RTDB 데이터 구조

```
users/{uid}
  name, dept, team, isAdmin, status, email, createdAt

projects/{dept}/{id}
  name, dept, team, createdAt, updatedAt, author
  history/{logId}
    achieve, plan, updatedAt, author

issues/{id}
  title, content, status, progress, dept, photo, date, author

events/{id}
  title, start, end, ...

instruction
  text, date
```

---

## Firebase RTDB 보안 규칙 (현재 적용)
```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "projects": {
      ".read": "root.child('users').child(auth.uid).child('isAdmin').val() === true",
      "$dept": {
        ".read": "root.child('users').child(auth.uid).child('dept').val() === $dept || root.child('users').child(auth.uid).child('isAdmin').val() === true",
        ".write": "root.child('users').child(auth.uid).child('dept').val() === $dept || root.child('users').child(auth.uid).child('isAdmin').val() === true"
      }
    },
    "issues": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "events": {
      ".read": "auth != null",
      ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
    },
    "instruction": {
      ".read": "auth != null",
      ".write": "root.child('users').child(auth.uid).child('isAdmin').val() === true"
    }
  }
}
```

---

## 주요 기능 구현 현황

### 로그인 / 가입 승인 시스템
- Google 계정 로그인 (Firebase Auth)
- 최초 로그인 시 이름/부서(과)/팀 프로필 설정
- 관리자 코드 `"0708"` 입력 → `isAdmin:true`, `status:'approved'` → 바로 입장
- 일반 사용자 가입 → `status:'pending'` → 대기 화면 표시
- 대기 화면: `_statusRef` 리스너로 실시간 감지 → 승인 시 자동 앱 진입
- 관리자: 이슈 패널 상단 "👥 가입 승인 대기" 카드에서 승인/거절 처리
- 거절된 사용자: 거절 메시지 표시
- `users/{uid}` 에 프로필 저장 (status 포함)

### 사업 관리 (누적 실적 방식)
- Firebase: `projects/{dept}/{id}` 노드 (부서별 경로 분리 → 보안 규칙 적용)
- 데이터 구조: `{dept, team, name, createdAt, updatedAt, author, history/{logId}}`
- history 각 항목: `{achieve(실적), plan(향후계획), updatedAt, author}`
- 아이콘 버튼: ✏️ 수정 / 📝 업데이트 추가 / 🗑️ 삭제
- 상태(착수전~) 필드 없음
- 부서→팀→사업 카드 형태 렌더링
- **"전체보기" / "이번주 현황"** 토글 지원
  - `getISOWeek(date)` → `'YYYY-WNN'` 형식
  - 이번주 업데이트된 항목만 부서/팀별 그룹으로 표시

### 글로벌 변수 (JS)
```javascript
var currentUser=null, db=null, auth=null;
var issues=[], projects=[], events=[], instruction=null;
var _projRef=null, _statusRef=null, _usersRef=null;
var calY, calM, editIssId=null, editProjId=null;
var pendingPhoto=null, confCb=null, statusFilter='';
```

### 주요 함수 목록
| 함수 | 역할 |
|------|------|
| `doGoogleLogin()` | Google 로그인 팝업 |
| `showProfileSetup(user)` | 최초 프로필 설정 화면 |
| `saveProfileSetup()` | 프로필 저장 + pending/approved 분기 |
| `setCurrentUserFromProfile(user,p)` | currentUser 설정 (status 포함) |
| `showPendingScreen(reason)` | 대기/거절 화면 표시 |
| `setupStatusListener(uid)` | 승인 실시간 감지 리스너 |
| `enterApp()` | 앱 진입 (admin이면 setupUsersListener 호출) |
| `doLogout()` | 로그아웃 + 모든 리스너 정리 |
| `setupUsersListener()` | 전체 users 실시간 감지 (admin용) |
| `renderUserMgmt(usersData)` | 대기 사용자 목록 렌더링 |
| `approveUser(uid)` | 사용자 승인 |
| `rejectUser(uid)` | 사용자 거절 |
| `setupProjectsListener()` | projects 실시간 리스너 (admin: 전체, staff: 본인 부서) |
| `teardownProjectsListener()` | projects 리스너 해제 |
| `projPath(id)` | `projects/{dept}/{id}` 경로 반환 |
| `saveProject()` | 사업 저장/수정 |
| `deleteProject(id)` | 사업 삭제 |
| `renderProjectsGrid()` | 사업 목록 렌더링 |
| `switchProjView(v)` | 전체보기/이번주현황 전환 |
| `renderWeeklyView()` | 이번주 업데이트 목록 렌더링 |
| `downloadProjReport(dept)` | 워드 보고서 다운로드 |

### 워드 저장 (`downloadProjReport(dept)`)
- **방식**: HTML-to-DOC blob (MSWord namespace)
- **페이지**: A4 세로(portrait), 여백 1.27cm
- **구조**: 팀명 rowspan=2 | 진행현황 colspan=4 → 사업명|내용|사업명|내용
- **열 너비**: 팀명 2.33cm | 사업명 2.82cm | 내용 5.34cm | 사업명 3.0cm | 내용 4.94cm
- **색상**: 헤더 #DCE6F1 / 팀명셀 #EAF0FB / 사업명셀 #F5F8FF
- **폰트**: 맑은 고딕, 10pt
- **1행 2사업** 배치, 과 컬럼 없음

### 달력 (캘린더)
- Google Calendar API 연동 (공개 캘린더)
- Firebase `events/{id}` 에 직접 일정 추가 가능 (admin)
- 모바일: 주중만 표시

### 국장 지시사항
- Firebase `instruction` 노드
- admin만 입력 가능

---

## 배포 방법
```bash
# index.html 수정 후
git add index.html
git commit -m "변경 내용"
git push origin main
# → GitHub Actions가 자동으로 gh-pages 배포
```

---

## 작업 완료 항목
- [x] 조직 개편 (주택관리과 삭제, 팀 조정)
- [x] Google 로그인 + 프로필 설정
- [x] 누적 실적 기반 사업 관리 (실적/향후계획 분리)
- [x] 아이콘 버튼 (수정/업데이트/삭제)
- [x] 상태 필드 삭제
- [x] 워드 저장: 샘플 양식 매칭 (A4 세로, 정확한 열 너비, 색상)
- [x] Firebase 보안 규칙: 부서별 접근 제한, isAdmin 체크
- [x] projects 경로 `projects/{id}` → `projects/{dept}/{id}` 재구성
- [x] 이번주 현황 뷰 (ISO week 기반 필터링)
- [x] 관리자 승인 시스템 (pending/approved/rejected, 실시간 감지)

## 잔여/개선 가능 항목
- 워드 저장 결과물 실제 확인 (Word에서 열어서 샘플과 비교)
- 이슈 탭도 부서별 보안 규칙 강화 검토
