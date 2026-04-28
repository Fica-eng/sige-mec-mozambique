// ============================================
// SIGE — Frontend ligado à API Railway
// MEC Moçambique
// ============================================

var API_URL = 'https://sige-mec-backend-production.up.railway.app/api/v1';
var accessToken  = null;
var currentUser  = null;
var activeCharts = {};

// ======= API HELPER =======
async function api(endpoint, options) {
  options = options || {};
  var headers = { 'Content-Type': 'application/json' };
  if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
  try {
    var resp = await fetch(API_URL + endpoint, Object.assign({}, options, { headers: headers }));
    if (resp.status === 401) {
      var ok = await doRefresh();
      if (ok) return api(endpoint, options);
      doLogout(); return null;
    }
    return await resp.json();
  } catch (e) {
    console.error('Erro API:', e);
    return null;
  }
}

async function doRefresh() {
  var rt = localStorage.getItem('sige_refresh');
  if (!rt) return false;
  try {
    var resp = await fetch(API_URL + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    });
    if (!resp.ok) return false;
    var data = await resp.json();
    accessToken = data.accessToken;
    localStorage.setItem('sige_refresh', data.refreshToken);
    return true;
  } catch (e) { return false; }
}

// ======= AUTH =======
async function doLogin() {
  var email    = document.getElementById('login-user').value.trim();
  var password = document.getElementById('login-pass').value;
  if (!email || !password) { alert('Preencha email e palavra-passe.'); return; }

  var btn = document.querySelector('.btn-login');
  btn.textContent = 'A entrar...';
  btn.disabled = true;

  try {
    var resp = await fetch(API_URL + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await resp.json();

    if (!resp.ok) {
      alert(data.error || 'Credenciais inválidas.');
      btn.textContent = 'Entrar no Sistema';
      btn.disabled = false;
      return;
    }

    accessToken = data.accessToken;
    localStorage.setItem('sige_refresh', data.refreshToken);
    currentUser = data.utilizador;

    var roleNames = {
      ADMIN_MEC:'Administrador MEC', COORDENADOR_REGIONAL:'Coordenador Regional',
      DIRETOR_ESCOLA:'Diretor de Escola', PROFESSOR:'Professor'
    };

    document.getElementById('user-name').textContent       = currentUser.nome;
    document.getElementById('user-role-label').textContent = roleNames[currentUser.role] || currentUser.role;
    document.getElementById('user-avatar').textContent     = currentUser.nome[0].toUpperCase();

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    setDate();
    navigateTo('dashboard');
  } catch (e) {
    alert('Erro de ligação ao servidor.');
    btn.textContent = 'Entrar no Sistema';
    btn.disabled = false;
  }
}

async function doLogout() {
  var rt = localStorage.getItem('sige_refresh');
  if (rt && accessToken) {
    fetch(API_URL + '/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + accessToken },
      body: JSON.stringify({ refreshToken: rt })
    }).catch(function(){});
  }
  accessToken = null; currentUser = null;
  localStorage.removeItem('sige_refresh');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('login-pass').value = '';
  document.querySelector('.btn-login').textContent = 'Entrar no Sistema';
  document.querySelector('.btn-login').disabled = false;
}

function setDate() {
  var now = new Date();
  document.getElementById('top-date').textContent = now.toLocaleDateString('pt-MZ', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
}

// ======= NAVIGATION =======
function navigate(el) {
  if (el.preventDefault) el.preventDefault();
  navigateTo(el.getAttribute('data-page'));
}

function navigateTo(page) {
  destroyCharts();
  var titles = { dashboard:'Dashboard', escolas:'Gestão de Escolas', alunos:'Gestão de Alunos', professores:'Gestão de Professores', notas:'Notas e Avaliações', matriculas:'Estatísticas de Matrículas', desempenho:'Desempenho Acadêmico', evasao:'Evasão Escolar', rh:'Recursos Humanos', relatorios:'Relatórios' };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('breadcrumb').textContent = 'MEC / ' + (titles[page] || page);
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.toggle('active', n.getAttribute('data-page') === page); });
  var r = { dashboard:dashboard, escolas:escolas, alunos:alunos, professores:professores, notas:notas, matriculas:matriculas, desempenho:desempenho, evasao:evasao, rh:rh, relatorios:relatorios };
  if (r[page]) r[page]();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('collapsed'); }
