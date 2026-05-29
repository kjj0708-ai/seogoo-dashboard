
var ADMIN_PW='0708',STAFF_PW='1234';
var FB={apiKey:"AIzaSyDDsAzrYojzbVXyaPilfF3Mj57pmat8JVU",authDomain:"bureau-dashboard.firebaseapp.com",databaseURL:"https://bureau-dashboard-default-rtdb.firebaseio.com",projectId:"bureau-dashboard",storageBucket:"bureau-dashboard.firebasestorage.app",messagingSenderId:"865956736976",appId:"1:865956736976:web:423c2add3bc57737c213d5"};
var ORG={'도로과':['건설행정팀','도로팀','보도관리팀','자전거도시팀','도로조명팀'],'도시계획과':['도시행정팀','도시개발팀','도시계획팀','GB관리팀'],'건축과':['건축행정팀','건축팀','건축정보팀','공공시설팀','건축안전센터팀'],'주택과':['주택1팀','주택2팀','재개발재건축팀','주택정비팀'],'주택관리과':['주택지원팀','주거복지팀','주택민원팀'],'도시재생경관과':['도시재생전략팀','도시재생사업팀','개발행위허가팀','광고물관리팀','도시경관팀']};
var GCD=[];var GCAL_API_KEY=localStorage.getItem('gcal_key')||'AIzaSyDU0y_Jg9YW-ybmlRSXMFNi6PJnaUe1ROc';var GCAL_CAL_ID=localStorage.getItem('gcal_calid')||'';
var currentUser=null,db=null,issues=[],reports=[],events=[],instruction=null,archives={},archiveWk='';
var calY,calM,editIssId=null,editRepId=null,pendingPhoto=null,confCb=null,statusFilter='';var _curReps=[],_curWkLbl='';
(function(){try{firebase.initializeApp(FB);db=firebase.database();var _fbOK=false;function _fbErr(e){if(_fbOK)return;_fbOK=true;console.warn('FB err',e);setSyncOK(false);db=null;loadLS();if(currentUser){renderIssues();renderDeptGrid();renderCal();renderInstr();}}db.ref('issues').on('value',function(s){if(!_fbOK){_fbOK=true;setSyncOK(true);}issues=s.val()?Object.entries(s.val()).map(function(e){return Object.assign({id:e[0]},e[1]);}):[];renderIssues();},_fbErr);db.ref('reports').on('value',function(s){reports=s.val()?Object.entries(s.val()).map(function(e){return Object.assign({id:e[0]},e[1]);}):[];renderDeptGrid();},_fbErr);db.ref('events').on('value',function(s){events=s.val()?Object.entries(s.val()).map(function(e){return Object.assign({id:e[0]},e[1]);}):[];renderCal();},_fbErr);db.ref('instruction').on('value',function(s){instruction=s.val();renderInstr();},_fbErr);db.ref('reports_archive').on('value',function(s){archives=s.val()||{};renderArchiveSel();},_fbErr);}catch(e){console.warn('FB fail');setSyncOK(false);loadLS();}})();
function loadLS(){issues=JSON.parse(localStorage.getItem('bu_iss')||'[]');reports=JSON.parse(localStorage.getItem('bu_rep')||'[]');events=JSON.parse(localStorage.getItem('bu_ev')||'[]');instruction=JSON.parse(localStorage.getItem('bu_instr')||'null');}
function saveLS(){localStorage.setItem('bu_iss',JSON.stringify(issues));localStorage.setItem('bu_rep',JSON.stringify(reports));localStorage.setItem('bu_ev',JSON.stringify(events));localStorage.setItem('bu_instr',JSON.stringify(instruction));}
function dbSet(p,d){if(db)db.ref(p).set(d);else saveLS();}
function dbPush(p,d){if(db)return db.ref(p).push(d).then(function(r){return r.key;});var id=Date.now().toString();d.id=id;saveLS();return Promise.resolve(id);}
function dbRemove(p){if(db)db.ref(p).remove();else saveLS();}
function switchLoginTab(t){document.getElementById('tabA').classList.toggle('active',t==='admin');document.getElementById('tabS').classList.toggle('active',t==='staff');document.getElementById('formAdmin').style.display=t==='admin'?'block':'none';document.getElementById('formStaff').style.display=t==='staff'?'block':'none';document.getElementById('lerr').style.display='none';}
function doAdminLogin(){if(document.getElementById('adminPw').value===ADMIN_PW){currentUser={type:'admin',name:'국장',dept:'전체'};enterApp();}else showLErr('비밀번호가 올바르지 않습니다.');}
function doStaffLogin(){var n=document.getElementById('staffName').value.trim(),d=document.getElementById('staffDept').value,p=document.getElementById('staffPw').value;if(!n||!d){showLErr('이름과 소속 과를 선택해주세요.');return;}if(p===STAFF_PW){currentUser={type:'staff',name:n,dept:d};enterApp();}else showLErr('비밀번호가 올바르지 않습니다.');}
function showLErr(m){var e=document.getElementById('lerr');e.textContent=m;e.style.display='block';}
function enterApp(){document.getElementById('loginScreen').style.display='none';document.getElementById('app').style.display='flex';document.getElementById('ubadge').textContent=currentUser.type==='admin'?'👑 국장 (관리자)':currentUser.name+' ('+currentUser.dept+')';if(currentUser.type==='admin'){document.getElementById('adminInstrPnl').style.display='block';document.getElementById('adminCalPnl').style.display='block';}var n=new Date();calY=n.getFullYear();calM=n.getMonth();renderInstr();renderIssues();renderDeptGrid();renderCal();updateWk();renderGcalSide();checkWednesdayArchive();if(currentUser.type==='admin'){document.getElementById('adminGcalPnl').style.display='block';var ce=document.getElementById('gcalClientId');if(ce&&GCAL_CLIENT_ID)ce.value=GCAL_CLIENT_ID;}fetchGCal();if(!db)loadLS();}
function doLogout(){currentUser=null;document.getElementById('app').style.display='none';document.getElementById('loginScreen').style.display='flex';document.getElementById('adminPw').value='';document.getElementById('staffPw').value='';document.getElementById('adminInstrPnl').style.display='none';document.getElementById('adminCalPnl').style.display='none';document.getElementById('adminGcalPnl').style.display='none';document.getElementById('lerr').style.display='none';}
function setSyncOK(ok){var d=document.getElementById('sdot'),t=document.getElementById('stxt');if(!d)return;if(ok){d.classList.remove('off');t.textContent='실시간 연결';}else{d.classList.add('off');t.textContent='오프라인(로컬)';}}
function switchTab(t,btn){document.querySelectorAll('.tBtn').forEach(function(b){b.classList.remove('active');});document.querySelectorAll('.tPanel').forEach(function(p){p.classList.remove('active');});btn.classList.add('active');document.getElementById('panel-'+t).classList.add('active');if(t==='calendar')renderCal();}
function saveInstr(){var tx=document.getElementById('instrInput').value.trim();if(!tx)return;var data={text:tx,date:new Date().toISOString()};dbSet('instruction',data);instruction=data;document.getElementById('instrEditBox').style.display='none';renderInstr();}
function newInstr(){document.getElementById('instrInput').value='';document.getElementById('instrEditBox').style.display='block';document.getElementById('instrInput').focus();}
function editInstr(){document.getElementById('instrInput').value=instruction?instruction.text:'';document.getElementById('instrEditBox').style.display='block';document.getElementById('instrInput').focus();}
function cancelInstr(){document.getElementById('instrEditBox').style.display='none';}
function deleteInstr(){showConf('국장 지시사항을 삭제하시겠습니까?',function(){dbRemove('instruction');instruction=null;renderInstr();});}
function renderInstr(){var box=document.getElementById('instrDisplay');if(!box)return;var isAdmin=currentUser&&currentUser.type==='admin';if(!instruction||!instruction.text){box.innerHTML='';if(isAdmin){document.getElementById('instrEditBtn').style.display='none';document.getElementById('instrDelBtn').style.display='none';}return;}box.innerHTML='<div class="instrBox"><div class="ico">📢</div><div style="flex:1"><h3>국장 지시사항</h3><p style="white-space:pre-wrap">'+esc(instruction.text)+'</p><div class="instrDate">'+fmtD(new Date(instruction.date))+'</div></div></div>';if(isAdmin){document.getElementById('instrEditBtn').style.display='';document.getElementById('instrDelBtn').style.display='';}}
function onIssStatusChange(){var st=document.getElementById('issStatus').value;var pr=document.getElementById('progressRow');pr.style.display=st==='proc'?'block':'none';if(st==='done'){document.getElementById('issProgress').value=100;document.getElementById('issProgressVal').textContent='100%';document.getElementById('issProgressBar').style.width='100%';}}
function syncProgressBar(){var v=document.getElementById('issProgress').value;document.getElementById('issProgressVal').textContent=v+'%';document.getElementById('issProgressBar').style.width=v+'%';}
document.addEventListener('input',function(e){if(e.target&&e.target.id==='issProgress'){syncProgressBar();if(parseInt(e.target.value)===100){document.getElementById('issStatus').value='done';document.getElementById('progressRow').style.display='none';}}});
function setFilter(s){statusFilter=s;renderIssues();}
function openIssModal(id){editIssId=id||null;pendingPhoto=null;document.getElementById('photoPrev').innerHTML='';if(id){var iss=issues.find(function(i){return i.id===id;});document.getElementById('issModalT').textContent='이슈 수정';document.getElementById('issTitle').value=iss.title||'';document.getElementById('issContent').value=iss.content||'';document.getElementById('issStatus').value=iss.status||'proc';document.getElementById('issDept').value=iss.dept||'도로과';var prog=parseInt(iss.progress)||0;document.getElementById('issProgress').value=prog;document.getElementById('issProgressVal').textContent=prog+'%';document.getElementById('issProgressBar').style.width=prog+'%';document.getElementById('progressRow').style.display=(iss.status==='proc')?'block':'none';if(iss.photo){document.getElementById('photoPrev').innerHTML='<img src="'+iss.photo+'" style="max-width:100%;border-radius:6px">';pendingPhoto=iss.photo;}}else{document.getElementById('issModalT').textContent='이슈 등록';document.getElementById('issTitle').value='';document.getElementById('issContent').value='';document.getElementById('issStatus').value='proc';document.getElementById('issProgress').value=0;document.getElementById('issProgressVal').textContent='0%';document.getElementById('issProgressBar').style.width='0%';document.getElementById('progressRow').style.display='block';if(currentUser&&currentUser.type==='staff')document.getElementById('issDept').value=currentUser.dept;}document.getElementById('issModal').style.display='flex';}
function closeIssModal(){document.getElementById('issModal').style.display='none';}
function saveIssue(){var title=document.getElementById('issTitle').value.trim();if(!title){alert('제목을 입력하세요.');return;}var dept=document.getElementById('issDept').value;if(currentUser&&currentUser.type==='staff'&&dept!==currentUser.dept){alert('본인 소속 과만 등록 가능합니다.');return;}var st=document.getElementById('issStatus').value;var prog=parseInt(document.getElementById('issProgress').value)||0;if(prog===100)st='done';var data={title:title,content:document.getElementById('issContent').value.trim(),status:st,progress:prog,dept:dept,photo:pendingPhoto||null,date:new Date().toISOString(),author:currentUser?currentUser.name:''};if(editIssId){dbSet('issues/'+editIssId,Object.assign({},data,{id:editIssId}));if(!db){issues=issues.map(function(i){return i.id===editIssId?Object.assign({},data,{id:editIssId}):i;});renderIssues();saveLS();}}else{dbPush('issues',data);if(!db){data.id=Date.now().toString();issues.push(data);renderIssues();saveLS();}}closeIssModal();}
function chgStatus(id,st){var prog=st==='done'?100:(st==='proc'?50:0);dbSet('issues/'+id+'/status',st);dbSet('issues/'+id+'/progress',prog);if(!db){issues=issues.map(function(i){return i.id===id?Object.assign({},i,{status:st,progress:prog}):i;});renderIssues();saveLS();}}
function deleteIssue(id){showConf('이 이슈를 삭제하시겠습니까?',function(){dbRemove('issues/'+id);if(!db){issues=issues.filter(function(i){return i.id!==id;});renderIssues();saveLS();}});}
function canEditIss(iss){if(!currentUser)return false;if(currentUser.type==='admin')return true;return currentUser.dept===iss.dept;}
function renderIssues(){
  var sa=document.getElementById('statAll'),sp=document.getElementById('statProc'),sd=document.getElementById('statDone'),sap=document.getElementById('statAvgProg');
  var procList=issues.filter(function(i){return i.status==='proc';});
  var doneList=issues.filter(function(i){return i.status==='done';});
  if(sa){sa.textContent=issues.length;sp.textContent=procList.length;sd.textContent=doneList.length;
    var allProg=issues.map(function(i){return parseInt(i.progress)||0;});
    var avg=issues.length?Math.round(allProg.reduce(function(a,b){return a+b;},0)/issues.length):0;
    if(sap)sap.textContent=avg+'%';}
  var dF=document.getElementById('filterDept')?document.getElementById('filterDept').value:'';
  var f=issues.slice();
  if(statusFilter)f=f.filter(function(i){return i.status===statusFilter;});
  if(dF)f=f.filter(function(i){return i.dept===dF;});
  var ORD={proc:0,done:1};
  f.sort(function(a,b){var o=(ORD[a.status]||0)-(ORD[b.status]||0);return o!==0?o:new Date(b.date)-new Date(a.date);});
  var list=document.getElementById('issueList');if(!list)return;
  if(!f.length){list.innerHTML='<div style="text-align:center;color:var(--tx3);padding:40px">등록된 이슈가 없습니다.</div>';return;}
  var BL={proc:'bProc',done:'bDone'},BT={proc:'진행중',done:'완료'};
  list.innerHTML=f.map(function(iss){
    var ce=canEditIss(iss);
    var prog=parseInt(iss.progress)||0;
    var barColor=prog===100?'#22c55e':prog>=70?'#3b82f6':prog>=30?'#f59e0b':'#94a3b8';
    var progHTML='<div style="margin-top:10px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--tx3);margin-bottom:4px"><span>진행률</span><span style="font-weight:700;color:'+barColor+'">'+prog+'%</span></div><div style="background:#e5e7eb;border-radius:20px;height:8px;overflow:hidden"><div style="height:100%;width:'+prog+'%;background:'+barColor+';border-radius:20px;transition:width .3s"></div></div></div>';
    var editId=iss.id.replace(/'/g,"\\'");
    return '<div class="issItem '+(iss.status||'proc')+'" id="iss-'+iss.id+'">'
      +'<div class="issTop"><div>'
      +'<div class="issTitle">'+esc(iss.title)+'</div>'
      +'<div class="issMeta"><span class="badge '+(BL[iss.status]||'bProc')+'">'+(BT[iss.status]||'진행중')+'</span>'
      +'<span class="badge bDept">'+esc(iss.dept||'')+'</span>'
      +'<span style="font-size:12px;color:var(--tx3)">'+esc(iss.author||'')+' · '+fmtD(new Date(iss.date))+'</span>'
      +'</div></div>'
      +(ce?'<div class="issActions">'
        +'<button class="btn btnG sm iss-edit" data-id="'+iss.id+'">수정</button>'
        +'<button class="btn btnD sm iss-del" data-id="'+iss.id+'">삭제</button>'
        +'</div>':'')
      +'</div>'
      +(iss.content?'<div class="issContent">'+esc(iss.content)+'</div>':'')
      +progHTML
      +(ce&&iss.status!=='done'?'<div class="statusBtns" style="margin-top:8px">'
        +'<button class="sBtn sBtnP'+(iss.status==='proc'?' cur':'')+'" onclick="chgStatus(\''+editId+'\',\'proc\')">진행중</button>'
        +'<button class="sBtn sBtnD" onclick="chgStatus(\''+editId+'\',\'done\')">완료처리</button>'
        +'</div>':'')
      +(iss.photo?'<img class="issPhoto" onclick="showPhotoById(this)" data-id="'+iss.id+'" src="'+iss.photo+'" alt="사진">':'')
      +'</div>';
  }).join('');
  f.forEach(function(i){if(i.photo)window['_ph_'+i.id]=i.photo;});
}
function openIssModalBtn(btn){var id=btn.getAttribute('data-id');openIssModal(id);}
function deleteIssueById(btn){var id=btn.getAttribute('data-id');deleteIssue(id);}
function showPhotoById(img){var id=img.getAttribute('data-id');showPhoto(id);}
document.addEventListener('click',function(e){
  var t=e.target;
  if(t.classList.contains('iss-edit')){openIssModal(t.getAttribute('data-id'));return;}
  if(t.classList.contains('iss-del')){deleteIssue(t.getAttribute('data-id'));return;}
  if(t.classList.contains('rep-edit')){openRepModal(t.getAttribute('data-id'));return;}
  if(t.classList.contains('rep-del')){deleteReport(t.getAttribute('data-id'));return;}
  if(t.classList.contains('issPhoto')&&t.getAttribute('data-id')){showPhoto(t.getAttribute('data-id'));return;}
});
function showPhoto(id){var s=window['_ph_'+id];if(!s)return;var img=document.getElementById('photoModalImg');img.src=s;img.style.transform='scale(1)';_pmScale=1;document.getElementById('photoModal').style.display='flex';}
function closePhotoModal(){document.getElementById('photoModal').style.display='none';}
var _pmScale=1,_pmDist=0;
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var modal=document.getElementById('photoModal');
    var img=document.getElementById('photoModalImg');
    modal.addEventListener('click',function(e){if(e.target===modal)closePhotoModal();});
    modal.addEventListener('touchstart',function(e){if(e.touches.length===2){_pmDist=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);}},{passive:true});
    modal.addEventListener('touchmove',function(e){if(e.touches.length===2){e.preventDefault();var nd=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);_pmScale=Math.min(5,Math.max(0.5,_pmScale*nd/_pmDist));img.style.transform='scale('+_pmScale+')';_pmDist=nd;}},{passive:false});
    modal.addEventListener('dblclick',function(e){if(e.target===img){_pmScale=_pmScale>1.5?1:2.5;img.style.transform='scale('+_pmScale+')';}});
  });
})();
function handlePhoto(input){var fi=input.files[0];if(!fi)return;var rd=new FileReader();rd.onload=function(e){var img=new Image();img.onload=function(){var c=document.createElement('canvas'),w=img.width,h=img.height,M=1200;if(w>M||h>M){if(w>h){h=Math.round(h*M/w);w=M;}else{w=Math.round(w*M/h);h=M;}}c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);var q=0.9,d;do{d=c.toDataURL('image/jpeg',q);q-=0.05;}while(d.length>500*1024&&q>0.3);pendingPhoto=d;document.getElementById('photoPrev').innerHTML='<img src="'+d+'" style="max-width:100%;border-radius:6px">';};img.src=e.target.result;};rd.readAsDataURL(fi);}
function updateTeamSel(){var d=document.getElementById('repDept').value;document.getElementById('repTeam').innerHTML=(ORG[d]||[]).map(function(t){return '<option>'+t+'</option>';}).join('');}
function openRepModal(id){editRepId=id||null;if(id){var r=reports.find(function(x){return x.id===id;});document.getElementById('repModalT').textContent='주간보고 수정';document.getElementById('repThis').value=r.thisWeek||'';document.getElementById('repNext').value=r.nextWeek||'';document.getElementById('repDept').value=r.dept||'도로과';updateTeamSel();document.getElementById('repTeam').value=r.team||'';}else{document.getElementById('repModalT').textContent='주간보고 등록';document.getElementById('repThis').value='';document.getElementById('repNext').value='';if(currentUser&&currentUser.type==='staff'){document.getElementById('repDept').value=currentUser.dept;document.getElementById('repDept').disabled=true;}else{document.getElementById('repDept').disabled=false;}updateTeamSel();}document.getElementById('repModal').style.display='flex';}
function closeRepModal(){document.getElementById('repModal').style.display='none';}
function saveReport(){var dept=document.getElementById('repDept').value;if(currentUser&&currentUser.type==='staff'&&dept!==currentUser.dept){alert('본인 소속 과만 등록 가능합니다.');return;}var thisW=document.getElementById('repThis').value.trim();var nextW=document.getElementById('repNext').value.trim();if(!thisW&&!nextW){alert('이번주 실적 또는 다음주 계획을 입력하세요.');return;}var data={thisWeek:thisW,nextWeek:nextW,dept:dept,team:document.getElementById('repTeam').value,weekLabel:getWkLbl(new Date()),date:new Date().toISOString(),author:currentUser?currentUser.name:''};if(editRepId){dbSet('reports/'+editRepId,Object.assign({},data,{id:editRepId}));if(!db){reports=reports.map(function(r){return r.id===editRepId?Object.assign({},data,{id:editRepId}):r;});renderDeptGrid();saveLS();}}else{dbPush('reports',data);if(!db){data.id=Date.now().toString();reports.push(data);renderDeptGrid();saveLS();}}closeRepModal();}
function deleteReport(id){showConf('이 보고를 삭제하시겠습니까?',function(){dbRemove('reports/'+id);if(!db){reports=reports.filter(function(r){return r.id!==id;});renderDeptGrid();saveLS();}});}
function getWkLbl(d){var y=d.getFullYear()%100,m=d.getMonth()+1,day=d.getDate(),w=Math.ceil((day+new Date(d.getFullYear(),d.getMonth(),1).getDay())/7);return y+'년 '+m+'월 '+w+'째주';}
function updateWk(){var e=document.getElementById('wkDisp');if(e)e.textContent=getWkLbl(new Date());}
function getWkKey(d){var y=d.getFullYear(),m=d.getMonth()+1,day=d.getDate(),w=Math.ceil((day+new Date(d.getFullYear(),d.getMonth(),1).getDay())/7);return y+'_'+String(m).padStart(2,'0')+'_w'+w;}
function checkWednesdayArchive(){
  var now=new Date();
  if(now.getDay()!==3||!db||!reports.length)return;
  var todayKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
  if(localStorage.getItem('bu_lastArchive')===todayKey)return;
  var lastWed=new Date(now);lastWed.setDate(now.getDate()-7);
  var wkKey=getWkKey(lastWed);
  db.ref('reports_archive/'+wkKey).once('value',function(s){
    if(!s.val()){
      var wkLbl=getWkLbl(lastWed);
      var archData={weekLabel:wkLbl,archivedAt:now.toISOString(),items:{}};
      reports.forEach(function(r){archData.items[r.id]=r;});
      db.ref('reports_archive/'+wkKey).set(archData).then(function(){
        db.ref('reports').remove();
        localStorage.setItem('bu_lastArchive',todayKey);
        alert('지난 주간보고('+wkLbl+')가 아카이브로 이동되었습니다.');
      });
    } else {
      localStorage.setItem('bu_lastArchive',todayKey);
    }
  });
}
function renderArchiveSel(){
  var sel=document.getElementById('archiveSel');if(!sel)return;
  var keys=Object.keys(archives).sort().reverse();
  sel.innerHTML='<option value="">현재 주간보고</option>'+keys.map(function(k){
    var lbl=archives[k]?archives[k].weekLabel||k:k;
    return '<option value="'+k+'">'+lbl+'</option>';
  }).join('');
}
function onArchiveSelChange(){
  var sel=document.getElementById('archiveSel');if(!sel)return;
  archiveWk=sel.value;
  if(archiveWk){
    var arc=archives[archiveWk];
    var reps=arc&&arc.items?Object.values(arc.items):[];
    renderDeptGridData(reps,true);
    document.getElementById('wkDisp').textContent=arc?arc.weekLabel:'';
  } else {
    archiveWk='';
    updateWk();
    renderDeptGrid();
  }
}
function renderDeptGrid(){renderDeptGridData(reports,false);}
function downloadDeptReport(dept){
  var dReps=_curReps.filter(function(r){return r.dept===dept;});
  var teams=ORG[dept]||[];
  var wkLbl=_curWkLbl||getWkLbl(new Date());
  var rows=[];
  teams.forEach(function(team){
    var tReps=dReps.filter(function(r){return r.team===team;});
    if(tReps.length===0){rows.push({team:team,thisWeek:'',nextWeek:'',firstTeam:true,teamSpan:1});}
    else{tReps.forEach(function(r,i){rows.push({team:team,thisWeek:r.thisWeek||'',nextWeek:r.nextWeek||'',firstTeam:i===0,teamSpan:i===0?tReps.length:0});});}
  });
  var totalRows=rows.length||1;
  var tdSt='border:1px solid #999;padding:8px 10px;vertical-align:top;font-size:13px;line-height:1.6;white-space:pre-wrap;word-break:break-word;';
  var thSt='border:1px solid #999;padding:8px 10px;background:#dce6f1;font-weight:700;font-size:13px;text-align:center;';
  var trs=rows.map(function(row,idx){
    var deptTd=idx===0?'<td rowspan="'+totalRows+'" style="'+tdSt+'text-align:center;font-weight:700;background:#eaf0fb;">'+dept+'</td>':'';
    var teamTd=row.firstTeam?'<td rowspan="'+row.teamSpan+'" style="'+tdSt+'text-align:center;background:#f5f8ff;">'+row.team+'</td>':'';
    function toDoc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');}
    return '<tr>'+deptTd+teamTd+'<td style="'+tdSt+'">'+toDoc(row.thisWeek)+'</td><td style="'+tdSt+'">'+toDoc(row.nextWeek)+'</td></tr>';
  }).join('');
  if(!trs)trs='<tr><td style="'+tdSt+'text-align:center;" colspan="4">등록된 보고가 없습니다.</td></tr>';
  var html="<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>"
    +"<head><meta charset='UTF-8'>"
    +"<meta name=ProgId content=Word.Document>"
    +"<meta name=Generator content='Microsoft Word 15'>"
    +"<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->"
    +"<style>"
    +"@page{size:A4 landscape;margin:2cm;}"
    +"body{font-family:'맑은 고딕','Noto Sans KR',sans-serif;font-size:11pt;}"
    +"h2{font-size:14pt;font-weight:700;margin-bottom:10pt;}"
    +"table{border-collapse:collapse;width:100%;}"
    +"th,td{border:1px solid #000;padding:6pt 8pt;vertical-align:top;font-size:10pt;line-height:1.5;}"
    +"th{background:#dce6f1;font-weight:700;text-align:center;}"
    +"td{white-space:pre-wrap;word-break:break-word;}"
    +".dept-cell{text-align:center;font-weight:700;background:#eaf0fb;}"
    +".team-cell{text-align:center;background:#f5f8ff;}"
    +"</style></head><body>"
    +"<h2>"+dept+" 주간업무보고 <span style='font-size:10pt;font-weight:400;color:#555;'>("+wkLbl+")</span></h2>"
    +"<table><thead><tr>"
    +"<th style='width:70pt;'>과</th>"
    +"<th style='width:90pt;'>팀</th>"
    +"<th>이번주 실적/현안</th>"
    +"<th>다음주 계획</th>"
    +"</tr></thead><tbody>"+trs+"</tbody></table>"
    +"</body></html>";
  var blob=new Blob(['\ufeff'+html],{type:'application/msword;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=dept+'_주간보고_'+wkLbl+'.doc';
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},100);
}
function renderDeptGridData(allReps,isArchive){_curReps=allReps;var wkEl=document.getElementById('wkDisp');_curWkLbl=wkEl?wkEl.textContent:getWkLbl(new Date());var grid=document.getElementById('deptGrid');if(!grid)return;grid.innerHTML=Object.keys(ORG).map(function(dept){var teams=ORG[dept];return '<div class="dCard"><div class="dCardH" onclick="togDept(this)"><h3>📂 '+dept+'</h3><div style="display:flex;align-items:center;gap:6px;">'+(currentUser?'<button class="btn btnG sm" onclick="event.stopPropagation();downloadDeptReport(\''+dept+'\')" style="font-size:11px;padding:3px 8px;white-space:nowrap;color:#fff;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);">📥 저장</button>':'')+'<span class="togIco open">▼</span></div></div><div class="teamList">'+teams.map(function(team){var reps=allReps.filter(function(r){return r.dept===dept&&r.team===team;});var ce=!isArchive&&currentUser&&(currentUser.type==='admin'||currentUser.dept===dept);return '<div class="teamItem"><div class="teamH" onclick="togTeam(this)"><span class="teamNm">▼ '+team+' <span class="tCnt">'+reps.length+'</span></span></div><div class="teamReps">'+(reps.length?reps.map(function(r){return '<div class="repEntry"><div class="repTop"><div class="repTitle">'+esc(r.team)+' — '+esc(r.weekLabel||'')+'</div>'+(ce?'<div style="display:flex;gap:4px"><button class="btn btnG sm rep-edit" data-id="'+r.id+'">수정</button><button class="btn btnD sm rep-del" data-id="'+r.id+'">삭제</button></div>':'')+'</div><div class="repSec"><div class="repSecLbl">이번주 실적</div><div class="repSecCt">'+(r.thisWeek?esc(r.thisWeek):'<span style="color:var(--tx3)">미입력</span>')+'</div></div><div class="repSec"><div class="repSecLbl">다음주 계획</div><div class="repSecCt next">'+(r.nextWeek?esc(r.nextWeek):'<span style="color:var(--tx3)">미입력</span>')+'</div></div><div class="repMeta">'+esc(r.author||'')+' 작성</div></div>';}).join(''):'<div class="noRep">등록된 보고가 없습니다.</div>')+'</div></div>';}).join('')+'</div></div>';}).join('');}
function togDept(h){var ico=h.querySelector('.togIco'),list=h.nextElementSibling;var open=list.style.display!=='none';list.style.display=open?'none':'block';ico.classList.toggle('open',!open);}
function togTeam(h){var reps=h.nextElementSibling;var open=reps.style.display!=='none';reps.style.display=open?'none':'block';var nm=h.querySelector('.teamNm');nm.innerHTML=nm.innerHTML.replace(open?'▼':'▶',open?'▶':'▼');}
function changeMonth(dir){calM+=dir;if(calM>11){calM=0;calY++;}else if(calM<0){calM=11;calY--;}renderCal();}
window.addEventListener('resize',function(){if(calY&&calM!==undefined)renderCal();});
function renderCal(){
  var te=document.getElementById('calTitle');if(!te)return;
  te.textContent=calY+'년 '+(calM+1)+'월';
  var grid=document.getElementById('calGrid');
  var isMobile=window.innerWidth<=768;
  if(isMobile){grid.className='calGrid weekdays-only';}else{grid.className='calGrid';}
  var days=isMobile?['월','화','수','목','금']:['일','월','화','수','목','금','토'];
  var html=days.map(function(d){return '<div class="calDL">'+d+'</div>';}).join('');
  var fd=new Date(calY,calM,1).getDay(),ld=new Date(calY,calM+1,0).getDate(),today=new Date(),pl=new Date(calY,calM,0).getDate();
  if(isMobile){
    var monOffset=(fd===0||fd===6)?0:fd-1;
    for(var i=monOffset-1;i>=0;i--)html+='<div class="calCell om"><div class="calDate">'+(pl-i)+'</div></div>';
    for(var dd=1;dd<=ld;dd++){
      var dow=new Date(calY,calM,dd).getDay();
      if(dow===0||dow===6)continue;
      var isTd=today.getFullYear()===calY&&today.getMonth()===calM&&today.getDate()===dd;
      var ds=calY+'-'+pad(calM+1)+'-'+pad(dd);
      var gcEs=GCD.filter(function(e){return e.d===ds;});
      var dbEs=events.filter(function(e){return e.date===ds;});
      var hI=instruction&&instruction.date&&instruction.date.slice(0,10)===ds;
      var evH=gcEs.map(function(e){return '<div class="calEv gc" title="'+esc(e.t)+'">📅'+esc(e.t)+'</div>';}).join('')+dbEs.map(function(e){return '<div class="calEv '+(e.type||'mt')+'" title="'+esc(e.title)+'">'+esc(e.title)+'</div>';}).join('')+(hI?'<div class="calEv instr">📢지시</div>':'');
      html+='<div class="calCell'+(isTd?' today':'')+'" onclick="selDay(\''+ds+'\')"><div class="calDate">'+dd+'</div>'+evH+'</div>';
    }
  } else {
    for(var i=fd-1;i>=0;i--)html+='<div class="calCell om"><div class="calDate">'+(pl-i)+'</div></div>';
    for(var dd=1;dd<=ld;dd++){
      var isTd=today.getFullYear()===calY&&today.getMonth()===calM&&today.getDate()===dd;
      var ds=calY+'-'+pad(calM+1)+'-'+pad(dd);
      var gcEs=GCD.filter(function(e){return e.d===ds;});
      var dbEs=events.filter(function(e){return e.date===ds;});
      var hI=instruction&&instruction.date&&instruction.date.slice(0,10)===ds;
      var evH=gcEs.map(function(e){return '<div class="calEv gc" title="'+esc(e.t)+'">📅'+esc(e.t)+'</div>';}).join('')+dbEs.map(function(e){return '<div class="calEv '+(e.type||'mt')+'" title="'+esc(e.title)+'">'+esc(e.title)+'</div>';}).join('')+(hI?'<div class="calEv instr">📢지시</div>':'');
      html+='<div class="calCell'+(isTd?' today':'')+'" onclick="selDay(\''+ds+'\')"><div class="calDate">'+dd+'</div>'+evH+'</div>';
    }
    var rem=(7-(fd+ld)%7)%7;
    for(var d2=1;d2<=rem;d2++)html+='<div class="calCell om"><div class="calDate">'+d2+'</div></div>';
  }
  grid.innerHTML=html;
}
function selDay(ds){var panel=document.getElementById('dayEvts');var gcEs=GCD.filter(function(e){return e.d===ds;});var dbEs=events.filter(function(e){return e.date===ds;});var hI=instruction&&instruction.date&&instruction.date.slice(0,10)===ds;if(!gcEs.length&&!dbEs.length&&!hI){panel.innerHTML='<div class="gcLoad">이 날 일정이 없습니다.</div>';}else{panel.innerHTML='<b style="font-size:13px;color:var(--primary)">'+ds+'</b><br><br>'+gcEs.map(function(e){return '<div class="gcItem"><div class="gcItemT">📅 '+esc(e.t)+'</div><div class="gcItemTime">'+esc(e.tm||'종일')+'</div></div>';}).join('')+dbEs.map(function(e){return '<div class="gcItem"><div class="gcItemT">'+esc(e.title)+'</div>'+(currentUser&&currentUser.type==='admin'?'<button class="btn btnD sm" onclick="deleteEvent(\''+e.id+'\')">삭제</button>':'')+'</div>';}).join('')+(hI?'<div class="gcItem"><div class="gcItemT">📢 국장 지시사항</div></div>':'');}if(currentUser&&currentUser.type==='admin')document.getElementById('evDate').value=ds;}
function renderGcalSide(){var el=document.getElementById('gcalList');if(!el)return;var now=new Date();var up=GCD.filter(function(e){return new Date(e.d)>=now;}).sort(function(a,b){return new Date(a.d)-new Date(b.d);}).slice(0,12);if(!up.length){el.innerHTML='<div class="gcLoad">예정된 일정이 없습니다.</div>';return;}el.innerHTML=up.map(function(e){return '<div class="gcItem"><div class="gcItemT">📅 '+esc(e.t)+'</div><div class="gcItemTime">'+e.d+' '+esc(e.tm||'종일')+'</div></div>';}).join('');}

