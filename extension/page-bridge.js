/* MAIN world — 대시보드 페이지의 firebase/window.issues 직접 접근
   isolated content.js 로는 page context 객체에 접근할 수 없어
   manifest에 "world":"MAIN" 으로 별도 주입한다. */
(function(){
  var TAG = '__seogooExt';

  function safe(o){
    return {
      id:     o && o.id    ? String(o.id)    : '',
      title:  o && o.title ? String(o.title) : '',
      dept:   o && o.dept  ? String(o.dept)  : '',
      date:   o && o.date  ? String(o.date)  : '',
      status: o && o.status? String(o.status): '',
      author: o && o.author? String(o.author): ''
    };
  }

  function pushIssues(){
    try{
      var arr = Array.isArray(window.issues) ? window.issues : [];
      /* 저장목록(archived) 으로 이동된 항목은 알림 대상에서 제외 */
      var safeArr = arr.filter(function(i){ return !(i && i.archived); }).map(safe);
      window.postMessage({__tag:TAG, type:'issues', issues: safeArr}, '*');
    }catch(e){}
  }

  function pushToken(){
    try{
      var fb = window.firebase;
      if(!fb || !fb.auth) return;
      var u = fb.auth().currentUser;
      if(!u) return;
      u.getIdToken().then(function(token){
        if(!token) return;
        window.postMessage({
          __tag: TAG,
          type:'token',
          token: token,
          uid:   u.uid || '',
          email: u.email || ''
        }, '*');
      }).catch(function(){});
    }catch(e){}
  }

  function pulse(){ pushToken(); pushIssues(); }

  /* firebase 초기화 대기 후 첫 전송 */
  setTimeout(pulse, 2500);
  setTimeout(pulse, 6000);
  setTimeout(pulse, 12000);
  setInterval(pulse, 60000);

  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState==='visible') pulse();
  });

  /* 디버그/수동 호출용 */
  try { window.__seogooExtPing = pulse; } catch(_){}
})();