function applyFilters() { var p = document.querySelector('.nav-item.active'); if (p) navigateTo(p.getAttribute('data-page')); }

function destroyCharts() {
  Object.values(activeCharts).forEach(function(c){ try{ c.destroy(); }catch(e){} });
  activeCharts = {};
}

function renderChart(id, config) {
  var canvas = document.getElementById(id);
  if (!canvas) return;
  if (activeCharts[id]) { try{ activeCharts[id].destroy(); }catch(e){} }
  activeCharts[id] = new Chart(canvas.getContext('2d'), config);
}

var CD = { plugins: { legend: { labels: { color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:11 }, boxWidth:10 } } }, scales: { x:{ ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:10 } }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:10 } }, grid:{ color:'rgba(255,255,255,0.06)' } } } };

function fmt(n)  { return Number(n||0).toLocaleString('pt-MZ'); }
function fmtK(n) { n=Number(n||0); return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(0)+'K':n; }
function loading() { return '<div class="loading">A carregar dados</div>'; }
function erro(msg) { return '<div class="alert alert-warning">'+String.fromCharCode(9888)+' '+(msg||'Erro ao carregar dados da API.')+'</div>'; }

function kpi(cor, label, valor, sub, trend) {
  return '<div class="kpi-card '+cor+'"><span class="kpi-label">'+label+'</span><span class="kpi-value">'+valor+'</span><span class="kpi-sub">'+sub+'</span>'+(trend?'<span class="kpi-trend up">'+trend+'</span>':'')+'</div>';
}

// ======= DASHBOARD =======
async function dashboard() {
  document.getElementById('page-content').innerHTML = loading();
  var data = await api('/estatisticas/dashboard');
  var prov = await api('/estatisticas/matriculas-por-provincia');
  var tipos = await api('/estatisticas/por-tipo-escola');
  if (!data) { document.getElementById('page-content').innerHTML = erro(); return; }

  var html =
    '<div class="kpi-grid">' +
      kpi('green','Total de Escolas',     fmt(data.escolas.total),       'Activas no sistema',    '+3.2%') +
      kpi('blue', 'Total de Alunos',      fmtK(data.alunos.total),       'Registados',            '+2.5%') +
      kpi('gold', 'Professores',          fmtK(data.professores.total),  'Em exercício',          '+1.8%') +
      kpi('green','Matrículas '+data.anoLetivo, fmtK(data.matriculas.total),'Ano lectivo actual', '+2.1%') +
      kpi('red',  'Taxa de Evasão',       data.taxaEvasao+'%',           'Média nacional',        '') +
      kpi('gold', 'Média de Notas',       data.mediaNotas||'N/D',        'Escala 0–20',           '') +
    '</div>' +
    '<div class="charts-row">' +
      '<div class="chart-card"><div class="chart-header"><div><div class="chart-title">Estado dos Alunos</div></div></div><div class="chart-container"><canvas id="ch-est"></canvas></div></div>' +
      '<div class="chart-card"><div class="chart-header"><div><div class="chart-title">Escolas por Tipo</div></div></div><div class="chart-container"><canvas id="ch-tip"></canvas></div></div>' +
    '</div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Por Província</span><button class="btn btn-gold btn-sm" onclick="exportPDF()">Exportar PDF</button></div>' +
    '<table class="data-table"><thead><tr><th>Província</th><th>Escolas</th><th>Alunos</th><th>Professores</th></tr></thead><tbody>' +
    (prov ? prov.sort(function(a,b){return b.totalAlunos-a.totalAlunos;}).map(function(p){
      return '<tr><td><strong style="color:var(--text-primary)">'+p.nome+'</strong></td><td>'+fmt(p.totalEscolas)+'</td><td>'+fmtK(p.totalAlunos)+'</td><td>'+fmtK(p.totalProfessores)+'</td></tr>';
    }).join('') : '') +
    '</tbody></table></div>';

  document.getElementById('page-content').innerHTML = html;

  setTimeout(function(){
    renderChart('ch-est',{ type:'doughnut', data:{ labels:['Activos','Evadidos','Outros'], datasets:[{ data:[data.alunos.ativos,data.alunos.evadidos,data.alunos.total-data.alunos.ativos-data.alunos.evadidos], backgroundColor:['#009A44','#D21034','#4A90D9'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:10 }, boxWidth:10 } } } } });
    if (tipos) renderChart('ch-tip',{ type:'doughnut', data:{ labels:tipos.map(function(t){ return t.tipo==='PRIMARIA'?'EPC':t.tipo==='BASICA'?'EB':'Secundária'; }), datasets:[{ data:tipos.map(function(t){ return t.totalEscolas; }), backgroundColor:['#4A90D9','#009A44','#FCB017'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:10 }, boxWidth:10 } } } } });
  },100);
}

