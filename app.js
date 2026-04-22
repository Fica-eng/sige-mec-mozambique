// ============================================
// SIGE — Lógica Principal
// MEC Moçambique
// ============================================

let currentUser = null;
let activeCharts = {};

// ======= AUTH =======
function doLogin() {
  const user = document.getElementById('login-user').value;
  const role = document.getElementById('login-role').value;
  if (!user) return;

  currentUser = { email: user, role: role };

  const roleNames = {
    admin: 'Administrador MEC',
    coordenador: 'Coordenador Regional',
    diretor: 'Diretor de Escola',
    professor: 'Professor'
  };

  document.getElementById('user-name').textContent = user.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase());
  document.getElementById('user-role-label').textContent = roleNames[role];
  document.getElementById('user-avatar').textContent = user[0].toUpperCase();

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');

  setDate();
  navigateTo('dashboard');
}

function doLogout() {
  document.getElementById('app').classList.add('hidden');
  document.getElementById('login-screen').classList.remove('hidden');
}

function setDate() {
  const now = new Date();
  const opts = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
  document.getElementById('top-date').textContent = now.toLocaleDateString('pt-MZ', opts);
}

// ======= NAVIGATION =======
function navigate(el) {
  el.preventDefault && el.preventDefault();
  const page = el.getAttribute('data-page');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  navigateTo(page);
}

function navigateTo(page) {
  destroyCharts();
  const titles = {
    dashboard: 'Dashboard', escolas: 'Gestão de Escolas', alunos: 'Gestão de Alunos',
    professores: 'Gestão de Professores', notas: 'Notas e Avaliações',
    matriculas: 'Estatísticas de Matrículas', desempenho: 'Desempenho Acadêmico',
    evasao: 'Evasão Escolar', rh: 'Recursos Humanos', relatorios: 'Relatórios'
  };
  document.getElementById('page-title').textContent = titles[page] || page;
  document.getElementById('breadcrumb').textContent = `MEC / ${titles[page] || page}`;
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.getAttribute('data-page') === page) n.classList.add('active');
    else n.classList.remove('active');
  });

  const renderers = {
    dashboard, escolas, alunos, professores, notas,
    matriculas, desempenho, evasao, rh, relatorios
  };
  const fn = renderers[page];
  if (fn) fn();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

function applyFilters() { /* filters trigger re-render */ }

