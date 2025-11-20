/* ===== データ（エリア定義） ===== */
const ROOM_PRESETS={
  '玄関':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'door_step',label:'扉段差',unit:'cm'},{key:'hall_width',label:'横幅',unit:'cm'},{key:'depth',label:'奥行',unit:'cm'},{key:'kamachi_height',label:'あがりかまち高',unit:'cm'}],
  '廊下':[{key:'hallway_width',label:'廊下幅',unit:'cm'}],
  '脱衣所':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'sill_step',label:'敷居段差',unit:'cm'},{key:'sink_height',label:'洗面台高',unit:'cm'},{key:'depth',label:'奥行',unit:'cm'},{key:'width',label:'横幅',unit:'cm'}],
  '浴室':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'sill_height_in',label:'浴室敷居高(入)',unit:'cm'},{key:'sill_height_out',label:'浴室敷居高(出)',unit:'cm'},{key:'bathtub_height_ext',label:'浴槽高(外)',unit:'cm'},{key:'bathtub_height_int',label:'浴槽高(内)',unit:'cm'},{key:'chair_height',label:'イス高さ',unit:'cm'}],
  'トイレ':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'sill_step',label:'敷居段差',unit:'cm'},{key:'room_width',label:'横幅',unit:'cm'},{key:'toilet_height',label:'便座高',unit:'cm'},{key:'toilet_to_wall_dist',label:'便器先端⇔壁',unit:'cm'}],
  '屋外':[{key:'gate_width',label:'門扉幅',unit:'cm'},{key:'step_count',label:'段差数',unit:''},{key:'max_step_height',label:'段差(最高段)',unit:'cm'}],
  '寝室':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'sill_step',label:'敷居段差',unit:'cm'},{key:'bed_height',label:'既存ベッド高さ',unit:'cm'}],
  'リビング':[{key:'door_width',label:'扉幅',unit:'cm'},{key:'sill_step',label:'敷居段差',unit:'cm'},{key:'sofa_height',label:'ソファー等座面高',unit:'cm'}],
  'ダイニング':[{key:'table_top_height',label:'テーブル天板高(上)',unit:'cm'},{key:'table_bottom_height',label:'テーブル天板高(下)',unit:'cm'},{key:'chair_height',label:'食卓イス座面高',unit:'cm'},{key:'kitchen_height',label:'キッチン台高',unit:'cm'}],
  '階段':[{key:'step_count',label:'階段段数',unit:''},{key:'step_height',label:'段差高',unit:'cm'}],
  'フリー':[]
};

/* ===== データ管理 ===== */
const PROFILE_KEY='home-env-profile-v1';
const STORAGE_KEY='home-env-reports-v2';
let profile={staffName:'',office:'',phone:'',email:''};
let reportsState={activeReportId:null,reports:[]};
let state=null;
let lastPrintablePage='menu';

function loadProfile(){try{const p=JSON.parse(localStorage.getItem(PROFILE_KEY));if(p)profile=p;}catch(e){}}
function saveProfile(){try{localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));}catch(e){}}

function createEmptyReportData(){
  return {
    customer:{
      name:'',
      date:'',
      staff: profile.staffName || '',
      office: profile.office || '',
      tel1: profile.phone || '',
      // tel2 (携帯) は削除
      email: profile.email || ''
    },
    areas:[
      {id:crypto.randomUUID(),name:'屋外',type:'屋外',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'玄関',type:'玄関',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'廊下',type:'廊下',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'脱衣所',type:'脱衣所',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'浴室',type:'浴室',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'トイレ',type:'トイレ',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'寝室',type:'寝室',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'リビング',type:'リビング',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'ダイニング',type:'ダイニング',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'階段',type:'階段',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]}
    ],
    photoPages:[{id:crypto.randomUUID(),p1:null,p2:null,memo:''}],
    assessment:{personality:'',family:'',bath:'',meal:'',excretion:'',mobility:''},
    activeTab:'menu'
  };
}

function createNewFreeArea(name){return {id:crypto.randomUUID(),name:name||'新規エリア',type:'フリー',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]};}