// ======= ESCOLAS =======
async function escolas() {
  document.getElementById('page-content').innerHTML = loading();
  var data = await api('/escolas?limit=50');
  if (!data) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Gestão de Escolas</div>' +
    '<p class="section-desc">Total de '+fmt(data.meta?data.meta.total:0)+' escolas registadas.</p>' +
    '<div class="search-bar"><input class="search-input" id="esc-q" placeholder="Pesquisar escola..." oninput="pesqEscolas(this.value)"/>' +
    '<select id="esc-tipo" style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);padding:10px 12px;font-size:13px;" onchange="pesqEscolas(document.getElementById(\'esc-q\').value)"><option value="">Todos os Tipos</option><option value="PRIMARIA">Primária (EPC)</option><option value="BASICA">Básica (EB)</option><option value="SECUNDARIA">Secundária</option></select>' +
    '<button class="btn btn-primary" onclick="showModalEscola()">+ Nova Escola</button></div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Lista de Escolas</span><span id="esc-count" style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">'+(data.data?data.data.length:0)+' resultados</span></div>' +
    '<table class="data-table"><thead><tr><th>Nome</th><th>Província</th><th>Tipo</th><th>Alunos</th><th>Professores</th><th>Acções</th></tr></thead><tbody id="esc-body">'+rowsEscolas(data.data||[])+'</tbody></table></div>';
}

function rowsEscolas(list) {
  if (!list.length) return '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Nenhuma escola encontrada</td></tr>';
  return list.map(function(e){
    var bc = e.tipo==='PRIMARIA'?'badge-blue':e.tipo==='BASICA'?'badge-green':'badge-gold';
    var bn = e.tipo==='PRIMARIA'?'EPC':e.tipo==='BASICA'?'EB':'Secundária';
    return '<tr><td><strong style="color:var(--text-primary)">'+e.nome+'</strong><br><span style="font-size:11px;color:var(--text-muted)">'+(e.distrito?e.distrito.nome:'')+'</span></td><td>'+(e.provincia?e.provincia.nome:'')+'</td><td><span class="badge '+bc+'">'+bn+'</span></td><td>'+fmt(e._count?e._count.alunos:0)+'</td><td>'+fmt(e._count?e._count.professores:0)+'</td><td><button class="btn btn-outline btn-sm" onclick="verEscola('+e.id+')">Ver</button></td></tr>';
  }).join('');
}

async function pesqEscolas(q) {
  var tipo = document.getElementById('esc-tipo')?document.getElementById('esc-tipo').value:'';
  var d = await api('/escolas?limit=100'+(q?'&search='+encodeURIComponent(q):'')+(tipo?'&tipo='+tipo:''));
  if (d&&d.data){ document.getElementById('esc-body').innerHTML=rowsEscolas(d.data); document.getElementById('esc-count').textContent=d.data.length+' resultados'; }
}

