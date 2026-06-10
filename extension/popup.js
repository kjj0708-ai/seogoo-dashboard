/* 팝업 — background에서 상태 받아서 렌더 */
const DASHBOARD_URL = 'https://dashboard.choshg.com/';

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];
  });
}

function fmtDate(d){
  if(!d) return '';
  var dt = new Date(d);
  if(isNaN(dt.getTime())) return String(d);
  var pad = function(n){ return n<10?'0'+n:''+n; };
  return (dt.getMonth()+1)+'/'+dt.getDate()+' '+pad(dt.getHours())+':'+pad(dt.getMinutes());
}

function fmtAgo(ts){
  if(!ts) return '아직 갱신 안됨';
  var diff = Math.max(0, (Date.now() - ts) / 1000);
  if(diff < 60)   return Math.floor(diff)+'초 전';
  if(diff < 3600) return Math.floor(diff/60)+'분 전';
  if(diff < 86400)return Math.floor(diff/3600)+'시간 전';
  return Math.floor(diff/86400)+'일 전';
}

function statusLabel(st){
  return ({ready:'착수전', proc:'진행중', done:'완료'})[st] || st || '';
}

function render(){
  chrome.runtime.sendMessage({type:'getState'}, function(s){
    if(chrome.runtime.lastError){ s = {}; }
    s = s || {};
    var unseen = s.unseenIds || {};
    var all = (s.allIssues || []).slice();

    /* 최신순 정렬 (date desc) */
    all.sort(function(a,b){
      var da = new Date(a.date || 0).getTime() || 0;
      var db = new Date(b.date || 0).getTime() || 0;
      return db - da;
    });

    var nUnseen = Object.keys(unseen).length;
    document.getElementById('cnt').textContent = '총 '+all.length+'건 · 신규 '+nUnseen+'건';
    document.getElementById('ft').textContent  = '폴링: '+fmtAgo(s.lastPollAt);
    document.getElementById('ft2').textContent = s.tokenEmail ? '🔑 '+s.tokenEmail : '';

    /* 경고 영역 */
    var warn = document.getElementById('warn');
    var msg = '';
    if(!s.tokenAt){
      msg = '⚠️ 로그인 토큰 없음 — <b>대시보드를 한 번 열어주세요</b>. 그 후 자동으로 동기화됩니다.';
    } else if(s.lastError === 'NO_TOKEN'){
      msg = '⚠️ 토큰이 만료되었습니다. <b>대시보드를 다시 열어주세요</b>.';
    } else if(s.lastError && /^HTTP_(401|403)$/.test(s.lastError)){
      msg = '⚠️ 인증 실패 (' + s.lastError + ') — 대시보드 재로그인이 필요합니다.';
    } else if(s.lastError && s.lastError !== ''){
      msg = '⚠️ 동기화 오류: ' + esc(s.lastError);
    }
    if(msg){ warn.innerHTML = msg; warn.style.display = 'block'; }
    else { warn.style.display = 'none'; }

    var list = document.getElementById('list');
    if(!all.length){
      list.innerHTML = '<div class="empty">표시할 현안이슈가 없습니다.<br><span style="font-size:11px">대시보드 접속 후 자동 동기화됩니다.</span></div>';
      return;
    }

    list.innerHTML = all.slice(0, 50).map(function(i){
      var isNew = !!unseen[i.id];
      return '<div class="row'+(isNew?' new':'')+'">'
        + '<div>'
          + (isNew ? '<span class="b">NEW</span>' : '')
          + '<span class="t">' + esc(i.title || '(제목 없음)') + '</span>'
          + (i.status ? '<span class="st">' + esc(statusLabel(i.status)) + '</span>' : '')
        + '</div>'
        + '<div class="m">'
          + esc(i.dept || '-')
          + (i.author ? ' · ' + esc(i.author) : '')
          + (i.date ? ' · ' + esc(fmtDate(i.date)) : '')
        + '</div>'
        + '</div>';
    }).join('');
  });
}

document.getElementById('btnOpen').addEventListener('click', function(){
  chrome.tabs.query({ url: DASHBOARD_URL + '*' }, function(tabs){
    if(tabs && tabs[0]){
      chrome.tabs.update(tabs[0].id, { active: true });
      try { chrome.windows.update(tabs[0].windowId, { focused: true }); } catch(_){}
    } else {
      chrome.tabs.create({ url: DASHBOARD_URL });
    }
    window.close();
  });
});

document.getElementById('btnSeen').addEventListener('click', function(){
  chrome.runtime.sendMessage({type:'markSeen'}, function(){ render(); });
});

document.getElementById('btnRefresh').addEventListener('click', function(){
  var btn = document.getElementById('btnRefresh');
  btn.disabled = true; btn.textContent = '⏳';
  chrome.runtime.sendMessage({type:'pollNow'}, function(){
    btn.disabled = false; btn.textContent = '↻';
    render();
  });
});

render();
setInterval(render, 3000);