function normalizeReportData(data){
  const d=data||createEmptyReportData();
  if(d.activeTab==='photos'&&Array.isArray(d.photoPages)&&d.photoPages[0]) d.activeTab=`photo:${d.photoPages[0].id}`;
  if(Array.isArray(d.photoPages)) d.photoPages.forEach(p=>{delete p.p3;delete p.p4;});
  d.assessment=Object.assign({personality:'',family:'',bath:'',meal:'',excretion:'',mobility:''},d.assessment);
  d.customer=Object.assign({name:'',date:'',staff:'',office:'',tel1:'',tel2:'',email:''},d.customer);
  if(d.areas) d.areas.forEach(a=>{a.customFields||=[];a.hiddenFields||=[];});
  
  const hasNewAreas = d.areas.some(a=>a.type==='屋外');
  if(!hasNewAreas && d.areas.length>0){
    d.areas.unshift({id:crypto.randomUUID(),name:'屋外',type:'屋外',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]});
    d.areas.push(
      {id:crypto.randomUUID(),name:'寝室',type:'寝室',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'リビング',type:'リビング',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'ダイニング',type:'ダイニング',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]},
      {id:crypto.randomUUID(),name:'階段',type:'階段',photo1:null,photo2:null,measurements:{},memo:'',customFields:[],hiddenFields:[]}
    );
  }
  return d;
}

function loadAllReports(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(!raw){const r={id:crypto.randomUUID(),name:'無題の報告書',createdAt:Date.now(),updatedAt:Date.now(),data:createEmptyReportData()};reportsState={activeReportId:r.id,reports:[r]};return;}
    const parsed=JSON.parse(raw);
    reportsState={activeReportId:parsed.activeReportId,reports:parsed.reports.map(r=>({...r, data:normalizeReportData(r.data)}))};
  }catch(e){console.warn(e);}
}
function saveAllReports(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(reportsState));}catch(e){console.warn(e);}}

function ensureActiveReport(){
  let rep=reportsState.reports.find(r=>r.id===reportsState.activeReportId);
  if(!rep){
    const r={id:crypto.randomUUID(),name:'無題の報告書',createdAt:Date.now(),updatedAt:Date.now(),data:createEmptyReportData()};
    reportsState.reports.push(r);reportsState.activeReportId=r.id;rep=r;
  }
  state=rep.data;
  return rep;
}

/* ===== DOM Utils & Logic ===== */
const byId=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);

function h(tag,props,...children){
  const el=document.createElement(tag);
  if(props){
    if(props.class)el.className=props.class;
    if(props.id)el.id=props.id;
    if(props.onclick)el.onclick=props.onclick;
    if(props['data-sheet'])el.dataset.sheet=props['data-sheet'];
    if(props.style)Object.assign(el.style,props.style);
    if(props.type)el.type=props.type;
    if(props.placeholder)el.placeholder=props.placeholder;
    if(props.value)el.value=props.value;
    if(props.oninput)el.oninput=props.oninput;
    if(props.name)el.name=props.name;
    if(props.checked)el.checked=props.checked;
    
    if(props.src) el.src = props.src;
    if(props['data-id']) el.dataset.id = props['data-id'];
  }
  children.flat().forEach(ch=>{if(ch) el.appendChild(typeof ch==='string'?document.createTextNode(ch):ch);});
  return el;
}