async function verEscola(id) {
  var e = await api('/escolas/'+id);
  if (e) alert('Escola: '+e.nome+'\nTipo: '+e.tipo+'\nAlunos: '+(e._count?e._count.alunos:'N/D')+'\nProfessores: '+(e._count?e._count.professores:'N/D'));
}

function showModalEscola() {
  var o = document.createElement('div');
  o.className='modal-overlay';
  o.innerHTML='<div class="modal"><div class="modal-title">Registar Nova Escola</div><div class="modal-grid"><div class="form-group"><label>Código</label><input type="text" id="m-cod" placeholder="Ex: ZB-010"/></div><div class="form-group"><label>Tipo</label><select id="m-tipo"><option value="PRIMARIA">Primária (EPC)</option><option value="BASICA">Básica (EB)</option><option value="SECUNDARIA">Secundária</option></select></div><div class="form-group" style="grid-column:1/-1"><label>Nome</label><input type="text" id="m-nome" placeholder="Nome completo da escola"/></div><div class="form-group"><label>ID Província (1-11)</label><input type="number" id="m-prov" placeholder="1" min="1" max="11"/></div><div class="form-group"><label>ID Distrito</label><input type="number" id="m-dist" placeholder="1" min="1"/></div></div><div class="modal-footer"><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancelar</button><button class="btn btn-primary" onclick="criarEscola()">Guardar</button></div></div>';
  o.addEventListener('click',function(ev){ if(ev.target===o) o.remove(); });
  document.body.appendChild(o);
}

async function criarEscola() {
  var body={ codigo:document.getElementById('m-cod').value, nome:document.getElementById('m-nome').value, tipo:document.getElementById('m-tipo').value, provinciaId:parseInt(document.getElementById('m-prov').value), distritoId:parseInt(document.getElementById('m-dist').value) };
  var r = await api('/escolas',{ method:'POST', body:JSON.stringify(body) });
  if (r&&r.id){ document.querySelector('.modal-overlay').remove(); alert('Escola criada com sucesso!'); escolas(); }
  else alert('Erro: '+(r&&r.error?r.error:'desconhecido'));
}

// ======= ALUNOS =======
async function alunos() {
  document.getElementById('page-content').innerHTML = loading();
  var data = await api('/alunos?limit=50');
  if (!data) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Gestão de Alunos</div><p class="section-desc">Total de '+fmt(data.meta?data.meta.total:0)+' alunos.</p>' +
    '<div class="search-bar"><input class="search-input" id="al-q" placeholder="Pesquisar aluno..." oninput="pesqAlunos(this.value)"/>' +
    '<select id="al-st" style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);padding:10px 12px;font-size:13px;" onchange="pesqAlunos(document.getElementById(\'al-q\').value)"><option value="">Todos</option><option value="ATIVO">Activo</option><option value="EVADIDO">Evadido</option><option value="TRANSFERIDO">Transferido</option></select>' +
    '<button class="btn btn-primary" onclick="alert(\'Formulário de nova matrícula\')">+ Nova Matrícula</button></div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Registo de Alunos</span><span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">'+fmt(data.meta?data.meta.total:0)+' total</span></div>' +
    '<table class="data-table"><thead><tr><th>Nome</th><th>Escola</th><th>Turma</th><th>Género</th><th>Estado</th><th>Acções</th></tr></thead><tbody id="al-body">'+rowsAlunos(data.data||[])+'</tbody></table></div>';
}