function fetchGCal(){if(!GCAL_API_KEY||!GCAL_CAL_ID){setGCalSt('캘린더 ID를 입력하세요.');return;}var now=new Date(),tMin=new Date(now.getFullYear(),now.getMonth()-1,1).toISOString(),tMax=new Date(now.getFullYear(),now.getMonth()+3,1).toISOString();fetch('https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(GCAL_CAL_ID)+'/events?key='+GCAL_API_KEY+'&timeMin='+encodeURIComponent(tMin)+'&timeMax='+encodeURIComponent(tMax)+'&singleEvents=true&orderBy=startTime&maxResults=500').then(function(r){if(!r.ok){return r.json().then(function(e){setGCalSt('오류: '+(e.error&&e.error.message||r.status));return null;});}return r.json();}).then(function(data){if(!data)return;GCD=(data.items||[]).map(function(e){var d=(e.start.dateTime||e.start.date||'').slice(0,10),tm='';if(e.start.dateTime){var s=new Date(e.start.dateTime),en=new Date(e.end.dateTime);tm=pad(s.getHours())+':'+pad(s.getMinutes())+'~'+pad(en.getHours())+':'+pad(en.getMinutes());}return{t:e.summary||'(제목없음)',d:d,tm:tm};});setGCalSt('✅ '+GCD.length+'개 일정 로드됨');renderCal();renderGcalSide();}).catch(function(e){setGCalSt('로드 실패: '+e.message);});}
function setGCalSt(msg){var el=document.getElementById('gcalStatus');if(el)el.textContent=msg;}
function saveGCalConfig(){var k=document.getElementById('gcalApiKey').value.trim(),id=document.getElementById('gcalCalId').value.trim();if(!k||!id){alert('API 키와 캘린더 ID를 모두 입력하세요.');return;}GCAL_API_KEY=k;GCAL_CAL_ID=id;localStorage.setItem('gcal_key',k);localStorage.setItem('gcal_calid',id);fetchGCal();}
function clearAllEvents(){showConf('등록된 일정을 모두 삭제하시겠습니까?',function(){if(db)db.ref('events').remove();events=[];renderCal();saveLS();});});}
function showConf(msg,cb){document.getElementById('confMsg').textContent=msg;confCb=cb;document.getElementById('confDlg').style.display='flex';}
function closeConf(){document.getElementById('confDlg').style.display='none';confCb=null;}
function execConf(){if(confCb)confCb();closeConf();}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function fmtD(d){if(!(d instanceof Date)||isNaN(d))return '';return d.getFullYear()+'.'+(d.getMonth()+1+'').padStart(2,'0')+'.'+(''+d.getDate()).padStart(2,'0');}
function pad(n){return (''+n).padStart(2,'0');}