async function readAndCompress(file){
  return new Promise(resolve=>{
    const r=new FileReader();
    r.onload=()=>{const i=new Image();i.onload=()=>{
      const c=document.createElement('canvas');const scale=Math.min(1,1600/i.width);c.width=i.width*scale;c.height=i.height*scale;
      c.getContext('2d').drawImage(i,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',0.85));
    };i.src=r.result;};r.readAsDataURL(file);
  });
}

function bindForm(obj,map,saveFn){
  if(!obj)return;
  Object.entries(map).forEach(([id,key])=>{
    const el=byId(id);if(!el)return;
    el.value=obj[key]||'';
    el.oninput=()=>{obj[key]=el.value;if(saveFn)saveFn();};
  });
}

function bindPhotoInput(inputId,pickSel,replSel,delSel,setFn){
  const input=byId(inputId);if(!input)return;
  const pick=()=>{
    input.value = ''; 
    input.click();
  };
  $$(pickSel).forEach(el=>el.onclick=pick);
  $$(replSel).forEach(el=>el.onclick=pick);
  $$(delSel).forEach(el=>el.onclick=()=>setFn(null));
  input.onchange=async e=>{if(e.target.files.length) setFn(await readAndCompress(e.target.files[0]));};
}

/* ===== メイン描画処理 ===== */
function renderAll(){
  try {
    ensureActiveReport();
    const rep = reportsState.reports.find(r=>r.id===reportsState.activeReportId);
    if(byId('currentReportLabel')) byId('currentReportLabel').textContent = `現在の報告書：${rep.name || state.customer.name || '無題'}（下書き）`;

    const tabs=byId('tabs');
    if(tabs){
      tabs.innerHTML='';
      const list=[
        {id:'cover',label:'表紙'},{id:'assessment',label:'アセスメント'},...state.areas.map(a=>({id:a.id,label:a.name})),...state.photoPages.map((p,i)=>({id:`photo:${p.id}`,label:`写真${state.photoPages.length>1?i+1:''}`}))];
      list.forEach(l=>tabs.appendChild(h('button',{class:`app-tab-btn${state.activeTab===l.id?' active':''}`,onclick:()=>setActiveTab(l.id)},l.label)));
      tabs.appendChild(h('button',{class:'app-tab-btn add-btn',onclick:()=>{const n=prompt('エリア名');if(n){const a=createNewFreeArea(n);state.areas.push(a);saveAllReports();setActiveTab(a.id);}}},'＋エリア'));
    }

    $$('.tab-panel').forEach(p=>p.style.display='none');
    const t=state.activeTab;
    const activeView = byId(t==='menu'?'menuView':(t==='cover'?'coverView':(t==='assessment'?'assessmentView':(t==='profile'?'profileView':(t.startsWith('photo:')?'photosView':'areaView')))));
    if(activeView) activeView.style.display='block';

    bindForm(state.customer,{custName:'name',surveyDate:'date',staff:'staff',office:'office',tel1:'tel1',email:'email'},saveAllReports);
    bindForm(state.assessment,{asmPersonality:'personality',asmFamily:'family',asmBath:'bath',asmMeal:'meal',asmExcretion:'excretion',asmMobility:'mobility'},saveAllReports);
    
    bindForm(profile,{profileStaffName:'staffName',profileOffice:'office',profilePhone:'phone',profileEmail:'email'}, () => {
      saveProfile();
      if (!state.customer.staff) state.customer.staff = profile.staffName;
      if (!state.customer.office) state.customer.office = profile.office;
      if (!state.customer.tel1) state.customer.tel1 = profile.phone;
      if (!state.customer.email) state.customer.email = profile.email;
      saveAllReports();
      if(byId('staff')) byId('staff').value = state.customer.staff || '';
      if(byId('office')) byId('office').value = state.customer.office || '';
      if(byId('tel1')) byId('tel1').value = state.customer.tel1 || '';
      if(byId('email')) byId('email').value = state.customer.email || '';
    });

    if(t.startsWith('photo:')){
      const p=state.photoPages.find(pg=>`photo:${pg.id}`===t)||state.photoPages[0];
      bindPhotoInput('p2in1','[data-pick-p2="1"]','[data-replace-p2="1"]','[data-del-p2="1"]',u=>{p.p1=u;saveAllReports();renderAll();});
      bindPhotoInput('p2in2','[data-pick-p2="2"]','[data-replace-p2="2"]','[data-del-p2="2"]',u=>{p.p2=u;saveAllReports();renderAll();});
      if(byId('photoPageImg1')) byId('photoPageImg1').src=p.p1||'';
      if(byId('photoPageImg2')) byId('photoPageImg2').src=p.p2||'';
      if(byId('photoPageMemo')){byId('photoPageMemo').value=p.memo||'';byId('photoPageMemo').oninput=e=>{p.memo=e.target.value;saveAllReports();};}
      
      const dupBtn = byId('duplicatePhotoPageBtn');
      const delBtn = byId('deletePhotoPageBtn');
      if(dupBtn) dupBtn.onclick = () => {
        const n = JSON.parse(JSON.stringify(p)); n.id = crypto.randomUUID();
        state.photoPages.splice(state.photoPages.indexOf(p) + 1, 0, n);
        saveAllReports(); setActiveTab(`photo:${n.id}`);
      };
      if(delBtn) delBtn.onclick = () => {
        if (state.photoPages.length <= 1) return alert('削除できません');
        if (confirm('削除しますか？')) {
          state.photoPages = state.photoPages.filter(pg => pg.id !== p.id);
          saveAllReports(); setActiveTab('menu');
        }
      };

    } else if(!['menu','cover','assessment','profile'].includes(t)){
      const a=state.areas.find(x=>x.id===t);
      if(a){
        if(byId('areaName')){byId('areaName').value=a.name;byId('areaName').oninput=e=>{a.name=e.target.value;saveAllReports();renderAll();};}
        
        const dupAreaBtn = byId('duplicateAreaBtn');
        const delAreaBtn = byId('deleteAreaBtn');
        if(dupAreaBtn) dupAreaBtn.onclick = () => {
          const n = JSON.parse(JSON.stringify(a)); n.id = crypto.randomUUID(); n.name += '(コピー)';
          state.areas.splice(state.areas.indexOf(a) + 1, 0, n);
          saveAllReports(); setActiveTab(n.id);
        };
        if(delAreaBtn) delAreaBtn.onclick = () => {
          if (state.areas.length <= 0) return alert('削除できません');
          if (confirm('削除しますか？')) {
            state.areas = state.areas.filter(ar => ar.id !== a.id);
            saveAllReports(); setActiveTab('menu');
          }
        };

        bindPhotoInput('photoInput1','[data-pick="1"]','[data-replace="1"]','[data-del="1"]',u=>{a.photo1=u;saveAllReports();renderAll();});
        bindPhotoInput('photoInput2','[data-pick="2"]','[data-replace="2"]','[data-del="2"]',u=>{a.photo2=u;saveAllReports();renderAll();});
        if(byId('photoImg1')) byId('photoImg1').src=a.photo1||'';
        if(byId('photoImg2')) byId('photoImg2').src=a.photo2||'';
        if(byId('memo')){byId('memo').value=a.memo||'';byId('memo').oninput=e=>{a.memo=e.target.value;saveAllReports();};}
        
        const grid=byId('measureGrid');
        if(grid){
          grid.innerHTML='';
          const fields=[...(ROOM_PRESETS[a.type]||[]), ...(a.customFields||[])].filter(f=>!(a.hiddenFields||[]).includes(f.key));
          fields.forEach(f=>{
            const val = (a.measurements||{})[f.key]||'';
            const item = h('div',{class:'measure-item'},
              h('div',{class:'measure-item-main'},
                h('div',{class:'measure-label'},f.label),
                h('div',{class:'measure-input-wrap'},
                  h('input',{type:'number',placeholder:'0',value:val,oninput:e=>{a.measurements=a.measurements||{};a.measurements[f.key]=e.target.value;saveAllReports();}}),
                  h('span',{class:'unit'},f.unit||'')
                )
              ),
              h('div',{class:'measure-controls'},
                 ...[1,10,50].map(n=>h('button',{class:'btn-xxs primary',onclick:()=>{
                   const cur=parseFloat((a.measurements||{})[f.key])||0;
                   a.measurements=a.measurements||{};
                   a.measurements[f.key]=cur+n;
                   saveAllReports();
                   renderAll(); 
                 }},`+${n}`)),
                 h('button',{class:'btn-xxs',onclick:()=>{
                   a.measurements=a.measurements||{};
                   a.measurements[f.key]=0;
                   saveAllReports();
                   renderAll();
                 }},'クリア'),
                 h('button',{class:'btn-xxs danger',onclick:()=>{
                   if(confirm('この項目を削除しますか？')){
                     a.hiddenFields=(a.hiddenFields||[]);
                     a.hiddenFields.push(f.key);
                     saveAllReports();
                     renderAll();
                   }
                 }},'削除')
              )
            );
            grid.appendChild(item);
          });
        }
        
        const addCm = byId('addCustomFieldBtnCm');
        const addNoUnit = byId('addCustomFieldBtnNoUnit');
        const addInput = byId('customFieldLabel');
        
        const addField = (unit) => {
          const label = addInput.value.trim();
          if(!label) return;
          const key = `custom_${Date.now()}`;
          a.customFields = a.customFields || [];
          a.customFields.push({key, label, unit});
          addInput.value = '';
          saveAllReports();
          renderAll();
        };

        if(addCm) addCm.onclick = () => addField('cm');
        if(addNoUnit) addNoUnit.onclick = () => addField('');
      }
    }
  } catch(e) {
    console.error("Render Error:", e);
  }
}
function setActiveTab(t){state.activeTab=t;if(t!=='menu'&&t!=='profile')lastPrintablePage=t;renderAll();}

/* ===== 印刷ロジック (完成版) ===== */
function makeCoverSheet(){
  const d=state.customer;
  // 携帯削除、メール追加版
  return h('section',{class:'sheet','data-sheet':'cover'},h('div',{class:'sheet-body'},
    h('h1',{class:'cover-title'},'家屋調査報告書'),
    h('div',{class:'cover-customer-name'},(d.name||'      ')+' 様'),
    h('table',{class:'cover-info-table'},
      h('tr',{}, h('th',{},'調査日'), h('td',{}, d.date || '')),
      h('tr',{}, h('th',{},'事業所'), h('td',{}, d.office || '')),
      h('tr',{}, h('th',{},'担当者'), h('td',{}, d.staff || '')),
      h('tr',{}, h('th',{},'電話番号'), h('td',{}, d.tel1 || '')),
      h('tr',{}, h('th',{},'メール'), h('td',{}, d.email || ''))
    )
  ));
}

function makeAreaSheet(a){
  const t=h('table',{class:'measure-table'}); const tb=h('tbody');
  [...(ROOM_PRESETS[a.type]||[]),...(a.customFields||[])].filter(f=>!(a.hiddenFields||[]).includes(f.key)).forEach(f=>{
    tb.appendChild(h('tr',{},h('th',{},f.label),h('td',{},((a.measurements||{})[f.key]||'')+(f.unit||''))));
  });
  t.appendChild(tb);

  // 修正: area-grid クラスと gridArea 指定で配置を完全制御
  return h('section',{class:'sheet'},h('div',{class:'sheet-body'},
    h('div',{class:'sheet-title'},a.name),
    h('div',{class:'area-grid'},
       h('div',{style:{gridArea:'photo1'}}, photoCell(a.photo1)),
       h('div',{style:{gridArea:'table'}, class:'area-content-cell'}, t),
       h('div',{style:{gridArea:'photo2'}}, photoCell(a.photo2)),
       h('div',{style:{gridArea:'memo'}}, h('div',{class:'memo-box'}, a.memo||''))
    )
  ));
}

function makeAssessmentSheet(){
  const a=state.assessment;
  // 2列グリッド
  const item = (label, text) => h('div',{class:'assessment-item'},
    h('div',{class:'assessment-label'}, label),
    h('div',{class:'assessment-content'}, text||'')
  );

  return h('section',{class:'sheet','data-sheet':'assessment'},h('div',{class:'sheet-body'},
    h('div',{class:'sheet-title'},'アセスメントシート'),
    h('div',{class:'assessment-grid'},
      item('性格・趣味', a.personality),
      item('家族の希望', a.family),
      item('入浴動作', a.bath),
      item('食事状況', a.meal),
      item('排泄状況', a.excretion),
      item('移動能力', a.mobility)
    )
  ));
}

function makePhotoSheet(p,i){
  return h('section',{class:'sheet'},h('div',{class:'sheet-body'},h('div',{class:'sheet-title'},`写真${i+1}`),
    h('div',{class:'photo-grid-2p', style:{height:'auto', paddingBottom:'5mm'}},
       h('div',{class:'photo-cell', style:{height:'100mm'}},photoCell(p.p1)), 
       h('div',{class:'photo-cell', style:{height:'100mm'}},photoCell(p.p2))
    ),
    h('div',{style:{marginTop:'0'}},h('div',{class:'memo-box',style:{height:'30mm'}},p.memo||''))
  ));
}

const photoCell=src=>src?h('img',{class:'print-photo',src:src}):'';

function buildSelectedSheets(ids){
  const c=byId('printSheets');
  if(!c){alert('エラー: 印刷コンテナが見つかりません');return;}
  c.innerHTML='';
  ids.forEach(id=>{
    if(id==='__cover__')c.appendChild(makeCoverSheet());
    else if(id==='__assessment__')c.appendChild(makeAssessmentSheet());
    else if(id.startsWith('photo:')){const pid=id.split(':')[1];const idx=state.photoPages.findIndex(p=>p.id===pid);const p=state.photoPages[idx];if(p)c.appendChild(makePhotoSheet(p,idx));}
    else {const a=state.areas.find(x=>x.id===id);if(a)c.appendChild(makeAreaSheet(a));}
  });

  c.style.display = 'block';
  setTimeout(()=>{
    window.print();
    c.style.display = 'none';
  },300);
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded',()=>{
  loadProfile();loadAllReports();ensureActiveReport();
  state.activeTab='menu';
  
  const bindBtn=(id,fn)=>{const b=byId(id);if(b)b.onclick=fn;};
  
  bindBtn('headerBackBtn', ()=>setActiveTab('menu'));

  const dd = byId('headerDropdown');
  bindBtn('headerMenuBtn', (e)=>{
    e.stopPropagation();
    dd.classList.toggle('show');
  });
  
  document.body.addEventListener('click', ()=>{
    if(dd) dd.classList.remove('show');
  });

  const closeDD = () => dd.classList.remove('show');
  
  bindBtn('ddSave', ()=>{ closeDD(); saveAllReports(); alert('保存しました'); });
  
  bindBtn('ddExport', ()=>{
    closeDD();
    const bg=h('div',{class:'modal-bg'},h('div',{class:'modal'},h('h3',{},'出力メニュー'),h('div',{class:'menu-list'},
      h('button',{onclick:()=>{document.body.removeChild(bg);buildSelectedSheets(['__cover__','__assessment__',...state.areas.map(a=>a.id),...state.photoPages.map(p=>`photo:${p.id}`)]);}},'すべて印刷'),
      h('button',{onclick:()=>{document.body.removeChild(bg);openSelectModal();}},'選択印刷'),
      h('button',{onclick:()=>{document.body.removeChild(bg);}},'キャンセル')
    )));
    document.body.appendChild(bg);
  });
  
  bindBtn('ddProfile', ()=>{ closeDD(); setActiveTab('profile'); });
  bindBtn('ddReports', ()=>{ closeDD(); openReportManager(); });
  
  bindBtn('ddNew', ()=>{
    closeDD();
    const name=window.prompt('新しい報告書の名前（空欄可）','');
    const rep={id:crypto.randomUUID(),name:name||'無題の報告書',createdAt:Date.now(),updatedAt:Date.now(),data:createEmptyReportData()};
    reportsState.reports.push(rep);reportsState.activeReportId=rep.id;state=rep.data;saveAllReports();setActiveTab('cover');
  });

  bindBtn('menuReportsBtn', openReportManager);
  bindBtn('menuNewReportBtn', ()=>{
    const name=window.prompt('新しい報告書の名前（空欄可）','');
    const rep={id:crypto.randomUUID(),name:name||'無題の報告書',createdAt:Date.now(),updatedAt:Date.now(),data:createEmptyReportData()};
    reportsState.reports.push(rep);reportsState.activeReportId=rep.id;state=rep.data;saveAllReports();setActiveTab('cover');
  });
  bindBtn('menuEditBtn', ()=>setActiveTab('cover'));
  bindBtn('menuProfileBtn', ()=>setActiveTab('profile'));
  bindBtn('menuSaveBtn',()=>{saveAllReports();alert('保存しました');});
  bindBtn('menuExportBtn',()=>{
    const bg=h('div',{class:'modal-bg'},h('div',{class:'modal'},h('h3',{},'出力メニュー'),h('div',{class:'menu-list'},
      h('button',{onclick:()=>{document.body.removeChild(bg);buildSelectedSheets(['__cover__','__assessment__',...state.areas.map(a=>a.id),...state.photoPages.map(p=>`photo:${p.id}`)]);}},'すべて印刷'),
      h('button',{onclick:()=>{document.body.removeChild(bg);openSelectModal();}},'選択印刷'),
      h('button',{onclick:()=>{document.body.removeChild(bg);}},'キャンセル')
    )));
    document.body.appendChild(bg);
  });
  
  renderAll();
});