function rowsAlunos(list) {
  if (!list.length) return '<tr><td colspan="6" style="text-align:center;color:var(--text-muted)">Nenhum aluno encontrado</td></tr>';
  return list.map(function(a){
    var turma = a.matriculas&&a.matriculas.length?a.matriculas[0].turma.nome:'—';
    var sc = a.status==='ATIVO'?'badge-green':a.status==='EVADIDO'?'badge-red':'badge-blue';
    return '<tr><td><strong style="color:var(--text-primary)">'+a.nome+' '+a.apelido+'</strong></td><td style="font-size:12px">'+(a.escola?a.escola.nome:'—')+'</td><td>'+turma+'</td><td><span class="badge '+(a.genero==='F'?'badge-gold':'badge-blue')+'">'+(a.genero==='F'?'Feminino':'Masculino')+'</span></td><td><span class="badge '+sc+'">'+a.status+'</span></td><td><button class="btn btn-outline btn-sm" onclick="verBoletim('+a.id+')">Boletim</button></td></tr>';
  }).join('');
}

async function pesqAlunos(q) {
  var st=document.getElementById('al-st')?document.getElementById('al-st').value:'';
  var d=await api('/alunos?limit=100'+(q?'&search='+encodeURIComponent(q):'')+(st?'&status='+st:''));
  if(d&&d.data) document.getElementById('al-body').innerHTML=rowsAlunos(d.data);
}

async function verBoletim(id) {
  var b=await api('/alunos/'+id+'/boletim');
  if(!b) return;
  var msg='Boletim: '+b.aluno.nome+' ('+b.anoLetivo+')\n\n';
  if(b.disciplinas&&b.disciplinas.length) b.disciplinas.forEach(function(d){ msg+=d.disciplina+': '+d.media.toFixed(1)+' ('+(d.aprovado?'APROVADO':'REPROVADO')+')\n'; });
  msg+='\nMédia Geral: '+b.mediaGeral+'\nResultado: '+(b.aprovado?'APROVADO':'REPROVADO');
  alert(msg);
}

// ======= PROFESSORES =======
async function professores() {
  document.getElementById('page-content').innerHTML = loading();
  var data = await api('/professores?limit=50');
  if (!data) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Gestão de Professores</div><p class="section-desc">Total de '+fmt(data.meta?data.meta.total:0)+' professores.</p>' +
    '<div class="search-bar"><input class="search-input" id="pr-q" placeholder="Pesquisar professor..." oninput="pesqProfs(this.value)"/><button class="btn btn-primary" onclick="alert(\'Formulário de novo professor\')">+ Novo Professor</button></div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Lista de Professores</span></div>' +
    '<table class="data-table"><thead><tr><th>Nome</th><th>Escola</th><th>Habilitação</th><th>Estado</th></tr></thead><tbody id="pr-body">'+rowsProfs(data.data||[])+'</tbody></table></div>';
}

function rowsProfs(list) {
  if (!list.length) return '<tr><td colspan="4" style="text-align:center;color:var(--text-muted)">Nenhum professor encontrado</td></tr>';
  return list.map(function(p){
    var escola=p.escolas&&p.escolas.length?p.escolas[0].escola.nome:'—';
    var hc=p.habilitacao==='MESTRADO'||p.habilitacao==='DOUTORAMENTO'?'badge-gold':p.habilitacao==='LICENCIATURA'?'badge-green':'badge-blue';
    return '<tr><td><strong style="color:var(--text-primary)">'+p.nome+' '+p.apelido+'</strong></td><td style="font-size:12px">'+escola+'</td><td><span class="badge '+hc+'">'+p.habilitacao+'</span></td><td><span class="badge '+(p.ativo?'badge-green':'badge-red')+'">'+(p.ativo?'Activo':'Inactivo')+'</span></td></tr>';
  }).join('');
}

async function pesqProfs(q) {
  var d=await api('/professores?limit=100'+(q?'&search='+encodeURIComponent(q):''));
  if(d&&d.data) document.getElementById('pr-body').innerHTML=rowsProfs(d.data);
}

