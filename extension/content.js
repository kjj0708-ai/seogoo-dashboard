/* ISOLATED world — page-bridge.js가 postMessage 한 내용을
   chrome.runtime.sendMessage 로 background service worker 에 중계한다. */
(function(){
  var TAG = '__seogooExt';

  window.addEventListener('message', function(e){
    if(e.source !== window) return;
    var d = e.data;
    if(!d || d.__tag !== TAG) return;
    if(d.type !== 'token' && d.type !== 'issues') return;
    try{
      chrome.runtime.sendMessage(d, function(){
        /* lastError 무시 (popup 닫힘 등) */
        void chrome.runtime.lastError;
      });
    }catch(_){}
  });
})();