function openSelectModal(){
  const bg=h('div',{class:'modal-bg'},h('div',{class:'modal'},h('h3',{},'印刷選択'),
    h('div',{style:{marginBottom:'8px'}},
      h('button',{class:'btn-sm',onclick:()=>{
        const inputs = bg.querySelectorAll('input[type="checkbox"]');
        const isAllChecked = [...inputs].every(i => i.checked);
        inputs.forEach(i => i.checked = !isAllChecked);
      }},'全選択/解除')
    ),
    h('div',{class:'checklist',id:'printCheckList'}),
    h('div',{style:{marginTop:'10px',display:'flex',justifyContent:'flex-end'}},
    h('button',{onclick:()=>{document.body.removeChild(bg);}},'キャンセル'),
    h('button',{class:'primary',onclick:()=>{
      const ids=[...bg.querySelectorAll('input:checked')].map(i=>i.dataset.id);
      document.body.removeChild(bg);buildSelectedSheets(ids);
    }},'印刷')
  )));
  const list=bg.querySelector('#printCheckList');
  [{id:'__cover__',label:'表紙'},{id:'__assessment__',label:'アセスメント'},...state.areas.map(a=>({id:a.id,label:a.name})),...state.photoPages.map((p,i)=>({id:`photo:${p.id}`,label:`写真${i+1}`}))].forEach(it=>{
    list.appendChild(h('label',{style:{display:'block',padding:'4px'}},h('input',{type:'checkbox','data-id':it.id,checked:true}),it.label));
  });
  document.body.appendChild(bg);
}