// ======= NOTAS =======
async function notas() {
  document.getElementById('page-content').innerHTML = loading();
  var data = await api('/notas?limit=50');
  if (!data) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Notas e Avaliações</div><p class="section-desc">Lançamento e consulta de notas.</p>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Notas Lançadas</span><button class="btn btn-gold btn-sm" onclick="alert(\'Lançamento em lote\')">Lançar em Lote</button></div>' +
    '<table class="data-table"><thead><tr><th>Aluno</th><th>Disciplina</th><th>Trimestre</th><th>Nota</th><th>Resultado</th></tr></thead><tbody>' +
    (data.length?data.map(function(n){
      return '<tr><td><strong style="color:var(--text-primary)">'+(n.aluno?n.aluno.nome+' '+n.aluno.apelido:'—')+'</strong></td><td>'+(n.disciplina?n.disciplina.nome:'—')+'</td><td style="font-family:var(--font-mono)">'+n.trimestre+'º Trim.</td><td style="font-family:var(--font-mono);'+(n.valor<10?'color:var(--accent-red)':'')+'">'+n.valor+'</td><td><span class="badge '+(n.valor>=10?'badge-green':'badge-red')+'">'+(n.valor>=10?'Aprovado':'Reprovado')+'</span></td></tr>';
    }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Nenhuma nota lançada</td></tr>') +
    '</tbody></table></div>';
}

// ======= MATRÍCULAS =======
async function matriculas() {
  document.getElementById('page-content').innerHTML = loading();
  var gen  = await api('/estatisticas/genero');
  var prov = await api('/estatisticas/matriculas-por-provincia');
  if (!gen) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Estatísticas de Matrículas</div><p class="section-desc">Análise por género e região.</p>' +
    '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">'+kpi('green','Total',fmtK(gen.total),'Alunos','')+kpi('blue','Masculino',fmtK(gen.masculino),gen.pctMasculino+'%','')+kpi('gold','Feminino',fmtK(gen.feminino),gen.pctFeminino+'%','')+'</div>' +
    '<div class="charts-row"><div class="chart-card"><div class="chart-header"><div><div class="chart-title">Por Género</div></div></div><div class="chart-container"><canvas id="ch-gen"></canvas></div></div><div class="chart-card"><div class="chart-header"><div><div class="chart-title">Por Província</div></div></div><div class="chart-container"><canvas id="ch-prv"></canvas></div></div></div>';

  setTimeout(function(){
    renderChart('ch-gen',{ type:'doughnut', data:{ labels:['Masculino','Feminino'], datasets:[{ data:[gen.masculino,gen.feminino], backgroundColor:['#4A90D9','#FCB017'], borderWidth:0 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:10 }, boxWidth:10 } } } } });
    if(prov){ var s=prov.sort(function(a,b){return b.totalAlunos-a.totalAlunos;}); renderChart('ch-prv',{ type:'bar', data:{ labels:s.map(function(p){return p.nome;}), datasets:[{ label:'Alunos', data:s.map(function(p){return p.totalAlunos;}), backgroundColor:'rgba(0,154,68,0.6)', borderRadius:3 }] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ display:false } } } } }); }
  },100);
}

