// ============================================
// SIGE — Frontend ligado à API Railway
// MEC Moçambique
// ============================================

var API_URL = 'https://sige-mec-backend-production.up.railway.app/api/v1';

// ============================================================
// VALIDAÇÃO — Erros por campo
// ============================================================
function campoErro(id, msg) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--accent-red)';
  el.style.boxShadow   = '0 0 0 3px rgba(210,16,52,0.15)';
  // Remove hint anterior se existir
  var old = document.getElementById(id + '-err');
  if (old) old.remove();
  var hint = document.createElement('small');
  hint.id = id + '-err';
  hint.style.cssText = 'color:var(--accent-red);font-size:10px;display:block;margin-top:3px';
  hint.textContent = msg;
  el.parentNode.appendChild(hint);
  el.focus();
}

function campoOk(id) {
  var el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '';
  el.style.boxShadow   = '';
  var old = document.getElementById(id + '-err');
  if (old) old.remove();
}

function limparErrosCampo() {
  document.querySelectorAll('[id$="-err"]').forEach(function(e) { e.remove(); });
  document.querySelectorAll('input, select').forEach(function(e) {
    e.style.borderColor = '';
    e.style.boxShadow   = '';
  });
}

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
    '<button class="btn btn-primary" onclick="showModalEscolaCompleto()">+ Nova Escola</button></div>' +
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
    '<button class="btn btn-primary" onclick="showModalAlunoCompleto()">+ Nova Matrícula</button></div>' +
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
    '<div class="search-bar"><input class="search-input" id="pr-q" placeholder="Pesquisar professor..." oninput="pesqProfs(this.value)"/><button class="btn btn-primary" onclick="showModalProfessorCompleto()">+ Novo Professor</button></div>' +
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
// Estado global das notas
// ======= NOTAS E AVALIAÇÕES =======
var notasEstado = {
  turmaId: null, disciplinaId: null,
  trimestre: 1,  anoLetivo: new Date().getFullYear(),
  turmaNome: '', classe: 0,
  matriculas: [], disciplinas: [],
  professorId: 1
};

async function notas() {
  document.getElementById('page-content').innerHTML = loading();
  var ano    = notasEstado.anoLetivo;
  var turmas = await api('/turmas?anoLetivo=' + ano);

  if (!turmas || !turmas.length) {
    document.getElementById('page-content').innerHTML =
      '<div class="section-title">Notas e Avaliações</div>' +
      '<div class="alert alert-warning">Nenhuma turma encontrada para ' + ano + '. Registe turmas primeiro.</div>';
    return;
  }

  // Agrupar por classe
  var porClasse = {};
  turmas.forEach(function(t) {
    var c = t.classe;
    if (!porClasse[c]) porClasse[c] = [];
    porClasse[c].push(t);
  });

  var html = '';
  html += '<div class="section-title">Notas e Avaliações</div>';
  html += '<p class="section-desc">Seleccione a classe e a turma para lançar notas.</p>';

  // Selector trimestre + ano
  html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap;background:var(--bg-card);padding:14px 18px;border-radius:10px;border:1px solid var(--border)">';
  html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Trimestre:</div>';
  html += '<div style="display:flex;gap:8px">';
  [1,2,3].forEach(function(t) {
    html += '<button id="btn-trim-'+t+'" onclick="notasEstado.trimestre='+t+';[1,2,3].forEach(function(x){var b=document.getElementById(\'btn-trim-\'+x);b.className=\'btn \'+(x==='+t+'?\'btn-primary\':\'btn-outline\');});"';
    html += ' class="btn ' + (t===1?'btn-primary':'btn-outline') + '">' + t + 'º Trim.</button>';
  });
  html += '</div>';
  html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Ano:</div>';
  html += '<select onchange="notasEstado.anoLetivo=parseInt(this.value);notas()" style="background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);padding:7px 10px;font-size:13px">';
  html += '<option value="'+ano+'">'+ano+'</option>';
  html += '<option value="'+(ano-1)+'">'+(ano-1)+'</option>';
  html += '</select>';
  html += '</div>';

  // Cards por classe e turma
  Object.keys(porClasse).sort(function(a,b){return parseInt(a)-parseInt(b);}).forEach(function(classe) {
    html += '<div style="margin-bottom:24px">';
    html += '<div style="font-size:14px;font-weight:700;color:#fff;background:var(--accent);padding:8px 16px;border-radius:8px;display:inline-block;margin-bottom:12px">';
    html += classe + 'ª Classe</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:12px">';
    porClasse[classe].forEach(function(turma) {
      html += '<div onclick="abrirTurmaNotas('+turma.id+',\''+turma.nome+'\','+turma.classe+')"';
      html += ' style="background:var(--bg-card);border:2px solid var(--border);border-radius:12px;padding:20px 28px;cursor:pointer;text-align:center;transition:all 0.2s;min-width:110px"';
      html += ' onmouseover="this.style.borderColor=\'var(--accent)\';this.style.boxShadow=\'0 4px 16px rgba(0,79,163,0.15)\';this.style.transform=\'translateY(-2px)\'"';
      html += ' onmouseout="this.style.borderColor=\'var(--border)\';this.style.boxShadow=\'none\';this.style.transform=\'none\'">';
      html += '<div style="font-size:28px;font-weight:700;color:var(--accent);font-family:var(--font-mono)">'+turma.nome+'</div>';
      html += '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:1px">Turma</div>';
      html += '</div>';
    });
    html += '</div></div>';
  });

  document.getElementById('page-content').innerHTML = html;
}