function destroyCharts() {
  Object.values(activeCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  activeCharts = {};
}

function renderChart(id, config) {
  try {
    const canvas = document.getElementById(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (activeCharts[id]) { try { activeCharts[id].destroy(); } catch(e){} }
    activeCharts[id] = new Chart(ctx, config);
  } catch(e) { console.warn('Chart error:', e); }
}

const chartDefaults = {
  plugins: { legend: { labels: { color: '#8B9DBF', font: { family: 'IBM Plex Mono', size: 11 }, boxWidth: 10 } } },
  scales: {
    x: { ticks: { color: '#4A5A7A', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: '#4A5A7A', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
  }
};

function fmt(n) { return n.toLocaleString('pt-MZ'); }
function fmtK(n) { return n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : n; }

// ======= PAGES =======

function dashboard() {
  const k = DATA.kpis;
  document.getElementById('page-content').innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card green" style="animation-delay:0s">
        <span class="kpi-label">Total de Escolas</span>
        <span class="kpi-value">${fmt(k.totalEscolas)}</span>
        <span class="kpi-sub">Públicas e Comunitárias</span>
        <span class="kpi-trend up">+3.2%</span>
      </div>
      <div class="kpi-card blue" style="animation-delay:0.05s">
        <span class="kpi-label">Total de Alunos</span>
        <span class="kpi-value">${fmtK(k.totalAlunos)}</span>
        <span class="kpi-sub">Matriculados em 2024</span>
        <span class="kpi-trend up">+2.5%</span>
      </div>
      <div class="kpi-card gold" style="animation-delay:0.10s">
        <span class="kpi-label">Professores</span>
        <span class="kpi-value">${fmtK(k.totalProfessores)}</span>
        <span class="kpi-sub">Em exercício nacional</span>
        <span class="kpi-trend up">+1.8%</span>
      </div>
      <div class="kpi-card green" style="animation-delay:0.15s">
        <span class="kpi-label">Taxa de Aprovação</span>
        <span class="kpi-value">${k.taxaAprovacao}%</span>
        <span class="kpi-sub">Média nacional 2024</span>
        <span class="kpi-trend up">+1.3%</span>
      </div>
      <div class="kpi-card red" style="animation-delay:0.20s">
        <span class="kpi-label">Taxa de Evasão</span>
        <span class="kpi-value">${k.taxaEvasao}%</span>
        <span class="kpi-sub">Queda de 0.4pp vs 2023</span>
        <span class="kpi-trend up">-5.0%</span>
      </div>
      <div class="kpi-card gold" style="animation-delay:0.25s">
        <span class="kpi-label">Ratio Prof/Aluno</span>
        <span class="kpi-value">1:${k.ratioProfAluno}</span>
        <span class="kpi-sub">Meta: 1:35</span>
        <span class="kpi-trend up">OK</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Evolução de Matrículas</div>
            <div class="chart-subtitle">Total nacional 2019–2024</div>
          </div>
          <span class="chart-badge">2019-2024</span>
        </div>
        <div class="chart-container"><canvas id="ch-matriculas"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div>
            <div class="chart-title">Distribuição por Nível</div>
            <div class="chart-subtitle">Matrículas por grau escolar</div>
          </div>
          <span class="chart-badge">2024</span>
        </div>
        <div class="chart-container"><canvas id="ch-niveis"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Resumo por Província</span>
        <div class="table-actions">
          <button class="btn btn-outline btn-sm" onclick="exportData()">📊 Exportar Excel</button>
          <button class="btn btn-gold btn-sm" onclick="exportPDF()">📄 Exportar PDF</button>
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Província</th><th>Escolas</th><th>Alunos</th><th>Professores</th>
            <th>Taxa Aprovação</th><th>Taxa Evasão</th>
          </tr>
        </thead>
        <tbody>
          ${DATA.provincias.map(p => `
            <tr>
              <td><strong style="color:var(--text-primary)">${p.nome}</strong></td>
              <td>${fmt(p.escolas)}</td>
              <td>${fmtK(p.alunos)}</td>
              <td>${fmtK(p.professores)}</td>
              <td><span class="badge ${p.aprov >= 75 ? 'badge-green' : p.aprov >= 65 ? 'badge-gold' : 'badge-red'}">${p.aprov}%</span></td>
              <td><span class="badge ${p.evasao <= 7 ? 'badge-green' : p.evasao <= 10 ? 'badge-gold' : 'badge-red'}">${p.evasao}%</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    const ev = DATA.evolucaoMatriculas;
    renderChart('ch-matriculas', {
      type: 'line',
      data: {
        labels: ev.anos,
        datasets: [
          { label: 'Total', data: ev.total, borderColor: '#009A44', backgroundColor: 'rgba(0,154,68,0.1)', tension: 0.4, fill: true, borderWidth: 2 },
          { label: 'Masculino', data: ev.masculino, borderColor: '#4A90D9', tension: 0.4, borderWidth: 2 },
          { label: 'Feminino', data: ev.feminino, borderColor: '#FCB017', tension: 0.4, borderWidth: 2 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });

    renderChart('ch-niveis', {
      type: 'doughnut',
      data: {
        labels: DATA.distribuicaoPorNivel.niveis,
        datasets: [{ data: DATA.distribuicaoPorNivel.alunos, backgroundColor: ['#009A44','#FCB017','#4A90D9','#D21034'], borderWidth: 0, hoverOffset: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#8B9DBF', font: { family: 'IBM Plex Mono', size: 10 }, boxWidth: 10, padding: 12 } } }
      }
    });
  }, 100);
}

function escolas() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Gestão de Escolas</div>
    <p class="section-desc">Cadastro e gestão de ${fmt(DATA.kpis.totalEscolas)} escolas em todo o território nacional.</p>

    <div class="search-bar">
      <input class="search-input" placeholder="Pesquisar por nome, província, distrito..." oninput="filterEscolas(this.value)" id="escola-search"/>
      <select style="background:var(--bg-card);border:1px solid var(--border);border-radius:6px;color:var(--text-secondary);padding:10px 12px;font-family:var(--font-sans);font-size:13px;">
        <option>Todos os Tipos</option><option>Primária</option><option>Básica</option><option>Secundária</option>
      </select>
      <button class="btn btn-primary" onclick="showModalEscola()">+ Nova Escola</button>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Lista de Escolas</span>
        <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-muted)">${DATA.escolas.length} resultados</span>
      </div>
      <table class="data-table" id="escolas-table">
        <thead>
          <tr><th>Nome da Escola</th><th>Província</th><th>Tipo</th><th>Alunos</th><th>Professores</th><th>Aprovação</th><th>Acções</th></tr>
        </thead>
        <tbody id="escolas-tbody">
          ${DATA.escolas.map(e => `
            <tr>
              <td><strong style="color:var(--text-primary)">${e.nome}</strong><br><span style="font-size:11px;color:var(--text-muted)">${e.distrito}</span></td>
              <td>${e.provincia}</td>
              <td><span class="badge ${e.tipo === 'Primária' ? 'badge-blue' : e.tipo === 'Básica' ? 'badge-green' : 'badge-gold'}">${e.tipo}</span></td>
              <td>${fmt(e.alunos)}</td>
              <td>${e.professores}</td>
              <td><span class="badge ${e.aprov >= 75 ? 'badge-green' : e.aprov >= 65 ? 'badge-gold' : 'badge-red'}">${e.aprov}%</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="alert('Ver detalhes: ${e.nome}')">Ver</button>
                <button class="btn btn-outline btn-sm" onclick="alert('Editar: ${e.nome}')">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterEscolas(q) {
  const rows = document.querySelectorAll('#escolas-tbody tr');
  q = q.toLowerCase();
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

function alunos() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Gestão de Alunos</div>
    <p class="section-desc">Matrículas, transferências e histórico acadêmico dos ${fmtK(DATA.kpis.totalAlunos)} alunos registados.</p>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card green"><span class="kpi-label">Ativos</span><span class="kpi-value">${fmtK(Math.round(DATA.kpis.totalAlunos * 0.908))}</span><span class="kpi-sub">90.8% do total</span></div>
      <div class="kpi-card blue"><span class="kpi-label">Transferidos</span><span class="kpi-value">${fmtK(Math.round(DATA.kpis.totalAlunos * 0.012))}</span><span class="kpi-sub">1.2% do total</span></div>
      <div class="kpi-card red"><span class="kpi-label">Evadidos</span><span class="kpi-value">${fmtK(Math.round(DATA.kpis.totalAlunos * 0.082))}</span><span class="kpi-sub">8.2% do total</span></div>
      <div class="kpi-card gold"><span class="kpi-label">Inativos</span><span class="kpi-value">${fmtK(Math.round(DATA.kpis.totalAlunos * 0.008))}</span><span class="kpi-sub">0.8% do total</span></div>
    </div>

    <div class="search-bar">
      <input class="search-input" placeholder="Pesquisar aluno por nome, escola, série..."/>
      <button class="btn btn-primary" onclick="alert('Funcionalidade de matrícula')">+ Nova Matrícula</button>
    </div>

    <div class="table-card">
      <div class="table-header"><span class="table-title">Registo de Alunos (Amostra)</span></div>
      <table class="data-table">
        <thead>
          <tr><th>Nome</th><th>Escola</th><th>Série</th><th>Género</th><th>Média</th><th>Status</th><th>Acções</th></tr>
        </thead>
        <tbody>
          ${DATA.alunos.map(a => `
            <tr>
              <td><strong style="color:var(--text-primary)">${a.nome}</strong></td>
              <td style="font-size:12px">${a.escola}</td>
              <td>${a.serie}</td>
              <td><span class="badge ${a.genero === 'F' ? 'badge-gold' : 'badge-blue'}">${a.genero === 'F' ? 'Feminino' : 'Masculino'}</span></td>
              <td style="font-family:var(--font-mono)">${a.media}</td>
              <td><span class="badge ${a.status === 'Ativo' ? 'badge-green' : a.status === 'Transferido' ? 'badge-blue' : 'badge-red'}">${a.status}</span></td>
              <td>
                <button class="btn btn-outline btn-sm" onclick="alert('Boletim de ${a.nome}')">Boletim</button>
                <button class="btn btn-outline btn-sm" onclick="alert('Editar ${a.nome}')">Editar</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function professores() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Gestão de Professores</div>
    <p class="section-desc">Cadastro, qualificações e alocação dos ${fmtK(DATA.kpis.totalProfessores)} professores em exercício.</p>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Nível de Qualificação</div><div class="chart-subtitle">Distribuição nacional</div></div>
        </div>
        <div class="chart-container"><canvas id="ch-qual"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Carência por Disciplina</div><div class="chart-subtitle">Postos em falta</div></div>
        </div>
        <div class="chart-container"><canvas id="ch-carencia"></canvas></div>
      </div>
    </div>

    <div class="search-bar">
      <input class="search-input" placeholder="Pesquisar professor por nome, escola, disciplina..."/>
      <button class="btn btn-primary" onclick="alert('Cadastrar novo professor')">+ Novo Professor</button>
    </div>

    <div class="table-card">
      <div class="table-header"><span class="table-title">Lista de Professores (Amostra)</span></div>
      <table class="data-table">
        <thead>
          <tr><th>Nome</th><th>Escola</th><th>Disciplina</th><th>Habilitações</th><th>Anos Serviço</th><th>Avaliação</th></tr>
        </thead>
        <tbody>
          ${DATA.professores.map(p => `
            <tr>
              <td><strong style="color:var(--text-primary)">${p.nome}</strong></td>
              <td style="font-size:12px">${p.escola}</td>
              <td>${p.disciplina}</td>
              <td><span class="badge ${p.nivel === 'Mestrado' ? 'badge-gold' : p.nivel === 'Licenciatura' ? 'badge-green' : 'badge-blue'}">${p.nivel}</span></td>
              <td style="font-family:var(--font-mono)">${p.anos} anos</td>
              <td>
                <span style="color:var(--accent-gold);font-family:var(--font-mono)">★ ${p.avaliacao}</span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    renderChart('ch-qual', {
      type: 'pie',
      data: {
        labels: ['Bacharelato', 'Licenciatura', 'Mestrado', 'Doutoramento', 'Outro'],
        datasets: [{ data: [38.2, 44.6, 12.8, 1.4, 3.0], backgroundColor: ['#4A90D9','#009A44','#FCB017','#D21034','#8B9DBF'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8B9DBF', font: { family: 'IBM Plex Mono', size: 10 }, boxWidth: 10 } } } }
    });
    renderChart('ch-carencia', {
      type: 'bar',
      data: {
        labels: ['Matemática', 'Inglês', 'Ciências', 'Física', 'Química', 'TIC'],
        datasets: [{ label: 'Postos em falta', data: [4280, 3190, 2640, 2180, 1920, 3860], backgroundColor: 'rgba(210,16,52,0.6)', borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults, indexAxis: 'y' }
    });
  }, 100);
}

function notas() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Notas e Avaliações</div>
    <p class="section-desc">Lançamento e consulta de notas, cálculo de médias e boletins escolares.</p>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Taxa de Aprovação por Disciplina</div><div class="chart-subtitle">Média nacional 2024</div></div>
          <span class="chart-badge">Nacional</span>
        </div>
        <div class="chart-container"><canvas id="ch-aprov-disc"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header">
          <div><div class="chart-title">Médias por Disciplina</div><div class="chart-subtitle">Escala 0–20</div></div>
        </div>
        <div class="chart-container"><canvas id="ch-medias"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Boletim — Turma Amostra (10ª Classe B — Escola Sec. Josina)</span>
        <button class="btn btn-gold btn-sm" onclick="alert('Imprimir boletins da turma')">Imprimir Boletins</button>
      </div>
      <table class="data-table">
        <thead>
          <tr><th>Aluno</th><th>Português</th><th>Matemática</th><th>Inglês</th><th>História</th><th>Ciências</th><th>Média</th><th>Resultado</th></tr>
        </thead>
        <tbody>
          ${[
            ['Ana Beatriz Machava', 14, 12, 13, 15, 13],
            ['Carlos Nhantumbo',    11, 9,  10, 12, 11],
            ['Fátima Sitoe',        15, 14, 14, 16, 15],
            ['João Munguambe',      10, 8,  9,  11, 10],
            ['Maria Conceição Bila',12, 11, 12, 13, 12],
            ['Pedro Cossa',         9,  7,  9,  10, 9 ],
          ].map(([nome, ...notas]) => {
            const media = (notas.reduce((a,b) => a+b, 0) / notas.length).toFixed(1);
            return `<tr>
              <td><strong style="color:var(--text-primary)">${nome}</strong></td>
              ${notas.map(n => `<td style="font-family:var(--font-mono);${n < 10 ? 'color:var(--accent-red)' : ''}">${n}</td>`).join('')}
              <td><strong style="font-family:var(--font-mono);color:var(--text-primary)">${media}</strong></td>
              <td><span class="badge ${Number(media) >= 10 ? 'badge-green' : 'badge-red'}">${Number(media) >= 10 ? 'Aprovado' : 'Reprovado'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    const dd = DATA.desempenhoPorDisciplina;
    renderChart('ch-aprov-disc', {
      type: 'bar',
      data: { labels: dd.disciplinas, datasets: [{ label: '% Aprovação', data: dd.taxaAprovacao, backgroundColor: dd.taxaAprovacao.map(v => v >= 75 ? 'rgba(0,154,68,0.7)' : v >= 65 ? 'rgba(252,176,23,0.7)' : 'rgba(210,16,52,0.7)'), borderRadius: 4 }] },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });
    renderChart('ch-medias', {
      type: 'radar',
      data: { labels: dd.disciplinas, datasets: [{ label: 'Média', data: dd.media, borderColor: '#009A44', backgroundColor: 'rgba(0,154,68,0.15)', borderWidth: 2, pointBackgroundColor: '#009A44' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#8B9DBF' } } }, scales: { r: { ticks: { color: '#4A5A7A', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.06)' }, pointLabels: { color: '#8B9DBF', font: { size: 10 } }, min: 0, max: 20 } } }
    });
  }, 100);
}

function matriculas() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Estatísticas de Matrículas</div>
    <p class="section-desc">Análise detalhada de matrículas por região, género, série e evolução temporal.</p>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card green"><span class="kpi-label">Total Matrículas 2024</span><span class="kpi-value">6.24M</span><span class="kpi-sub">+2.5% vs 2023</span><span class="kpi-trend up">+2.5%</span></div>
      <div class="kpi-card gold"><span class="kpi-label">Taxa Líquida</span><span class="kpi-value">88.6%</span><span class="kpi-sub">Meta: 95%</span></div>
      <div class="kpi-card blue"><span class="kpi-label">Paridade de Género</span><span class="kpi-value">0.91</span><span class="kpi-sub">Meta: 1.0 (paridade)</span></div>
      <div class="kpi-card green"><span class="kpi-label">Novas Matrículas</span><span class="kpi-value">152.8K</span><span class="kpi-sub">Ingressos 2024</span></div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Evolução de Matrículas por Género</div><div class="chart-subtitle">2019–2024</div></div></div>
        <div class="chart-container"><canvas id="ch-genero"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Matrículas por Província</div><div class="chart-subtitle">2024</div></div></div>
        <div class="chart-container"><canvas id="ch-prov-mat"></canvas></div>
      </div>
    </div>

    <h3 style="font-family:var(--font-serif);font-size:16px;font-weight:400;margin-bottom:14px;color:var(--text-secondary)">Distribuição por Província</h3>
    <div class="province-grid">
      ${DATA.provincias.map(p => {
        const max = Math.max(...DATA.provincias.map(x => x.alunos));
        const pct = Math.round((p.alunos / max) * 100);
        return `
          <div class="province-card">
            <div class="province-name">${p.nome}</div>
            <div class="province-value">${fmtK(p.alunos)}</div>
            <div class="province-sub">${p.escolas} escolas</div>
            <div class="province-bar"><div class="province-bar-fill" style="width:${pct}%"></div></div>
          </div>`;
      }).join('')}
    </div>
  `;

  setTimeout(() => {
    const ev = DATA.evolucaoMatriculas;
    renderChart('ch-genero', {
      type: 'line',
      data: {
        labels: ev.anos,
        datasets: [
          { label: 'Masculino', data: ev.masculino, borderColor: '#4A90D9', backgroundColor: 'rgba(74,144,217,0.1)', tension: 0.4, fill: true },
          { label: 'Feminino', data: ev.feminino, borderColor: '#FCB017', backgroundColor: 'rgba(252,176,23,0.1)', tension: 0.4, fill: true }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });
    renderChart('ch-prov-mat', {
      type: 'bar',
      data: {
        labels: DATA.provincias.map(p => p.nome),
        datasets: [{ label: 'Alunos', data: DATA.provincias.map(p => p.alunos), backgroundColor: 'rgba(0,154,68,0.6)', borderRadius: 3 }]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults, indexAxis: 'y' }
    });
  }, 100);
}

function desempenho() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Desempenho Acadêmico</div>
    <p class="section-desc">Taxas de aprovação, reprovação, médias e comparativos por escola, região e género.</p>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card green"><span class="kpi-label">Taxa Aprovação Nacional</span><span class="kpi-value">71.4%</span><span class="kpi-trend up">+1.3%</span></div>
      <div class="kpi-card red"><span class="kpi-label">Taxa Reprovação</span><span class="kpi-value">20.4%</span><span class="kpi-trend up">-1.1%</span></div>
      <div class="kpi-card gold"><span class="kpi-label">Aprovação Feminina</span><span class="kpi-value">69.8%</span><span class="kpi-sub">vs 72.9% masc.</span></div>
      <div class="kpi-card blue"><span class="kpi-label">Melhor Desempenho</span><span class="kpi-value">Maputo</span><span class="kpi-sub">84.6% aprovação</span></div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Aprovação por Província</div><div class="chart-subtitle">Comparativo 2024</div></div></div>
        <div class="chart-container"><canvas id="ch-aprov-prov"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Evolução da Aprovação</div><div class="chart-subtitle">Tendência histórica</div></div></div>
        <div class="chart-container"><canvas id="ch-aprov-trend"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <span class="table-title">Ranking de Províncias por Desempenho</span>
        <button class="btn btn-gold btn-sm" onclick="exportPDF()">📄 Gerar Relatório</button>
      </div>
      <table class="data-table">
        <thead><tr><th>#</th><th>Província</th><th>Taxa Aprovação</th><th>Taxa Evasão</th><th>Ratio Prof/Aluno</th><th>Classificação</th></tr></thead>
        <tbody>
          ${[...DATA.provincias].sort((a,b) => b.aprov - a.aprov).map((p, i) => `
            <tr>
              <td style="font-family:var(--font-mono);color:var(--text-muted)">${i+1}</td>
              <td><strong style="color:var(--text-primary)">${p.nome}</strong></td>
              <td>
                <div class="progress-bar" style="width:120px;display:inline-block;vertical-align:middle;margin-right:8px">
                  <div class="progress-fill ${p.aprov >= 75 ? 'green' : p.aprov >= 65 ? 'gold' : 'red'}" style="width:${p.aprov}%"></div>
                </div>
                <span style="font-family:var(--font-mono)">${p.aprov}%</span>
              </td>
              <td><span class="badge ${p.evasao <= 7 ? 'badge-green' : p.evasao <= 10 ? 'badge-gold' : 'badge-red'}">${p.evasao}%</span></td>
              <td style="font-family:var(--font-mono)">1:${Math.round(p.alunos/p.professores)}</td>
              <td><span class="badge ${i < 3 ? 'badge-green' : i < 7 ? 'badge-gold' : 'badge-red'}">${i < 3 ? 'Excelente' : i < 7 ? 'Bom' : 'Atenção'}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    renderChart('ch-aprov-prov', {
      type: 'bar',
      data: {
        labels: DATA.provincias.map(p => p.nome),
        datasets: [
          { label: '% Aprovação', data: DATA.provincias.map(p => p.aprov), backgroundColor: DATA.provincias.map(p => p.aprov >= 75 ? 'rgba(0,154,68,0.7)' : p.aprov >= 65 ? 'rgba(252,176,23,0.7)' : 'rgba(210,16,52,0.7)'), borderRadius: 3 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults, indexAxis: 'y' }
    });
    renderChart('ch-aprov-trend', {
      type: 'line',
      data: {
        labels: [2019, 2020, 2021, 2022, 2023, 2024],
        datasets: [
          { label: 'Taxa Aprovação', data: [67.8, 66.1, 68.4, 69.2, 70.1, 71.4], borderColor: '#009A44', backgroundColor: 'rgba(0,154,68,0.1)', tension: 0.4, fill: true, borderWidth: 2 },
          { label: 'Taxa Reprovação', data: [21.4, 22.7, 21.7, 21.2, 21.3, 20.4], borderColor: '#D21034', tension: 0.4, borderWidth: 2 },
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });
  }, 100);
}

function evasao() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Evasão Escolar</div>
    <p class="section-desc">Monitoramento da taxa de abandono, causas identificadas e distribuição geográfica.</p>

    <div class="alert alert-warning">
      ⚠ Atenção: Cabo Delgado (14.7%) e Niassa (12.3%) apresentam taxas de evasão críticas — acima do limite aceitável de 10%.
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card red"><span class="kpi-label">Taxa Nacional de Evasão</span><span class="kpi-value">8.2%</span><span class="kpi-sub">Melhora de 0.4pp</span><span class="kpi-trend up">-4.9%</span></div>
      <div class="kpi-card red"><span class="kpi-label">Alunos Evadidos</span><span class="kpi-value">512K</span><span class="kpi-sub">Em 2024</span></div>
      <div class="kpi-card gold"><span class="kpi-label">Pior Região</span><span class="kpi-value">14.7%</span><span class="kpi-sub">Cabo Delgado</span></div>
      <div class="kpi-card green"><span class="kpi-label">Melhor Região</span><span class="kpi-value">4.2%</span><span class="kpi-sub">Maputo Cidade</span></div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Causas da Evasão</div><div class="chart-subtitle">Distribuição percentual nacional</div></div></div>
        <div class="chart-container"><canvas id="ch-causas"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Tendência da Evasão</div><div class="chart-subtitle">Evolução 2019–2024</div></div></div>
        <div class="chart-container"><canvas id="ch-evasao-trend"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header"><span class="table-title">Evasão por Província — Situação 2024</span></div>
      <table class="data-table">
        <thead><tr><th>Província</th><th>Taxa Evasão</th><th>Alunos Evadidos (est.)</th><th>Situação</th><th>Intervenção</th></tr></thead>
        <tbody>
          ${[...DATA.provincias].sort((a,b) => b.evasao - a.evasao).map(p => {
            const evad = Math.round(p.alunos * p.evasao / 100);
            return `<tr>
              <td><strong style="color:var(--text-primary)">${p.nome}</strong></td>
              <td>
                <div class="progress-bar" style="width:120px;display:inline-block;vertical-align:middle;margin-right:8px">
                  <div class="progress-fill ${p.evasao <= 7 ? 'green' : p.evasao <= 10 ? 'gold' : 'red'}" style="width:${p.evasao * 5}%"></div>
                </div>
                <span style="font-family:var(--font-mono)">${p.evasao}%</span>
              </td>
              <td style="font-family:var(--font-mono)">${fmt(evad)}</td>
              <td><span class="badge ${p.evasao <= 7 ? 'badge-green' : p.evasao <= 10 ? 'badge-gold' : 'badge-red'}">${p.evasao <= 7 ? 'Controlado' : p.evasao <= 10 ? 'Atenção' : 'Crítico'}</span></td>
              <td><button class="btn btn-outline btn-sm" onclick="alert('Plano de intervenção para ${p.nome}')">Ver Plano</button></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    const ec = DATA.evasaoPorCausa;
    renderChart('ch-causas', {
      type: 'doughnut',
      data: { labels: ec.causas, datasets: [{ data: ec.percentual, backgroundColor: ['#D21034','#FCB017','#4A90D9','#009A44','#8B4513','#6B48FF','#666'], borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#8B9DBF', font: { family: 'IBM Plex Mono', size: 10 }, boxWidth: 10 } } } }
    });
    const et = DATA.evasaoEvolutiva;
    renderChart('ch-evasao-trend', {
      type: 'line',
      data: { labels: et.anos, datasets: [{ label: '% Evasão', data: et.taxa, borderColor: '#D21034', backgroundColor: 'rgba(210,16,52,0.1)', tension: 0.4, fill: true, borderWidth: 2, pointBackgroundColor: '#D21034' }] },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });
  }, 100);
}

function rh() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Recursos Humanos</div>
    <p class="section-desc">Ratio professor/aluno, distribuição de qualificações, carência e necessidades de contratação.</p>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi-card green"><span class="kpi-label">Total de Professores</span><span class="kpi-value">187.4K</span><span class="kpi-sub">Em exercício em 2024</span></div>
      <div class="kpi-card gold"><span class="kpi-label">Ratio Nacional</span><span class="kpi-value">1:33</span><span class="kpi-sub">Meta: 1:35</span></div>
      <div class="kpi-card blue"><span class="kpi-label">Qualificados (Lic+)</span><span class="kpi-value">58.8%</span><span class="kpi-sub">Licenciatura ou mais</span></div>
      <div class="kpi-card red"><span class="kpi-label">Postos em Falta</span><span class="kpi-value">18.2K</span><span class="kpi-sub">Estimativa nacional</span></div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Ratio Prof/Aluno por Província</div></div></div>
        <div class="chart-container"><canvas id="ch-ratio"></canvas></div>
      </div>
      <div class="chart-card">
        <div class="chart-header"><div><div class="chart-title">Carência de Professores</div><div class="chart-subtitle">Top disciplinas em falta</div></div></div>
        <div class="chart-container"><canvas id="ch-falta"></canvas></div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header"><span class="table-title">Ratio por Província — Detalhado</span></div>
      <table class="data-table">
        <thead><tr><th>Província</th><th>Professores</th><th>Alunos</th><th>Ratio</th><th>Meta</th><th>Status</th></tr></thead>
        <tbody>
          ${DATA.provincias.map(p => {
            const ratio = Math.round(p.alunos / p.professores);
            return `<tr>
              <td><strong style="color:var(--text-primary)">${p.nome}</strong></td>
              <td style="font-family:var(--font-mono)">${fmtK(p.professores)}</td>
              <td style="font-family:var(--font-mono)">${fmtK(p.alunos)}</td>
              <td style="font-family:var(--font-mono)">1:${ratio}</td>
              <td style="font-family:var(--font-mono);color:var(--text-muted)">1:35</td>
              <td><span class="badge ${ratio <= 25 ? 'badge-blue' : ratio <= 35 ? 'badge-green' : ratio <= 40 ? 'badge-gold' : 'badge-red'}">${ratio <= 25 ? 'Excedente' : ratio <= 35 ? 'Adequado' : ratio <= 40 ? 'Atenção' : 'Crítico'}</span></td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    const provNames = DATA.provincias.map(p => p.nome);
    const ratios = DATA.provincias.map(p => Math.round(p.alunos / p.professores));
    renderChart('ch-ratio', {
      type: 'bar',
      data: { labels: provNames, datasets: [
        { label: 'Ratio Real', data: ratios, backgroundColor: ratios.map(r => r <= 35 ? 'rgba(0,154,68,0.7)' : r <= 40 ? 'rgba(252,176,23,0.7)' : 'rgba(210,16,52,0.7)'), borderRadius: 3 },
        { label: 'Meta (35)', data: Array(provNames.length).fill(35), type: 'line', borderColor: '#FCB017', borderDash: [4,4], borderWidth: 1.5, pointRadius: 0 }
      ] },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults, indexAxis: 'y' }
    });
    renderChart('ch-falta', {
      type: 'bar',
      data: {
        labels: ['Matemática', 'TIC', 'Inglês', 'Ciências', 'Física', 'Química', 'Biologia'],
        datasets: [{ label: 'Postos em falta', data: [4280, 3860, 3190, 2640, 2180, 1920, 1650], backgroundColor: 'rgba(210,16,52,0.65)', borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, ...chartDefaults }
    });
  }, 100);
}

function relatorios() {
  document.getElementById('page-content').innerHTML = `
    <div class="section-title">Central de Relatórios</div>
    <p class="section-desc">Geração, agendamento e exportação de relatórios oficiais do sistema educacional.</p>

    <div class="alert alert-info">
      ℹ Os relatórios são gerados a partir dos dados mais recentes do sistema. Exportação disponível em PDF e Excel.
    </div>

    <div class="two-col">
      <div>
        <h3 style="font-family:var(--font-serif);font-size:16px;font-weight:400;color:var(--text-secondary);margin-bottom:16px">Relatórios Estatísticos</h3>
        ${[
          { nome: 'Relatório Anual de Matrículas 2024', desc: 'Dados completos por província, distrito e escola', icon: '📊', badge: 'Disponível' },
          { nome: 'Desempenho Acadêmico por Região', desc: 'Taxas de aprovação e reprovação detalhadas', icon: '📈', badge: 'Disponível' },
          { nome: 'Relatório de Evasão Escolar', desc: 'Causas, tendências e distribuição geográfica', icon: '⚠', badge: 'Disponível' },
          { nome: 'Distribuição de Recursos Humanos', desc: 'Professores por escola, qualificação e disciplina', icon: '👥', badge: 'Disponível' },
          { nome: 'Paridade de Género no Sistema Educativo', desc: 'Análise por nível escolar e região', icon: '⚖', badge: 'Disponível' },
        ].map(r => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px">
            <span style="font-size:24px">${r.icon}</span>
            <div style="flex:1">
              <div style="font-size:14px;color:var(--text-primary);font-weight:600">${r.nome}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${r.desc}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-outline btn-sm" onclick="alert('Pré-visualizar: ${r.nome}')">👁 Ver</button>
              <button class="btn btn-gold btn-sm" onclick="exportPDF('${r.nome}')">📄 PDF</button>
              <button class="btn btn-outline btn-sm" onclick="exportData('${r.nome}')">📊 Excel</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div>
        <h3 style="font-family:var(--font-serif);font-size:16px;font-weight:400;color:var(--text-secondary);margin-bottom:16px">Relatórios de Gestão</h3>
        ${[
          { nome: 'Boletim Escolar por Turma', desc: 'Notas e médias individuais', icon: '📋', badge: 'Personalizado' },
          { nome: 'Ficha do Aluno', desc: 'Histórico académico completo', icon: '👤', badge: 'Personalizado' },
          { nome: 'Listagem de Professores por Escola', desc: 'Dados pessoais e disciplinas', icon: '📝', badge: 'Personalizado' },
          { nome: 'Mapa de Frequência Mensal', desc: 'Assiduidade por turma', icon: '📅', badge: 'Personalizado' },
          { nome: 'Relatório de Transferências', desc: 'Histórico de movimentos de alunos', icon: '🔄', badge: 'Personalizado' },
        ].map(r => `
          <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:16px;margin-bottom:12px;display:flex;align-items:center;gap:16px">
            <span style="font-size:24px">${r.icon}</span>
            <div style="flex:1">
              <div style="font-size:14px;color:var(--text-primary);font-weight:600">${r.nome}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${r.desc}</div>
            </div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary btn-sm" onclick="alert('Configurar relatório: ${r.nome}')">Configurar</button>
            </div>
          </div>
        `).join('')}

        <div style="background:var(--bg-card2);border:1px solid var(--border-accent);border-radius:var(--radius);padding:20px;margin-top:20px">
          <div style="font-size:13px;color:var(--accent);font-weight:700;margin-bottom:8px">📧 Agendamento Automático</div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px">Configure envio automático de relatórios por email aos gestores.</div>
          <button class="btn btn-primary" onclick="alert('Configurar agendamento de relatórios')">Configurar Agendamento</button>
        </div>
      </div>
    </div>
  `;
}

function showModalEscola() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Registar Nova Escola</div>
      <div class="modal-grid">
        <div class="form-group"><label>Nome da Escola</label><input type="text" placeholder="Ex: EB Samora Machel"/></div>
        <div class="form-group"><label>Tipo</label><select><option>Primária</option><option>Básica</option><option>Secundária</option></select></div>
        <div class="form-group"><label>Província</label><select>
          <option>Maputo Cidade</option><option>Maputo Prov.</option><option>Gaza</option>
          <option>Inhambane</option><option>Sofala</option><option>Manica</option>
          <option>Tete</option><option>Zambézia</option><option>Nampula</option>
          <option>Niassa</option><option>Cabo Delgado</option>
        </select></div>
        <div class="form-group"><label>Distrito</label><input type="text" placeholder="Ex: Matola"/></div>
        <div class="form-group"><label>Localidade/Bairro</label><input type="text" placeholder="Ex: Bairro Central"/></div>
        <div class="form-group"><label>Código da Escola</label><input type="text" placeholder="Ex: MZ-GZ-001"/></div>
        <div class="form-group"><label>Telefone</label><input type="tel" placeholder="+258 21 000 000"/></div>
        <div class="form-group"><label>Email</label><input type="email" placeholder="escola@mec.gov.mz"/></div>
      </div>
      <div class="form-group" style="margin-top:16px"><label>Coordenadas GPS (Latitude, Longitude)</label><input type="text" placeholder="-25.9692, 32.5732"/></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancelar</button>
        <button class="btn btn-primary" onclick="alert('Escola registada com sucesso!');this.closest('.modal-overlay').remove()">Guardar Escola</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

function exportPDF(nome) {
  alert(`📄 A gerar PDF: "${nome || 'Relatório Seleccionado'}"\n\nEm ambiente de produção, este botão geraria um relatório PDF oficial do MEC com cabeçalho institucional, dados filtrados e assinatura digital.`);
}

function exportData(nome) {
  alert(`📊 A exportar Excel: "${nome || 'Dados Seleccionados'}"\n\nEm ambiente de produção, seria gerado um ficheiro .xlsx com todos os dados filtrados, formatado segundo o modelo oficial do MEC.`);
}

// Start date update
setInterval(setDate, 60000);