// ======= DESEMPENHO =======
async function desempenho() {
  document.getElementById('page-content').innerHTML = loading();
  var rel = await api('/relatorios/desempenho');
  if (!rel) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Desempenho Acadêmico</div><p class="section-desc">Médias por disciplina.</p>' +
    '<div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">'+kpi('green','Média Geral',rel.mediaGeral||'N/D','Escala 0–20','')+kpi('blue','Disciplinas',rel.porDisciplina?rel.porDisciplina.length:0,'Avaliadas','')+'</div>' +
    '<div class="chart-card" style="margin-bottom:24px"><div class="chart-header"><div><div class="chart-title">Média por Disciplina</div></div></div><div class="chart-container" style="height:280px"><canvas id="ch-dsc"></canvas></div></div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Detalhe</span><button class="btn btn-gold btn-sm" onclick="exportPDF()">Relatório PDF</button></div>' +
    '<table class="data-table"><thead><tr><th>Disciplina</th><th>Média</th><th>Total Notas</th></tr></thead><tbody>' +
    (rel.porDisciplina&&rel.porDisciplina.length?rel.porDisciplina.map(function(d){ return '<tr><td><strong style="color:var(--text-primary)">'+d.disciplina+'</strong></td><td style="font-family:var(--font-mono);color:'+(parseFloat(d.media)>=10?'var(--accent)':'var(--accent-red)')+'">'+( d.media||'N/D')+'</td><td style="font-family:var(--font-mono)">'+d.totalNotas+'</td></tr>'; }).join(''):'<tr><td colspan="3" style="text-align:center;color:var(--text-muted)">Sem dados</td></tr>') +
    '</tbody></table></div>';

  setTimeout(function(){
    if(!rel.porDisciplina||!rel.porDisciplina.length) return;
    renderChart('ch-dsc',{ type:'bar', data:{ labels:rel.porDisciplina.map(function(d){return d.disciplina;}), datasets:[{ data:rel.porDisciplina.map(function(d){return parseFloat(d.media)||0;}), backgroundColor:rel.porDisciplina.map(function(d){return parseFloat(d.media)>=10?'rgba(0,154,68,0.7)':'rgba(210,16,52,0.7)';}), borderRadius:4 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } }, scales:{ x:{ ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ min:0, max:20, ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ color:'rgba(255,255,255,0.06)' } } } } });
  },100);
}

// ======= EVASÃO =======
async function evasao() {
  document.getElementById('page-content').innerHTML = loading();
  var rel = await api('/relatorios/evasao');
  if (!rel) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Evasão Escolar</div><p class="section-desc">Abandono escolar por região.</p>' +
    '<div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">'+kpi('red','Taxa Nacional',rel.taxaNacional+'%','Média','')+kpi('red','Evadidos',fmtK(rel.totalEvadidos),'Total','')+kpi('blue','Base',fmtK(rel.totalAlunos),'Total alunos','')+'</div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Por Província</span><button class="btn btn-gold btn-sm" onclick="exportPDF()">Relatório PDF</button></div>' +
    '<table class="data-table"><thead><tr><th>Província</th><th>Total</th><th>Evadidos</th><th>Taxa</th><th>Situação</th></tr></thead><tbody>' +
    (rel.porProvincia&&rel.porProvincia.length?rel.porProvincia.sort(function(a,b){return parseFloat(b.taxa)-parseFloat(a.taxa);}).map(function(p){
      var t=parseFloat(p.taxa);
      return '<tr><td><strong style="color:var(--text-primary)">'+p.provincia+'</strong></td><td style="font-family:var(--font-mono)">'+fmtK(p.totalAlunos)+'</td><td style="font-family:var(--font-mono)">'+fmtK(p.evadidos)+'</td><td style="font-family:var(--font-mono)">'+p.taxa+'%</td><td><span class="badge '+(t<=7?'badge-green':t<=10?'badge-gold':'badge-red')+'">'+(t<=7?'Controlado':t<=10?'Atenção':'Crítico')+'</span></td></tr>';
    }).join(''):'<tr><td colspan="5" style="text-align:center;color:var(--text-muted)">Sem dados</td></tr>') +
    '</tbody></table></div>';
}