async function abrirTurmaNotas(turmaId, turmaNome, classe) {
  document.getElementById('page-content').innerHTML = loading();
  notasEstado.turmaId  = turmaId;
  notasEstado.turmaNome = turmaNome;
  notasEstado.classe    = classe;

  // Buscar alunos matriculados na turma
  var matriculas = await api('/matriculas?turmaId=' + turmaId + '&anoLetivo=' + notasEstado.anoLetivo);
  notasEstado.matriculas = matriculas || [];

  // Buscar disciplinas do professor logado via /auth/me
  var disciplinas = [];
  if (currentUser && currentUser.role === 'PROFESSOR') {
    var meData = await api('/auth/me');
    if (meData && meData.professor && meData.professor.disciplinas && meData.professor.disciplinas.length) {
      disciplinas = meData.professor.disciplinas.map(function(d) { return d.disciplina; });
    }
    // Alternativa: buscar por email na lista de professores
    if (!disciplinas.length) {
      var profData = await api('/professores?limit=500');
      if (profData && profData.data) {
        var meProf = profData.data.find(function(p) {
          return p.email && currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase();
        });
        if (meProf && meProf.disciplinas && meProf.disciplinas.length) {
          disciplinas = meProf.disciplinas.map(function(d) { return d.disciplina; });
          // Guardar professorId no estado
          notasEstado.professorId = meProf.id;
        }
      }
    }
  }
  // Admins e directores vêem todas as disciplinas
  if (!disciplinas.length) {
    disciplinas = [
      {id:1,nome:'Português'},{id:2,nome:'Matemática'},{id:3,nome:'Inglês'},
      {id:4,nome:'História'},{id:5,nome:'Geografia'},{id:6,nome:'Biologia'},
      {id:7,nome:'Física'},{id:8,nome:'Química'},{id:9,nome:'Educação Física'},{id:10,nome:'TIC'}
    ];
  }
  notasEstado.disciplinas = disciplinas;

  var html = '';
  // Navegação
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">';
  html += '<button class="btn btn-outline" onclick="notas()">← Voltar</button>';
  html += '<div>';
  html += '<div class="section-title" style="margin:0">'+classe+'ª Classe — Turma '+turmaNome+'</div>';
  html += '<div class="section-desc" style="margin:0">'+notasEstado.trimestre+'º Trimestre · '+notasEstado.anoLetivo+'</div>';
  html += '</div></div>';

  // Disciplinas disponíveis
  html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:18px;margin-bottom:20px">';
  html += '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:12px">Seleccione a Disciplina</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
  disciplinas.forEach(function(d) {
    html += '<button onclick="abrirDisciplinaNotas('+turmaId+','+d.id+',\''+d.nome+'\',\''+turmaNome+'\','+classe+')"';
    html += ' class="btn btn-outline" style="font-size:13px;padding:8px 16px">'+d.nome+'</button>';
  });
  html += '</div></div>';

  // Pré-visualização da lista de alunos
  if (notasEstado.matriculas.length) {
    var ordenados = notasEstado.matriculas.slice().sort(function(a,b) {
      return (a.aluno.apelido+a.aluno.nome).localeCompare(b.aluno.apelido+b.aluno.nome);
    });
    html += '<div class="table-card">';
    html += '<div class="table-header"><span class="table-title">Alunos ('+ordenados.length+')</span></div>';
    html += '<table class="data-table"><thead><tr><th>Nº</th><th>Nome</th><th>Género</th></tr></thead><tbody>';
    ordenados.forEach(function(m,i) {
      html += '<tr>';
      html += '<td style="font-family:var(--font-mono);color:var(--text-muted)">'+(i+1)+'</td>';
      html += '<td><strong style="color:var(--text-primary)">'+m.aluno.apelido+', '+m.aluno.nome+'</strong></td>';
      html += '<td><span class="badge '+(m.aluno.genero==='F'?'badge-gold':'badge-blue')+'">'+(m.aluno.genero==='F'?'Fem.':'Masc.')+'</span></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
  } else {
    html += '<div class="alert alert-warning">Nenhum aluno matriculado nesta turma.</div>';
  }

  document.getElementById('page-content').innerHTML = html;
}

async function abrirDisciplinaNotas(turmaId, disciplinaId, disciplinaNome, turmaNome, classe) {
  notasEstado.disciplinaId   = disciplinaId;
  notasEstado.disciplinaNome = disciplinaNome;
  document.getElementById('page-content').innerHTML = loading();

  // Buscar notas já lançadas
  var notasExist = await api('/notas?turmaId='+turmaId+'&disciplinaId='+disciplinaId+'&anoLetivo='+notasEstado.anoLetivo+'&trimestre='+notasEstado.trimestre);
  var notasMap = {};
  if (notasExist) {
    notasExist.forEach(function(n) { notasMap[n.alunoId] = n; });
  }

  // Ordenar alunos alfabeticamente
  var alunos = (notasEstado.matriculas || []).slice().sort(function(a,b) {
    return (a.aluno.apelido+a.aluno.nome).localeCompare(b.aluno.apelido+b.aluno.nome);
  });
  notasEstado.alunosActuais = alunos;

  var html = '';
  // Navegação
  html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">';
  html += '<button class="btn btn-outline" onclick="abrirTurmaNotas('+turmaId+',\''+turmaNome+'\','+classe+')">← Voltar</button>';
  html += '<div>';
  html += '<div class="section-title" style="margin:0">'+disciplinaNome+' — '+classe+'ª Classe, Turma '+turmaNome+'</div>';
  html += '<div class="section-desc" style="margin:0">'+notasEstado.trimestre+'º Trimestre · '+notasEstado.anoLetivo+'</div>';
  html += '</div>';
  html += '<button class="btn btn-primary" style="margin-left:auto" onclick="guardarTodasNotas('+turmaId+','+disciplinaId+')">💾 Guardar Todas as Notas</button>';
  html += '</div>';

  // Legenda das avaliações
  html += '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:12px;color:var(--text-secondary)">';
  html += '<strong>Legenda:</strong> Av1 = Avaliação 1 &nbsp;|&nbsp; Av2 = Avaliação 2 &nbsp;|&nbsp; Av3 = Avaliação 3 &nbsp;|&nbsp; APT = Avaliação Final do Trimestre &nbsp;|&nbsp; Média calculada automaticamente (escala 0–20)';
  html += '</div>';

  // Tabela de notas
  html += '<div class="table-card">';
  html += '<div class="table-header">';
  html += '<span class="table-title">Lançamento de Notas ('+alunos.length+' alunos)</span>';
  html += '<button class="btn btn-outline btn-sm" onclick="exportarExcel(\'notas\')">📊 Exportar Excel</button>';
  html += '</div>';

  html += '<table class="data-table" style="min-width:700px">';
  html += '<thead><tr>';
  html += '<th style="width:30px">Nº</th>';
  html += '<th>Nome Completo</th>';
  html += '<th style="width:80px;text-align:center">Av1<br><small style="font-weight:400;color:var(--text-muted)">(0–20)</small></th>';
  html += '<th style="width:80px;text-align:center">Av2<br><small style="font-weight:400;color:var(--text-muted)">(0–20)</small></th>';
  html += '<th style="width:80px;text-align:center">Av3<br><small style="font-weight:400;color:var(--text-muted)">(0–20)</small></th>';
  html += '<th style="width:80px;text-align:center">APT<br><small style="font-weight:400;color:var(--text-muted)">(0–20)</small></th>';
  html += '<th style="width:70px;text-align:center">Média</th>';
  html += '<th style="width:80px;text-align:center">Result.</th>';
  html += '</tr></thead><tbody>';

  alunos.forEach(function(m, i) {
    var aId  = m.aluno.id;
    var nota = notasMap[aId];
    // Tentar reconstituir valores anteriores — guardamos como valor único (média)
    // Se já existe nota, pré-preencher APT com o valor existente
    var aptVal = nota ? nota.valor : '';

    html += '<tr id="linha-'+aId+'">';
    html += '<td style="font-family:var(--font-mono);color:var(--text-muted);text-align:center">'+(i+1)+'</td>';
    html += '<td>';
    html += '<strong style="color:var(--text-primary)">'+m.aluno.apelido+', '+m.aluno.nome+'</strong>';
    html += '</td>';

    // Campos Av1, Av2, Av3, APT
    ['av1','av2','av3','apt'].forEach(function(campo) {
      var val = campo === 'apt' && aptVal !== '' ? aptVal : '';
      html += '<td style="padding:6px 4px">';
      html += '<input type="number" id="'+campo+'-'+aId+'"';
      html += ' min="0" max="20" step="0.1"';
      html += ' value="'+val+'"';
      html += ' onchange="calcularMedia(\''+aId+'\')"';
      html += ' style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:5px;padding:5px 6px;font-size:13px;font-family:var(--font-mono);text-align:center;color:var(--text-primary)"';
      html += ' placeholder="—"/>';
      html += '</td>';
    });

    // Média e resultado (calculados automaticamente)
    html += '<td style="text-align:center" id="media-'+aId+'">';
    if (aptVal !== '') {
      var m2 = parseFloat(aptVal);
      html += '<strong style="font-family:var(--font-mono);color:'+(m2>=10?'var(--accent)':'var(--accent-red)')+'">'+m2.toFixed(1)+'</strong>';
    } else {
      html += '<span style="color:var(--text-muted)">—</span>';
    }
    html += '</td>';
    html += '<td style="text-align:center" id="result-'+aId+'">';
    if (aptVal !== '') {
      var m3 = parseFloat(aptVal);
      html += '<span class="badge '+(m3>=10?'badge-green':'badge-red')+'">'+(m3>=10?'APR':'REP')+'</span>';
    } else {
      html += '<span style="color:var(--text-muted)">—</span>';
    }
    html += '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  document.getElementById('page-content').innerHTML = html;
}

// Calcular média automaticamente ao digitar
function calcularMedia(aId) {
  var vals = ['av1','av2','av3','apt'].map(function(c) {
    var v = parseFloat(document.getElementById(c+'-'+aId).value);
    return isNaN(v) ? null : v;
  }).filter(function(v) { return v !== null; });

  var mediaEl  = document.getElementById('media-'+aId);
  var resultEl = document.getElementById('result-'+aId);
  if (!vals.length) {
    mediaEl.innerHTML  = '<span style="color:var(--text-muted)">—</span>';
    resultEl.innerHTML = '<span style="color:var(--text-muted)">—</span>';
    return;
  }
  var media = Math.round((vals.reduce(function(s,v){return s+v;},0) / vals.length) * 10) / 10;
  var cor   = media >= 10 ? 'var(--accent)' : 'var(--accent-red)';
  mediaEl.innerHTML  = '<strong style="font-family:var(--font-mono);color:'+cor+'">'+media.toFixed(1)+'</strong>';
  resultEl.innerHTML = '<span class="badge '+(media>=10?'badge-green':'badge-red')+'">'+(media>=10?'APR':'REP')+'</span>';
}

async function guardarTodasNotas(turmaId, disciplinaId) {
  var alunos = notasEstado.alunosActuais || [];
  if (!alunos.length) { alert('Nenhum aluno para guardar.'); return; }

  var btn = document.querySelector('[onclick*="guardarTodasNotas"]');
  if (btn) { btn.textContent = 'A guardar...'; btn.disabled = true; }

  var lote = [];
  var erros = [];

  alunos.forEach(function(m) {
    var aId = m.aluno.id;
    var vals = ['av1','av2','av3','apt'].map(function(c) {
      var v = parseFloat(document.getElementById(c+'-'+aId).value);
      return isNaN(v) ? null : v;
    }).filter(function(v) { return v !== null; });

    if (!vals.length) return; // Sem notas, ignorar

    // Validar intervalo
    vals.forEach(function(v) {
      if (v < 0 || v > 20) erros.push('Nota inválida ('+v+') para '+m.aluno.apelido+' '+m.aluno.nome);
    });

    var media = Math.round((vals.reduce(function(s,v){return s+v;},0) / vals.length) * 10) / 10;
    lote.push({
      alunoId:      aId,
      disciplinaId: disciplinaId,
      anoLetivo:    notasEstado.anoLetivo,
      trimestre:    notasEstado.trimestre,
      valor:        media,
      professorId:  notasEstado.professorId || 1
    });
  });

  if (erros.length) {
    alert('Erros:\n' + erros.join('\n'));
    if (btn) { btn.textContent = '💾 Guardar Todas as Notas'; btn.disabled = false; }
    return;
  }
  if (!lote.length) {
    alert('Nenhuma nota preenchida.');
    if (btn) { btn.textContent = '💾 Guardar Todas as Notas'; btn.disabled = false; }
    return;
  }

  var r = await api('/notas/lote', { method: 'POST', body: JSON.stringify({ notas: lote, professorId: 1 }) });
  if (r && r.total !== undefined) {
    mostrarSucesso(r.total + ' notas guardadas com sucesso!');
    if (btn) { btn.textContent = '✅ Guardado!'; btn.disabled = false; }
  } else {
    alert('Erro: ' + (r && r.error ? r.error : 'Erro desconhecido'));
    if (btn) { btn.textContent = '💾 Guardar Todas as Notas'; btn.disabled = false; }
  }
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

// ============================================================
// FORMULÁRIOS REAIS — REGISTAR ESCOLA
// ============================================================

// ============================================================
// FORMULÁRIOS REAIS — SEM TEMPLATE LITERALS
// ============================================================

// Modal Escola Completo
// Modal Escola — províncias carregadas da API
async function showModalEscolaCompleto() {
  var o = document.createElement('div');
  o.className = 'modal-overlay';

  // Primeiro carregar províncias da API
  var provincias = await api('/provincias');

  var optsProvs = '<option value="">-- Seleccione --</option>';
  if (provincias && provincias.length) {
    provincias.sort(function(a,b){ return a.nome.localeCompare(b.nome); });
    provincias.forEach(function(p) {
      optsProvs += '<option value="' + p.id + '">' + p.nome + '</option>';
    });
  }

  var html = '';
  html += '<div class="modal" style="max-width:680px">';
  html += '<div class="modal-title">Registar Nova Escola</div>';
  html += '<div class="modal-grid">';
  html += '<div class="form-group"><label>Código *</label><input type="text" id="me-codigo" placeholder="Ex: ZB-010" maxlength="20"/></div>';
  html += '<div class="form-group"><label>Tipo *</label><select id="me-tipo">';
  html += '<option value="PRIMARIA">Primária (EPC)</option>';
  html += '<option value="BASICA">Básica (EB)</option>';
  html += '<option value="SECUNDARIA">Secundária</option>';
  html += '</select></div>';
  html += '<div class="form-group" style="grid-column:1/-1"><label>Nome Completo *</label><input type="text" id="me-nome" placeholder="Ex: EPC 25 de Setembro"/></div>';
  html += '<div class="form-group"><label>Província *</label>';
  html += '<select id="me-prov" onchange="carregarDistritos(this.value)">' + optsProvs + '</select></div>';
  html += '<div class="form-group"><label>Distrito *</label>';
  html += '<select id="me-dist"><option value="">-- Seleccione Província primeiro --</option></select></div>';
  html += '<div class="form-group"><label>Localidade</label><input type="text" id="me-local" placeholder="Ex: Bairro Central"/></div>';
  html += '<div class="form-group"><label>Endereço</label><input type="text" id="me-end" placeholder="Ex: Av. Eduardo Mondlane, 123"/></div>';
  html += '<div class="form-group"><label>Telefone</label><input type="tel" id="me-tel" placeholder="+258 21 000 000" maxlength="20"/></div>';
  html += '<div class="form-group"><label>Email</label><input type="email" id="me-email" placeholder="escola@mec.gov.mz"/></div>';
  html += '<div class="form-group"><label>Latitude (GPS)</label><input type="number" id="me-lat" placeholder="-25.9692" step="0.0001"/></div>';
  html += '<div class="form-group"><label>Longitude (GPS)</label><input type="number" id="me-lng" placeholder="32.5732" step="0.0001"/></div>';
  html += '</div>';
  html += '<div id="me-erro" style="color:var(--accent-red);font-size:12px;margin-top:8px;display:none"></div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancelar</button>';
  html += '<button class="btn btn-primary" id="me-btn" onclick="submeterEscola()">Guardar Escola</button>';
  html += '</div></div>';

  o.innerHTML = html;
  o.addEventListener('click', function(ev) { if (ev.target === o) o.remove(); });
  document.body.appendChild(o);
}

async function carregarDistritos(provId) {
  var sel = document.getElementById('me-dist');
  if (!provId) {
    sel.innerHTML = '<option value="">-- Seleccione Província primeiro --</option>';
    return;
  }
  sel.innerHTML = '<option value="">A carregar distritos...</option>';
  var data = await api('/distritos?provinciaId=' + provId);
  if (!data || !data.length) {
    sel.innerHTML = '<option value="">Sem distritos registados</option>';
    return;
  }
  var opts = '<option value="">-- Seleccione Distrito --</option>';
  data.forEach(function(d) {
    opts += '<option value="' + d.id + '">' + d.nome + '</option>';
  });
  sel.innerHTML = opts;
}

async function submeterEscola() {
  limparErrosCampo();

  var codigo = document.getElementById('me-codigo').value.trim();
  var nome   = document.getElementById('me-nome').value.trim();
  var tipo   = document.getElementById('me-tipo').value;
  var provId = document.getElementById('me-prov').value;
  var distId = document.getElementById('me-dist').value;

  var temErro = false;
  if (!codigo) { campoErro('me-codigo', 'Código obrigatório'); temErro = true; }
  if (!nome)   { campoErro('me-nome',   'Nome obrigatório');   temErro = true; }
  if (!provId) { campoErro('me-prov',   'Seleccione a Província'); temErro = true; }
  if (!distId) { campoErro('me-dist',   'Seleccione o Distrito');  temErro = true; }
  if (temErro) return;

  var btn = document.getElementById('me-btn');
  btn.textContent = 'A guardar...'; btn.disabled = true;

  var lat = parseFloat(document.getElementById('me-lat').value);
  var lng = parseFloat(document.getElementById('me-lng').value);

  var body = {
    codigo: codigo,
    nome: nome,
    tipo: tipo,
    provinciaId: parseInt(provId),
    distritoId:  parseInt(distId),
    localidade:  document.getElementById('me-local').value.trim() || null,
    endereco:    document.getElementById('me-end').value.trim()   || null,
    telefone:    document.getElementById('me-tel').value.trim()   || null,
    email:       document.getElementById('me-email').value.trim() || null,
    latitude:    isNaN(lat) ? null : lat,
    longitude:   isNaN(lng) ? null : lng,
  };

  var r = await api('/escolas', { method: 'POST', body: JSON.stringify(body) });
  if (r && r.id) {
    document.querySelector('.modal-overlay').remove();
    mostrarSucesso('Escola "' + r.nome + '" registada com sucesso!');
    escolas();
  } else {
    campoErro('me-codigo', (r && r.error) ? r.error : 'Erro ao guardar. Verifique os dados.');
    btn.textContent = 'Guardar Escola'; btn.disabled = false;
  }
}

// ============================================================
// Modal Aluno Completo
// ============================================================
function showModalAlunoCompleto() {
  var existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  var o = document.createElement('div');
  o.className = 'modal-overlay';

  var hoje = new Date().toISOString().split('T')[0];
  var anoAtual = new Date().getFullYear();

  // Gerar opções de turma: A-Z, A1-Z1, A2-Z2
  var letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var turmaOpts = '<option value="">-- Sem turma --</option>';
  // Série 0: A-Z
  letras.forEach(function(l) { turmaOpts += '<option value="' + l + '">' + l + '</option>'; });
  // Séries 1-9: A1-Z1, A2-Z2, ...
  for (var n = 1; n <= 9; n++) {
    letras.forEach(function(l) { turmaOpts += '<option value="' + l + n + '">' + l + n + '</option>'; });
  }

  var html = '';
  html += '<div class="modal" style="max-width:680px">';
  html += '<div class="modal-title">Registar Novo Aluno / Nova Matrícula</div>';
  html += '<div class="modal-grid">';

  // Nome e Apelido
  html += '<div class="form-group"><label>Nome *</label><input type="text" id="ma-nome" placeholder="Ex: Ana Beatriz"/></div>';
  html += '<div class="form-group"><label>Apelido *</label><input type="text" id="ma-apelido" placeholder="Ex: Machava"/></div>';

  // Tipo de documento + número
  html += '<div class="form-group"><label>Tipo de Documento</label>';
  html += '<select id="ma-tipo-doc" onchange="actualizarPlaceholderBI()">';
  html += '<option value="BI">Bilhete de Identidade (BI)</option>';
  html += '<option value="CEDULA">Cédula Pessoal</option>';
  html += '<option value="ASSENTO">Assento de Nascimento</option>';
  html += '</select></div>';

  html += '<div class="form-group"><label>Nº do Documento</label>';
  html += '<input type="text" id="ma-bi" placeholder="Ex: 123456789012A" maxlength="20"/>';
  html += '<small id="ma-bi-hint" style="color:var(--text-muted);font-size:10px">BI: 12 dígitos + 1 letra (ex: 123456789012A)</small></div>';

  // Data nascimento e género
  html += '<div class="form-group"><label>Data de Nascimento *</label>';
  html += '<input type="date" id="ma-nasc" max="' + hoje + '"/></div>';
  html += '<div class="form-group"><label>Género *</label><select id="ma-gen">';
  html += '<option value="M">Masculino</option><option value="F">Feminino</option>';
  html += '</select></div>';

  // Código da escola
  html += '<div class="form-group" style="grid-column:1/-1"><label>Código da Escola *</label>';
  html += '<input type="text" id="ma-escola-cod" placeholder="Ex: NP12345" maxlength="15" oninput="this.value=this.value.toUpperCase()"/>';
  html += '<small style="color:var(--text-muted);font-size:10px">';
  html += 'Prefixos: MC=Maputo Cidade · MP=Maputo Prov. · GZ=Gaza · IH=Inhambane · SF=Sofala · MN=Manica · TT=Tete · ZB=Zambézia · NP=Nampula · NS=Niassa · CD=Cabo Delgado';
  html += '</small></div>';

  // Classe
  html += '<div class="form-group"><label>Classe *</label>';
  html += '<select id="ma-classe">';
  html += '<option value="">-- Seleccione a Classe --</option>';
  html += '<option value="1">1ª Classe</option>';
  html += '<option value="2">2ª Classe</option>';
  html += '<option value="3">3ª Classe</option>';
  html += '<option value="4">4ª Classe</option>';
  html += '<option value="5">5ª Classe</option>';
  html += '<option value="6">6ª Classe</option>';
  html += '<option value="7">7ª Classe</option>';
  html += '<option value="8">8ª Classe</option>';
  html += '<option value="9">9ª Classe</option>';
  html += '<option value="10">10ª Classe</option>';
  html += '<option value="11">11ª Classe</option>';
  html += '<option value="12">12ª Classe</option>';
  html += '</select></div>';

  // Turma seleccionável
  html += '<div class="form-group"><label>Turma</label>';
  html += '<select id="ma-turma-nome">' + turmaOpts + '</select></div>';

  // Ano lectivo
  html += '<div class="form-group"><label>Ano Lectivo *</label>';
  html += '<input type="number" id="ma-ano" value="' + anoAtual + '" min="2000" max="2099"/></div>';

  html += '</div>';
  html += '<div id="ma-erro" style="color:var(--accent-red);font-size:12px;margin-top:8px;display:none"></div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancelar</button>';
  html += '<button class="btn btn-primary" id="ma-btn" onclick="submeterAluno()">Guardar Aluno</button>';
  html += '</div></div>';

  o.innerHTML = html;
  o.addEventListener('click', function(ev) { if (ev.target === o) o.remove(); });
  document.body.appendChild(o);
}

function actualizarPlaceholderBI() {
  var tipo  = document.getElementById('ma-tipo-doc').value;
  var input = document.getElementById('ma-bi');
  var hint  = document.getElementById('ma-bi-hint');
  if (tipo === 'BI') {
    input.placeholder = 'Ex: 123456789012A';
    input.maxLength   = 13;
    hint.textContent  = 'BI: 12 dígitos seguidos de 1 letra (ex: 123456789012A)';
  } else if (tipo === 'CEDULA') {
    input.placeholder = 'Ex: 12345';
    input.maxLength   = 5;
    hint.textContent  = 'Cédula Pessoal: 3 a 5 dígitos numéricos';
  } else {
    input.placeholder = 'Ex: 12345';
    input.maxLength   = 10;
    hint.textContent  = 'Assento de Nascimento: número do assento';
  }
}

// Prefixos de escola por província
var PREFIXOS_ESCOLA = {
  MC: 'Maputo Cidade', MP: 'Maputo Província', GZ: 'Gaza',
  IH: 'Inhambane', SF: 'Sofala', MN: 'Manica',
  TT: 'Tete', ZB: 'Zambézia', NP: 'Nampula',
  NS: 'Niassa', CD: 'Cabo Delgado'
};

function validarCodigoEscola(cod) {
  if (!cod) return null;
  cod = cod.toUpperCase().trim();
  // Verificar prefixo (2 ou 3 letras) + mínimo 5 dígitos
  var match = cod.match(/^([A-Z]{2,3})([0-9]{5,})$/);
  if (!match) return 'Formato inválido. Use prefixo + mínimo 5 dígitos (ex: NP12345)';
  var prefixo = match[1];
  if (!PREFIXOS_ESCOLA[prefixo]) {
    return 'Prefixo desconhecido "' + prefixo + '". Use: ' + Object.keys(PREFIXOS_ESCOLA).join(', ');
  }
  return null; // válido
}

async function submeterAluno() {
  var erroEl = document.getElementById('ma-erro');
  erroEl.style.display = 'none';

  var nome      = document.getElementById('ma-nome').value.trim();
  var apelido   = document.getElementById('ma-apelido').value.trim();
  var nasc      = document.getElementById('ma-nasc').value;
  var gen       = document.getElementById('ma-gen').value;
  var tipodoc   = document.getElementById('ma-tipo-doc').value;
  var bi        = document.getElementById('ma-bi').value.trim().toUpperCase();
  var escolaCod = document.getElementById('ma-escola-cod').value.trim().toUpperCase();
  var turmaNome = document.getElementById('ma-turma-nome').value;
  var classe    = document.getElementById('ma-classe').value;
  var anoLetivo = parseInt(document.getElementById('ma-ano').value);

  // Validações obrigatórias — erro por campo
  limparErrosCampo();
  var temErro = false;
  if (!nome)     { campoErro('ma-nome',       'Nome obrigatório');                temErro = true; }
  if (!apelido)  { campoErro('ma-apelido',    'Apelido obrigatório');             temErro = true; }
  if (!nasc)     { campoErro('ma-nasc',       'Data de nascimento obrigatória');  temErro = true; }
  if (!escolaCod){ campoErro('ma-escola-cod', 'Código da escola obrigatório');    temErro = true; }
  if (!classe)   { campoErro('ma-classe',     'Seleccione a classe');             temErro = true; }
  if (temErro) return;

  // Validar código da escola
  var erroEscola = validarCodigoEscola(escolaCod);
  if (erroEscola) { campoErro('ma-escola-cod', erroEscola); return; }

  // Validar documento
  if (bi) {
    if (tipodoc === 'BI' && !/^[0-9]{12}[A-Z]$/.test(bi)) {
      campoErro('ma-bi', 'BI inválido. Formato: 12 dígitos + 1 letra (ex: 123456789012A)'); return;
    }
    if ((tipodoc === 'CEDULA' || tipodoc === 'ASSENTO') && !/^[0-9]{3,5}$/.test(bi)) {
      campoErro('ma-bi', 'Cédula/Assento inválido. Deve ter 3 a 5 dígitos numéricos.'); return;
    }
  }

  var btn = document.getElementById('ma-btn');
  btn.textContent = 'A procurar escola...'; btn.disabled = true;

  // Buscar escola pelo código exacto
  var escola = await api('/escolas/codigo/' + encodeURIComponent(escolaCod));
  if (!escola || !escola.id) {
    campoErro('ma-escola-cod', 'Escola "' + escolaCod + '" não encontrada. Registe a escola primeiro.');
    btn.textContent = 'Guardar Aluno'; btn.disabled = false;
    return;
  }

  btn.textContent = 'A guardar...';

  var body = {
    nome: nome,
    apelido: apelido,
    dataNascimento: nasc,
    genero: gen,
    escolaId: escola.id,
    numeroBI: bi || null,
  };

  var r = await api('/alunos', { method: 'POST', body: JSON.stringify(body) });
  if (r && r.id) {
    // Se escolheu turma, criar/associar turma e matricular
    if (turmaNome) {
      // Buscar turma existente ou criar
      var turmas = await api('/turmas?escolaId=' + escola.id + '&anoLetivo=' + anoLetivo);
      var turma = null;
      if (turmas && turmas.length) {
        turma = turmas.find(function(t) { return t.nome === turmaNome; });
      }
      if (!turma) {
        // Criar turma
        turma = await api('/turmas', { method: 'POST', body: JSON.stringify({
          nome: turmaNome,
          classe: parseInt(classe),
          turno: 'Manhã', anoLetivo: anoLetivo, escolaId: escola.id
        })});
      }
      if (turma && turma.id) {
        await api('/matriculas', { method: 'POST', body: JSON.stringify({
          alunoId: r.id, turmaId: turma.id, anoLetivo: anoLetivo
        })});
      }
    }
    document.querySelector('.modal-overlay').remove();
    mostrarSucesso('Aluno "' + r.nome + ' ' + r.apelido + '" registado com sucesso! (ID: ' + r.id + ')');
    alunos();
  } else {
    campoErro('ma-nome', (r && r.error) ? r.error : 'Erro ao guardar. Tente novamente.');
    btn.textContent = 'Guardar Aluno'; btn.disabled = false;
  }
}

// ============================================================
// ============================================================
// Modal Professor Completo
// ============================================================
// ============================================================
// Modal Professor Completo — com turmas dinâmicas
// ============================================================
function showModalProfessorCompleto() {
  // Remover modal anterior se existir
  var existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  var o = document.createElement('div');
  o.className = 'modal-overlay';

  var html = '';
  html += '<div class="modal" style="max-width:720px">';
  html += '<div class="modal-title">Registar Novo Professor</div>';
  html += '<div class="modal-grid">';

  // Nome e Apelido
  html += '<div class="form-group"><label>Nome *</label><input type="text" id="mp-nome" placeholder="Ex: António"/></div>';
  html += '<div class="form-group"><label>Apelido *</label><input type="text" id="mp-apelido" placeholder="Ex: Mabunda"/></div>';

  // BI
  html += '<div class="form-group"><label>Nº BI *</label>';
  html += '<input type="text" id="mp-bi" placeholder="Ex: 123456789012A" maxlength="13"/>';
  html += '<small style="color:var(--text-muted);font-size:10px">12 dígitos + 1 letra (ex: 123456789012A)</small></div>';

  // NUIT obrigatório
  html += '<div class="form-group"><label>NUIT *</label>';
  html += '<input type="text" id="mp-nuit" placeholder="Ex: 400123456" maxlength="9"/>';
  html += '<small style="color:var(--text-muted);font-size:10px">9 dígitos numéricos — obrigatório</small></div>';

  // Data nascimento e género
  html += '<div class="form-group"><label>Data de Nascimento *</label><input type="date" id="mp-nasc"/></div>';
  html += '<div class="form-group"><label>Género *</label><select id="mp-gen">';
  html += '<option value="M">Masculino</option><option value="F">Feminino</option>';
  html += '</select></div>';

  // Habilitações e Certificado
  html += '<div class="form-group"><label>Habilitações *</label><select id="mp-hab">';
  html += '<option value="MEDIO">Médio</option>';
  html += '<option value="BACHAREL">Bacharelato</option>';
  html += '<option value="LICENCIATURA">Licenciatura</option>';
  html += '<option value="MESTRADO">Mestrado</option>';
  html += '<option value="DOUTORAMENTO">Doutoramento</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>Certificado / Diploma</label>';
  html += '<input type="text" id="mp-cert" placeholder="Ex: CFPP Nampula, 2015"/></div>';

  // Email e Telefone
  html += '<div class="form-group"><label>Email</label>';
  html += '<input type="email" id="mp-email" placeholder="professor@mec.gov.mz"/></div>';
  html += '<div class="form-group"><label>Telefone (+258)</label>';
  html += '<input type="tel" id="mp-tel" placeholder="+258 84 000 0000"/></div>';

  // Código da Escola
  html += '<div class="form-group" style="grid-column:1/-1"><label>Código da Escola *</label>';
  html += '<input type="text" id="mp-escola-cod" placeholder="Ex: NP12345" maxlength="15" oninput="this.value=this.value.toUpperCase()"/>';
  html += '<small style="color:var(--text-muted);font-size:10px">';
  html += 'MC=Maputo Cidade · MP=Maputo Prov. · GZ=Gaza · IH=Inhambane · SF=Sofala · MN=Manica · TT=Tete · ZB=Zambézia · NP=Nampula · NS=Niassa · CD=Cabo Delgado';
  html += '</small></div>';

  // Disciplinas — id, nome e prefixo definidos no mesmo lugar
  var DISCS = [
    { id:1,  nome:'Português',          pref:'P'  },
    { id:2,  nome:'Matemática',         pref:'M'  },
    { id:3,  nome:'Inglês',             pref:'I'  },
    { id:4,  nome:'História',           pref:'H'  },
    { id:5,  nome:'Geografia',          pref:'G'  },
    { id:6,  nome:'Biologia',           pref:'B'  },
    { id:7,  nome:'Física',             pref:'F'  },
    { id:8,  nome:'Química',            pref:'Q'  },
    { id:9,  nome:'Educação Física',    pref:'EF' },
    { id:10, nome:'TIC',                pref:'TI' },
  ];
  html += '<div class="form-group" style="grid-column:1/-1">';
  html += '<label>Disciplina(s) que Lecciona <small style="color:var(--text-muted)">(seleccione para gerar turmas)</small></label>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px">';
  DISCS.forEach(function(d) {
    var cbId = 'disc' + d.id + '_' + Math.random().toString(36).substr(2,5);
    html += '<label for="' + cbId + '" style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-secondary);cursor:pointer;padding:4px;border-radius:4px">';
    html += '<input type="checkbox" id="' + cbId + '" class="mp-disc-cb" value="' + d.id + '" onchange="gerarTurmasProfessor()" style="accent-color:var(--accent);flex-shrink:0"/>';
    html += '<span>' + d.nome + '</span>';
    html += '</label>';
  });
  html += '</div></div>';

  // Classes (seleccionar para combinar com turmas)
  html += '<div class="form-group" style="grid-column:1/-1">';
  html += '<label>Classe(s) que Lecciona <small style="color:var(--text-muted)">(seleccione para gerar turmas)</small></label>';
  html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin-top:6px">';
  for (var c = 1; c <= 12; c++) {
    html += '<label style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-secondary);cursor:pointer">';
    html += '<input type="checkbox" class="mp-classe-cb" id="mp-classe-' + c + '" value="' + c + '"';
    html += ' onchange="gerarTurmasProfessor()" style="accent-color:var(--accent)"/> ' + c + 'ª Classe</label>';
  }
  html += '</div></div>';

  // Letra(s) de turma + geração automática de combinações
  html += '<div class="form-group" style="grid-column:1/-1">';
  html += '<label>Letra(s) da Turma</label>';
  html += '<small style="color:var(--text-muted);font-size:10px;display:block;margin-bottom:6px">Escreva as letras/sufixos das turmas separados por vírgula (ex: A, B1, D, H2). As combinações são geradas automaticamente.</small>';
  html += '<input type="text" id="mp-letras-turma" placeholder="Ex: A, B1, D, H2" style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:6px;padding:9px 12px;color:var(--text-primary);font-size:13px;" oninput="gerarTurmasProfessor()"/>';
  html += '</div>';
  html += '<div class="form-group" style="grid-column:1/-1">';
  html += '<label>Combinações Geradas <small style="color:var(--text-muted)">(seleccione as que se aplicam)</small></label>';
  html += '<div id="mp-turmas-container" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;min-height:40px;padding:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px">';
  html += '<span style="color:var(--text-muted);font-size:12px;font-style:italic">Seleccione disciplinas, classes e escreva as letras das turmas.</span>';
  html += '</div></div>';

  html += '</div>';
  html += '<div id="mp-erro" style="color:var(--accent-red);font-size:12px;margin-top:8px;display:none"></div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancelar</button>';
  html += '<button class="btn btn-primary" id="mp-btn" onclick="submeterProfessor()">Guardar Professor</button>';
  html += '</div></div>';

  o.innerHTML = html;
  o.addEventListener('click', function(ev) { if (ev.target === o) o.remove(); });
  document.body.appendChild(o);
}

// Prefixos das disciplinas
var DISC_PREFIXOS = {
  1: 'P',   // Português
  2: 'M',   // Matemática
  3: 'I',   // Inglês
  4: 'H',   // História
  5: 'G',   // Geografia
  6: 'B',   // Biologia
  7: 'F',   // Física
  8: 'Q',   // Química
  9: 'EF',  // Educação Física
  10: 'TI'  // TIC
};

var DISC_NOMES = ['Português','Matemática','Inglês','História','Geografia','Biologia','Física','Química','Educação Física','TIC'];

// Gerar combinações Disciplina+Classe+TurmaLetra automaticamente
// Ex: M7A, F9A, M10D, M11H, F12G
function gerarTurmasProfessor() {
  var container = document.getElementById('mp-turmas-container');
  if (!container) return;

  // Mapa local dentro da função — sem depender de variáveis globais
  var discMap = {
    1:  { nome:'Português',       pref:'P'  },
    2:  { nome:'Matemática',      pref:'M'  },
    3:  { nome:'Inglês',          pref:'I'  },
    4:  { nome:'História',        pref:'H'  },
    5:  { nome:'Geografia',       pref:'G'  },
    6:  { nome:'Biologia',        pref:'B'  },
    7:  { nome:'Física',          pref:'F'  },
    8:  { nome:'Química',         pref:'Q'  },
    9:  { nome:'Educação Física', pref:'EF' },
    10: { nome:'TIC',             pref:'TI' }
  };

  var disciplinas = [];
  document.querySelectorAll('.mp-disc-cb:checked').forEach(function(cb) {
    var id = parseInt(cb.value);
    var disc = discMap[id];
    if (disc) {
      disciplinas.push({ id: id, prefixo: disc.pref, nome: disc.nome });
    }
  });

  // Recolher classes seleccionadas
  var classes = [];
  document.querySelectorAll('.mp-classe-cb:checked').forEach(function(cb) {
    classes.push(parseInt(cb.value));
  });

  // Recolher letras escritas pelo utilizador
  var letrasInput = document.getElementById('mp-letras-turma');
  var letrasRaw = letrasInput ? letrasInput.value : '';
  var letras = letrasRaw.split(',')
    .map(function(l) { return l.trim().toUpperCase(); })
    .filter(function(l) { return l.length > 0; });

  if (!disciplinas.length || !classes.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:12px;font-style:italic">Seleccione pelo menos uma Disciplina e uma Classe.</span>';
    return;
  }
  if (!letras.length) {
    container.innerHTML = '<span style="color:var(--text-muted);font-size:12px;font-style:italic">Escreva as letras das turmas no campo acima (ex: A, B1, D).</span>';
    return;
  }

  classes.sort(function(a, b) { return a - b; });

  var html = '';
  disciplinas.forEach(function(disc) {
    // Cabeçalho da disciplina
    html += '<div style="width:100%;font-size:10px;font-weight:700;color:var(--accent);';
    html += 'text-transform:uppercase;letter-spacing:1px;margin-top:10px;margin-bottom:4px;padding-bottom:4px;border-bottom:1px solid var(--border)">';
    html += disc.prefixo + ' — ' + disc.nome + '</div>';

    classes.forEach(function(classe) {
      letras.forEach(function(letra) {
        // Combinação final: ex M7A, M7A1, F9D, H12B2
        var nomeComb = disc.prefixo + classe + letra;
        var id = 'mp-t-' + nomeComb.replace(/[^a-zA-Z0-9]/g, '');
        html += '<label style="display:inline-flex;align-items:center;gap:4px;font-size:12px;';
        html += 'color:var(--text-secondary);cursor:pointer;padding:4px 10px;';
        html += 'background:var(--bg-card2);border-radius:6px;border:1px solid var(--border);margin:3px;';
        html += 'transition:border-color 0.2s">';
        html += '<input type="checkbox" id="' + id + '" class="mp-turma-gerada" value="' + nomeComb + '"';
        html += ' data-classe="' + classe + '" data-disc="' + disc.id + '"';
        html += ' style="accent-color:var(--accent)"/> ';
        html += '<span style="font-family:var(--font-mono);font-weight:600">' + nomeComb + '</span></label>';
      });
    });
  });

  container.innerHTML = html || '<span style="color:var(--text-muted);font-size:12px">Nenhuma combinação gerada.</span>';
}

async function submeterProfessor() {
  var erroEl = document.getElementById('mp-erro');
  erroEl.style.display = 'none';

  var nome      = document.getElementById('mp-nome').value.trim();
  var apel      = document.getElementById('mp-apelido').value.trim();
  var bi        = document.getElementById('mp-bi').value.trim().toUpperCase();
  var nuit      = document.getElementById('mp-nuit').value.trim();
  var nasc      = document.getElementById('mp-nasc').value;
  var gen       = document.getElementById('mp-gen').value;
  var hab       = document.getElementById('mp-hab').value;
  var email     = document.getElementById('mp-email').value.trim();
  var tel       = document.getElementById('mp-tel').value.trim();
  var escolaCod = document.getElementById('mp-escola-cod').value.trim().toUpperCase();

  // Recolher disciplinas
  var disciplinas = [];
  document.querySelectorAll('.mp-disc-cb:checked').forEach(function(cb) {
    disciplinas.push(parseInt(cb.value));
  });

  // Recolher turmas geradas seleccionadas
  var turmasSel = [];
  document.querySelectorAll('.mp-turma-gerada:checked').forEach(function(cb) {
    turmasSel.push({ nome: cb.value, classe: parseInt(cb.getAttribute('data-classe')) });
  });

  // Validações — erro por campo
  limparErrosCampo();
  var temErro = false;
  if (!nome)      { campoErro('mp-nome',       'Nome obrigatório');               temErro = true; }
  if (!apel)      { campoErro('mp-apelido',    'Apelido obrigatório');            temErro = true; }
  if (!bi)        { campoErro('mp-bi',         'Nº de BI obrigatório');           temErro = true; }
  if (!nuit)      { campoErro('mp-nuit',       'NUIT obrigatório');               temErro = true; }
  if (!nasc)      { campoErro('mp-nasc',       'Data de nascimento obrigatória'); temErro = true; }
  if (!escolaCod) { campoErro('mp-escola-cod', 'Código da escola obrigatório');   temErro = true; }
  if (temErro) return;

  if (!/^[0-9]{12}[A-Z]$/.test(bi)) {
    campoErro('mp-bi', 'BI inválido. Formato: 12 dígitos + 1 letra (ex: 123456789012A)'); return;
  }
  if (!/^[0-9]{9}$/.test(nuit)) {
    campoErro('mp-nuit', 'NUIT inválido. Deve ter exactamente 9 dígitos numéricos.'); return;
  }

  var erroEsc = validarCodigoEscola(escolaCod);
  if (erroEsc) { campoErro('mp-escola-cod', erroEsc); return; }

  var btn = document.getElementById('mp-btn');
  btn.textContent = 'A procurar escola...'; btn.disabled = true;

  var escola = await api('/escolas/codigo/' + encodeURIComponent(escolaCod));
  if (!escola || !escola.id) {
    campoErro('mp-escola-cod', 'Escola "' + escolaCod + '" não encontrada. Registe a escola primeiro.');
    btn.textContent = 'Guardar Professor'; btn.disabled = false;
    return;
  }

  btn.textContent = 'A guardar...';

  var body = {
    nome: nome,
    apelido: apel,
    numeroFuncionario: 'PROF-' + nuit,
    genero: gen,
    dataNascimento: nasc,
    habilitacao: hab,
    email:    email || null,
    telefone: tel   || null,
    escolaId: escola.id,
  };

  var r = await api('/professores', { method: 'POST', body: JSON.stringify(body) });
  if (r && r.id) {

    // Associar disciplinas
    for (var di = 0; di < disciplinas.length; di++) {
      await api('/professores/' + r.id + '/disciplinas', {
        method: 'POST',
        body: JSON.stringify({ disciplinaId: disciplinas[di] })
      }).catch(function(){});
    }

    // Criar/associar turmas seleccionadas
    if (turmasSel.length) {
      var anoLetivo = new Date().getFullYear();
      for (var ti = 0; ti < turmasSel.length; ti++) {
        var t = turmasSel[ti];
        // Buscar turma existente na escola
        var turmasExist = await api('/turmas?escolaId=' + escola.id + '&anoLetivo=' + anoLetivo + '&classe=' + t.classe);
        var turmaExist = null;
        if (turmasExist && turmasExist.length) {
          turmaExist = turmasExist.find(function(tx) { return tx.nome === t.nome; });
        }
        if (!turmaExist) {
          turmaExist = await api('/turmas', { method: 'POST', body: JSON.stringify({
            nome: t.nome,
            classe: t.classe,
            turno: 'Manhã',
            anoLetivo: anoLetivo,
            escolaId: escola.id,
            professorId: r.id
          })}).catch(function(){});
        }
      }
    }

    document.querySelector('.modal-overlay').remove();
    var resumo = 'Professor "' + r.nome + ' ' + r.apelido + '" registado!';
    if (disciplinas.length) resumo += ' ' + disciplinas.length + ' disciplina(s).';
    if (turmasSel.length)   resumo += ' Turmas: ' + turmasSel.map(function(t){ return t.nome; }).join(', ') + '.';
    mostrarSucesso(resumo);
    professores();

  } else {
    campoErro('mp-nome', (r && r.error) ? r.error : 'Erro ao guardar. Tente novamente.');
    btn.textContent = 'Guardar Professor'; btn.disabled = false;
  }
}



// ============================================================
// Modal Lançar Nota
// ============================================================
function showModalNota() {
  var existing = document.querySelector('.modal-overlay');
  if (existing) existing.remove();

  var o = document.createElement('div');
  o.className = 'modal-overlay';
  var anoAtual = new Date().getFullYear();

  var html = '';
  html += '<div class="modal">';
  html += '<div class="modal-title">Lançar Nota</div>';
  html += '<div class="modal-grid">';
  html += '<div class="form-group"><label>ID do Aluno *</label>';
  html += '<input type="number" id="mn-aluno" placeholder="Nº do aluno" min="1"/>';
  html += '<small style="color:var(--text-muted);font-size:10px">Ver ID na lista de Alunos</small></div>';
  html += '<div class="form-group"><label>Disciplina *</label><select id="mn-disc">';
  html += '<option value="1">Português</option>';
  html += '<option value="2">Matemática</option>';
  html += '<option value="3">Inglês</option>';
  html += '<option value="4">História</option>';
  html += '<option value="5">Geografia</option>';
  html += '<option value="6">Biologia</option>';
  html += '<option value="7">Física</option>';
  html += '<option value="8">Química</option>';
  html += '<option value="9">Educação Física</option>';
  html += '<option value="10">TIC</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>Trimestre *</label><select id="mn-trim">';
  html += '<option value="1">1º Trimestre</option>';
  html += '<option value="2">2º Trimestre</option>';
  html += '<option value="3">3º Trimestre</option>';
  html += '</select></div>';
  html += '<div class="form-group"><label>Ano Lectivo *</label>';
  html += '<input type="number" id="mn-ano" value="' + anoAtual + '" min="2000" max="2099"/></div>';
  html += '<div class="form-group"><label>Nota (0 – 20) *</label>';
  html += '<input type="number" id="mn-nota" placeholder="Ex: 14.5" min="0" max="20" step="0.1"/></div>';
  html += '<div class="form-group"><label>ID do Professor *</label>';
  html += '<input type="number" id="mn-prof" placeholder="Nº do professor" min="1" value="1"/></div>';
  html += '</div>';
  html += '<div id="mn-erro" style="color:var(--accent-red);font-size:12px;margin-top:8px;display:none"></div>';
  html += '<div class="modal-footer">';
  html += '<button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancelar</button>';
  html += '<button class="btn btn-primary" id="mn-btn" onclick="submeterNota()">Lançar Nota</button>';
  html += '</div></div>';

  o.innerHTML = html;
  o.addEventListener('click', function(ev) { if (ev.target === o) o.remove(); });
  document.body.appendChild(o);
}

async function submeterNota() {
  var erroEl = document.getElementById('mn-erro');
  erroEl.style.display = 'none';

  var alunoId      = parseInt(document.getElementById('mn-aluno').value);
  var disciplinaId = parseInt(document.getElementById('mn-disc').value);
  var trimestre    = parseInt(document.getElementById('mn-trim').value);
  var anoLetivo    = parseInt(document.getElementById('mn-ano').value);
  var valor        = parseFloat(document.getElementById('mn-nota').value);
  var professorId  = parseInt(document.getElementById('mn-prof').value) || 1;

  limparErrosCampo();
  if (!alunoId || isNaN(alunoId)) { campoErro('mn-aluno', 'ID do aluno inválido'); return; }
  if (isNaN(valor) || valor < 0 || valor > 20) { campoErro('mn-nota', 'Nota deve ser entre 0 e 20'); return; }

  var btn = document.getElementById('mn-btn');
  btn.textContent = 'A lançar...'; btn.disabled = true;

  var body = { alunoId: alunoId, disciplinaId: disciplinaId, trimestre: trimestre, anoLetivo: anoLetivo, valor: valor, professorId: professorId };
  var r = await api('/notas', { method: 'POST', body: JSON.stringify(body) });

  if (r && r.id) {
    document.querySelector('.modal-overlay').remove();
    mostrarSucesso('Nota lançada: ' + r.valor + ' — ' + (r.disciplina ? r.disciplina.nome : '') + ' — ' + (r.aluno ? r.aluno.nome : ''));
    notas();
  } else {
    campoErro('mn-nota', (r && r.error) ? r.error : 'Erro ao lançar nota. Tente novamente.');
    btn.textContent = 'Lançar Nota'; btn.disabled = false;
  }
}
// ============================================================
function exportarExcel(tipo) {
  var url = API_URL + '/exportar/excel/' + tipo;
  var a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', '');

  // Adicionar token no header via fetch para download autenticado
  fetch(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
    .then(function(resp) {
      if (!resp.ok) throw new Error('Erro na exportação');
      return resp.blob();
    })
    .then(function(blob) {
      var objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.click();
      URL.revokeObjectURL(objectUrl);
      mostrarSucesso('Excel exportado com sucesso!');
    })
    .catch(function(e) {
      alert('Erro ao exportar: ' + e.message);
    });
}

function exportarPDF(tipo, id, params) {
  var url = API_URL + '/exportar/pdf/' + tipo + (id ? '/' + id : '') + (params ? '?' + params : '');
  fetch(url, { headers: { 'Authorization': 'Bearer ' + accessToken } })
    .then(function(resp) {
      if (!resp.ok) throw new Error('Erro na exportação');
      return resp.blob();
    })
    .then(function(blob) {
      var objectUrl = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = objectUrl;
      a.download = 'SIGE_' + tipo + '_' + new Date().getFullYear() + '.pdf';
      a.click();
      URL.revokeObjectURL(objectUrl);
      mostrarSucesso('PDF gerado com sucesso!');
    })
    .catch(function(e) {
      alert('Erro ao exportar PDF: ' + e.message);
    });
}

function exportPDF(nome) {
  exportarPDF('relatorio-mec', null, 'anoLetivo=' + new Date().getFullYear());
}

// ============================================================
// NOTIFICAÇÃO DE SUCESSO
// ============================================================
function mostrarSucesso(msg) {
  var div = document.createElement('div');
  div.style.cssText = 'position:fixed;top:20px;right:20px;background:#009A44;color:#fff;padding:14px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.3);animation:slideUp 0.3s ease';
  div.textContent = '✅ ' + msg;
  document.body.appendChild(div);
  setTimeout(function(){ div.remove(); }, 3500);
}

// ============================================================
// BOTÕES DE EXPORTAÇÃO — injectados nas páginas
// ============================================================

// Sobrescrever função relatorios com botões de exportação reais
function relatorios() {
  document.getElementById('page-content').innerHTML =
    '<div class="section-title">Central de Relatórios e Exportação</div>' +
    '<p class="section-desc">Gere e descarregue relatórios oficiais em PDF e Excel.</p>' +
    '<div class="two-col"><div>' +
    '<h3 style="font-family:var(--font-serif);font-size:16px;font-weight:400;color:var(--text-secondary);margin-bottom:16px">Exportar Excel</h3>' +
    excelCard('📊','Lista de Escolas','Todas as escolas com contagem de alunos e professores','escolas') +
    excelCard('👨‍🎓','Lista de Alunos','Todos os alunos com turma e estado actual','alunos') +
    excelCard('👩‍🏫','Lista de Professores','Professores com habilitações e escolas','professores') +
    excelCard('📝','Pauta de Notas','Notas por turma e disciplina (ano actual)','notas') +
    '</div><div>' +
    '<h3 style="font-family:var(--font-serif);font-size:16px;font-weight:400;color:var(--text-secondary);margin-bottom:16px">Exportar PDF</h3>' +
    pdfCard('📄','Boletim Individual','Boletim de um aluno com médias e resultado','boletim') +
    pdfCard('📋','Relatório Estatístico MEC','Relatório oficial com KPIs nacionais por província','relatorio-mec') +
    '<div style="background:var(--bg-card2);border:1px solid var(--border-accent);border-radius:var(--radius);padding:20px;margin-top:16px">' +
    '<div style="font-size:12px;color:var(--accent);font-weight:700;margin-bottom:8px">ℹ Boletim Individual</div>' +
    '<p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Para gerar o boletim de um aluno específico, aceda à lista de Alunos e clique em "Boletim PDF" na linha do aluno.</p>' +
    '</div>' +
    '</div></div>';
}

function excelCard(icon, nome, desc, tipo) {
  return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px">' +
    '<span style="font-size:24px">'+icon+'</span>' +
    '<div style="flex:1"><div style="font-size:14px;color:var(--text-primary);font-weight:600">'+nome+'</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">'+desc+'</div></div>' +
    '<button class="btn btn-primary btn-sm" onclick="exportarExcel(\''+tipo+'\')">⬇ Descarregar .xlsx</button>' +
  '</div>';
}

function pdfCard(icon, nome, desc, tipo) {
  return '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px">' +
    '<span style="font-size:24px">'+icon+'</span>' +
    '<div style="flex:1"><div style="font-size:14px;color:var(--text-primary);font-weight:600">'+nome+'</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px">'+desc+'</div></div>' +
    (tipo === 'relatorio-mec'
      ? '<button class="btn btn-gold btn-sm" onclick="exportarPDF(\'relatorio-mec\')">⬇ PDF Oficial</button>'
      : '<button class="btn btn-gold btn-sm" onclick="pedirBoletimPDF()">⬇ Gerar PDF</button>') +
  '</div>';
}

function pedirBoletimPDF() {
  var id = prompt('Introduza o ID do aluno para gerar o boletim:');
  if (id && !isNaN(parseInt(id))) {
    exportarPDF('boletim', parseInt(id), 'anoLetivo=' + new Date().getFullYear());
  } else if (id) {
    alert('ID inválido. Introduza apenas o número do aluno.');
  }
}
