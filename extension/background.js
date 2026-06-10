/* 서구 도시주택국 현안이슈 알림 — Background Service Worker (MV3)
   - 1분마다 Firebase REST 폴링
   - 대시보드 탭이 열려 있을 때는 content.js가 push로 즉시 갱신
   - 신규 이슈 감지 → 빨간 배지 숫자 + 데스크탑 알림 */

const DB_URL       = 'https://bureau-dashboard-default-rtdb.firebaseio.com';
const DASHBOARD_URL= 'https://dashboard.choshg.com/';
const POLL_ALARM   = 'pollIssues';
const POLL_MIN     = 1; /* MV3 alarms 최소 주기 */

function setupAlarmsAndBadge(){
  chrome.alarms.create(POLL_ALARM, { periodInMinutes: POLL_MIN, delayInMinutes: 0 });
  try { chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); } catch(_){}
  try { chrome.action.setBadgeTextColor && chrome.action.setBadgeTextColor({ color: '#ffffff' }); } catch(_){}
}

chrome.runtime.onInstalled.addListener(setupAlarmsAndBadge);
chrome.runtime.onStartup.addListener(setupAlarmsAndBadge);

chrome.alarms.onAlarm.addListener(function(a){
  if(a.name === POLL_ALARM) pollOnce();
});

/* content.js → background 메시지 */
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse){
  if(!msg || !msg.type) return;

  if(msg.type === 'token' && msg.token){
    chrome.storage.local.set({
      idToken: msg.token,
      tokenAt: Date.now(),
      tokenUid: msg.uid || '',
      tokenEmail: msg.email || ''
    });
    return;
  }

  if(msg.type === 'issues' && Array.isArray(msg.issues)){
    processIssues(msg.issues, 'push');
    return;
  }

  if(msg.type === 'markSeen'){
    markAllSeen().then(function(){ sendResponse({ok:true}); });
    return true;
  }

  if(msg.type === 'getState'){
    chrome.storage.local.get(
      ['allIssues','unseenIds','lastPollAt','tokenAt','tokenEmail','lastError'],
      function(s){ sendResponse(s); }
    );
    return true;
  }

  if(msg.type === 'pollNow'){
    pollOnce().then(function(){ sendResponse({ok:true}); });
    return true;
  }
});

/* Firebase REST 폴링
   issues 보안 규칙: auth != null
   → ?auth=<ID_TOKEN> 쿼리스트링으로 인증 */
function pollOnce(){
  return new Promise(function(resolve){
    chrome.storage.local.get(['idToken'], function(s){
      if(!s.idToken){
        chrome.storage.local.set({ lastError: 'NO_TOKEN', lastPollAt: Date.now() });
        resolve();
        return;
      }
      var url = DB_URL + '/issues.json?auth=' + encodeURIComponent(s.idToken);
      fetch(url, { cache: 'no-store' })
        .then(function(r){
          if(!r.ok) throw new Error('HTTP_' + r.status);
          return r.json();
        })
        .then(function(data){
          var arr = [];
          if(data && typeof data === 'object'){
            Object.keys(data).forEach(function(k){
              var v = data[k] || {};
              /* 저장목록으로 이동된 항목은 알림 대상에서 제외 */
              if(v.archived) return;
              arr.push({
                id: k,
                title:  v.title  || '',
                dept:   v.dept   || '',
                date:   v.date   || '',
                status: v.status || '',
                author: v.author || ''
              });
            });
          }
          chrome.storage.local.set({ lastPollAt: Date.now(), lastError: '' });
          processIssues(arr, 'poll');
          resolve();
        })
        .catch(function(e){
          var code = (e && e.message) || 'ERR';
          chrome.storage.local.set({ lastError: code, lastPollAt: Date.now() });
          /* 토큰 만료(401) 시 토큰만 지움 — 사용자가 대시보드 한 번 열면 갱신됨 */
          if(/^HTTP_(401|403)$/.test(code)){
            chrome.storage.local.remove(['idToken','tokenAt']);
          }
          resolve();
        });
    });
  });
}

/* 신규 감지 + 배지/알림 갱신 */
function processIssues(arr, source){
  chrome.storage.local.get(['knownIds','unseenIds','initialized'], function(s){
    var known = s.knownIds || {};
    var unseen = s.unseenIds || {};
    var firstRun = !s.initialized;

    var newOnes = [];
    arr.forEach(function(i){
      if(!known[i.id]){
        known[i.id] = 1;
        if(!firstRun){
          unseen[i.id] = true;
          newOnes.push(i);
        }
      }
    });

    /* 삭제된 항목 정리 */
    var currentIds = {};
    arr.forEach(function(i){ currentIds[i.id] = true; });
    Object.keys(known).forEach(function(id){ if(!currentIds[id]) delete known[id]; });
    Object.keys(unseen).forEach(function(id){ if(!currentIds[id]) delete unseen[id]; });

    chrome.storage.local.set({
      knownIds: known,
      unseenIds: unseen,
      allIssues: arr,
      initialized: true,
      lastSource: source
    }, function(){
      updateBadge();
      if(newOnes.length) notifyNew(newOnes);
    });
  });
}

function updateBadge(){
  chrome.storage.local.get(['unseenIds'], function(s){
    var n = Object.keys(s.unseenIds || {}).length;
    var txt = n <= 0 ? '' : (n > 99 ? '99+' : String(n));
    try { chrome.action.setBadgeText({ text: txt }); } catch(_){}
  });
}

function notifyNew(items){
  var title = items.length === 1
    ? '🚨 신규 현안이슈'
    : '🚨 신규 현안이슈 ' + items.length + '건';
  var first = items[0] || {};
  var msg = items.length === 1
    ? '[' + (first.dept || '-') + '] ' + (first.title || '(제목 없음)')
    : '[' + (first.dept || '-') + '] ' + (first.title || '') + ' 외 ' + (items.length-1) + '건';
  try{
    chrome.notifications.create('newIssue_' + Date.now(), {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: title,
      message: msg,
      priority: 2,
      requireInteraction: false
    });
  }catch(_){}
}

function markAllSeen(){
  return new Promise(function(resolve){
    chrome.storage.local.set({ unseenIds: {} }, function(){
      updateBadge();
      resolve();
    });
  });
}

chrome.notifications.onClicked.addListener(function(id){
  try { chrome.notifications.clear(id); } catch(_){}
  openDashboard();
});

chrome.action.onClicked.addListener(function(){
  /* popup이 default로 열리므로 보통 여기는 호출되지 않음 */
  openDashboard();
});

function openDashboard(){
  chrome.tabs.query({ url: DASHBOARD_URL + '*' }, function(tabs){
    if(tabs && tabs[0]){
      chrome.tabs.update(tabs[0].id, { active: true });
      try { chrome.windows.update(tabs[0].windowId, { focused: true }); } catch(_){}
    } else {
      chrome.tabs.create({ url: DASHBOARD_URL });
    }
  });
}

/* 부팅 직후 1회 즉시 폴링 */
setTimeout(pollOnce, 1500);