// ======= RH =======
async function rh() {
  document.getElementById('page-content').innerHTML = loading();
  var ratio = await api('/estatisticas/ratio-professor-aluno');
  if (!ratio) { document.getElementById('page-content').innerHTML = erro(); return; }
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Recursos Humanos</div><p class="section-desc">Ratio professor/aluno por província.</p>' +
    '<div class="chart-card" style="margin-bottom:24px"><div class="chart-header"><div><div class="chart-title">Ratio por Província</div><div class="chart-subtitle">Linha amarela = meta 1:35</div></div></div><div class="chart-container" style="height:280px"><canvas id="ch-rat"></canvas></div></div>' +
    '<div class="table-card"><div class="table-header"><span class="table-title">Detalhe</span></div>' +
    '<table class="data-table"><thead><tr><th>Província</th><th>Professores</th><th>Alunos</th><th>Ratio</th><th>Status</th></tr></thead><tbody>' +
    ratio.map(function(r){
      var sc=r.status==='ADEQUADO'?'badge-green':r.status==='EXCEDENTE'?'badge-blue':r.status==='ATENCAO'?'badge-gold':'badge-red';
      return '<tr><td><strong style="color:var(--text-primary)">'+r.provincia+'</strong></td><td style="font-family:var(--font-mono)">'+fmtK(r.totalProfessores)+'</td><td style="font-family:var(--font-mono)">'+fmtK(r.totalAlunos)+'</td><td style="font-family:var(--font-mono)">1:'+(r.ratio||'—')+'</td><td><span class="badge '+sc+'">'+(r.status||'N/D')+'</span></td></tr>';
    }).join('') +
    '</tbody></table></div>';

  setTimeout(function(){
    var lbl=ratio.map(function(r){return r.provincia;});
    var vals=ratio.map(function(r){return r.ratio||0;});
    renderChart('ch-rat',{ type:'bar', data:{ labels:lbl, datasets:[ { label:'Ratio real', data:vals, backgroundColor:vals.map(function(v){return v<=35?'rgba(0,154,68,0.7)':v<=40?'rgba(252,176,23,0.7)':'rgba(210,16,52,0.7)';}), borderRadius:3 }, { label:'Meta (35)', data:Array(lbl.length).fill(35), type:'line', borderColor:'#FCB017', borderDash:[4,4], borderWidth:1.5, pointRadius:0 } ] }, options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ labels:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:10 }, boxWidth:10 } } }, scales:{ x:{ ticks:{ color:'#4A5A7A', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ color:'rgba(255,255,255,0.04)' } }, y:{ ticks:{ color:'#8B9DBF', font:{ family:'IBM Plex Mono', size:9 } }, grid:{ display:false } } } } });
  },100);
}

// ======= RELATÓRIOS =======
function relatorios() {
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Central de Relatórios</div><p class="section-desc">Geração e exportação de relatórios oficiais.</p>' +
    '<div class="two-col"><div>' +
    relCard('Matrículas Anual','Total por província e género','/relatorios/matriculas-anual') +
    relCard('Desempenho Académico','Médias por disciplina','/relatorios/desempenho') +
    relCard('Evasão Escolar','Abandono por região','/relatorios/evasao') +
    relCard('Ratio Prof/Aluno','Por província','/estatisticas/ratio-professor-aluno') +
    '</div><div>' +
    '<div style="background:var(--bg-card2);border:1px solid var(--border-accent);border-radius:var(--radius);padding:20px">' +
    '<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:12px">URL da API</div>' +
    '<code style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);word-break:break-all">'+API_URL+'</code>' +
    '<div style="margin-top:16px;font-size:11px;color:var(--text-muted);margin-bottom:8px">Endpoints:</div>' +
    ['/escolas','/alunos','/professores','/notas','/estatisticas/dashboard','/relatorios/desempenho'].map(function(e){ return '<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-top:4px">GET '+e+'</div>'; }).join('') +
    '</div></div></div>';
}

function relCard(nome, desc, endpoint) {
  return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px"><div style="flex:1"><div style="font-size:14px;color:var(--text-primary);font-weight:600">'+nome+'</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">'+desc+'</div></div><div style="display:flex;gap:8px"><button class="btn btn-outline btn-sm" onclick="prevRel(\''+endpoint+'\')">Ver JSON</button><button class="btn btn-gold btn-sm" onclick="exportPDF(\''+nome+'\')">PDF</button></div></div>';
}

async function prevRel(ep) {
  var d = await api(ep);
  if (d) alert(JSON.stringify(d,null,2).substring(0,600)+'\n[...truncado]');
}

function exportPDF(nome) {
  alert('Exportar PDF: "'+(nome||'Relatório')+'"\n\nEm produção geraria um PDF oficial com cabeçalho do MEC.');
}

setDate();
setInterval(setDate, 60000);