function openReportManager(){
  const bg=h('div',{class:'modal-bg'},h('div',{class:'modal'},h('h3',{},'報告書一覧'),h('div',{class:'checklist',id:'reportList'}),h('div',{style:{marginTop:'10px',display:'flex',justifyContent:'flex-end'}},
    h('button',{onclick:()=>{document.body.removeChild(bg);}},'閉じる'),
    h('button',{class:'primary',onclick:()=>{
      const sel=bg.querySelector('input[name="rep"]:checked');
      if(sel){reportsState.activeReportId=sel.value;ensureActiveReport();saveAllReports();document.body.removeChild(bg);renderAll();}
    }},'開く'),
    h('button',{id:'delRepBtn', class:'danger',style:{marginLeft:'8px'}},'削除')
  )));

  const list=bg.querySelector('#reportList');
  reportsState.reports.forEach(r=>{
    const radio = h('input',{type:'radio',name:'rep',value:r.id,checked:r.id===reportsState.activeReportId});
    radio.onclick = function(e) {
      if (this.dataset.wasChecked === 'true') {
        this.checked = false;
        this.dataset.wasChecked = 'false';
      } else {
        list.querySelectorAll('input[name="rep"]').forEach(inp => inp.dataset.wasChecked = 'false');
        this.dataset.wasChecked = 'true';
      }
    };
    if(radio.checked) radio.dataset.wasChecked = 'true';
    list.appendChild(h('label',{style:{display:'block',padding:'4px'}}, radio, r.name||'無題'));
  });
  
  const delBtn = bg.querySelector('#delRepBtn');
  if(delBtn) {
    delBtn.onclick = () => {
      const sel=bg.querySelector('input[name="rep"]:checked');
      if(sel){
        if(reportsState.reports.length<=1)return alert('最後の1つは削除できません');
        if(confirm('削除しますか？')){
          reportsState.reports=reportsState.reports.filter(r=>r.id!==sel.value);
          if(reportsState.activeReportId===sel.value) reportsState.activeReportId=reportsState.reports[0].id;
          saveAllReports();ensureActiveReport();document.body.removeChild(bg);renderAll();
        }
      } else {
        alert('削除する報告書を選択してください');
      }
    };
  }

  document.body.appendChild(bg);
}