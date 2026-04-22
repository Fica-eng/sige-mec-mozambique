# SIGE — Sistema de Gestão Educacional
## Ministério da Educação e Cultura de Moçambique

![SIGE MEC Moçambique](https://img.shields.io/badge/MEC-Mo%C3%A7ambique-009A44?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Demo%20Pronto-FCB017?style=for-the-badge)
![Licença](https://img.shields.io/badge/Licen%C3%A7a-Gov%20MZ-D21034?style=for-the-badge)

Sistema de Administração Educacional com foco em **Relatórios e Estatísticas** para o Ministério da Educação e Cultura de Moçambique.

---

## 🌐 Demo ao Vivo

👉 **[Aceder ao Sistema](https://SEU-UTILIZADOR.github.io/sige-mec-mozambique/)**

**Credenciais de demonstração:**
- Email: `admin@mec.gov.mz`
- Senha: `admin123`
- Perfil: Admin MEC

---

## 📋 Módulos Implementados

| Módulo | Status |
|--------|--------|
| 🏫 Dashboard com KPIs nacionais | ✅ Completo |
| 🏫 Gestão de Escolas | ✅ Completo |
| 👨‍🎓 Gestão de Alunos | ✅ Completo |
| 👩‍🏫 Gestão de Professores | ✅ Completo |
| 📝 Notas e Avaliações | ✅ Completo |
| 📊 Estatísticas de Matrículas | ✅ Completo |
| 📈 Desempenho Acadêmico | ✅ Completo |
| ⚠ Evasão Escolar | ✅ Completo |
| 👥 Recursos Humanos | ✅ Completo |
| 📄 Central de Relatórios | ✅ Completo |

---

## 🚀 Como Hospedar no GitHub Pages

### Passo 1: Criar repositório no GitHub
1. Aceda a [github.com](https://github.com) e faça login
2. Clique em **"New repository"**
3. Nome sugerido: `sige-mec-mozambique`
4. Deixe público (necessário para GitHub Pages gratuito)
5. Clique **"Create repository"**

### Passo 2: Fazer upload dos ficheiros
**Opção A — Via interface web (mais fácil):**
1. No repositório criado, clique em **"uploading an existing file"**
2. Arraste os 4 ficheiros: `index.html`, `style.css`, `app.js`, `data.js`
3. Clique **"Commit changes"**

**Opção B — Via Git (linha de comandos):**
```bash
git clone https://github.com/SEU-UTILIZADOR/sige-mec-mozambique.git
cd sige-mec-mozambique
# copie os 4 ficheiros para esta pasta
git add .
git commit -m "Lançamento inicial SIGE MEC Moçambique"
git push origin main
```

### Passo 3: Activar GitHub Pages
1. No repositório, clique em **"Settings"** (Definições)
2. No menu lateral, clique em **"Pages"**
3. Em "Source", seleccione **"Deploy from a branch"**
4. Seleccione branch **"main"** e pasta **"/ (root)"**
5. Clique **"Save"**
6. Aguarde 1-2 minutos

### Passo 4: Aceder ao sistema
O URL será: `https://SEU-UTILIZADOR.github.io/sige-mec-mozambique/`

---

## 🏗 Arquitectura Técnica

```
sige-mec-mozambique/
├── index.html      # Estrutura HTML principal + Login
├── style.css       # Estilos completos (tema MEC/Moçambique)
├── app.js          # Lógica, navegação, gráficos, páginas
├── data.js         # Dados de demonstração
└── README.md       # Esta documentação
```

**Tecnologias:**
- HTML5 + CSS3 (sem framework CSS externo)
- JavaScript Vanilla (sem dependências pesadas)
- Chart.js 4.4 (gráficos interactivos, via CDN)
- Google Fonts (Libre Baskerville + IBM Plex Mono + Source Sans 3)

---

## 📊 Funcionalidades de Destaque

- **Dashboard executivo** com 6 KPIs nacionais
- **10 módulos** completamente funcionais
- **Gráficos interactivos** (linha, barra, pizza, doughnut, radar)
- **Filtros** por ano e província
- **Sistema de login** com 4 perfis de acesso
- **Sidebar colapsável** para mais espaço
- **Design responsivo** para desktop e tablet
- **Paleta de cores** baseada na bandeira de Moçambique
- **Exportação** PDF e Excel (pronto para integração)

---

## 🎨 Design

O sistema utiliza uma paleta inspirada na **bandeira nacional de Moçambique**:
- 🟢 Verde `#009A44` — cor principal/acento
- ⚫ Preto `#0A0F1E` — fundo escuro
- 🟡 Amarelo `#FCB017` — destaques
- 🔴 Vermelho `#D21034` — alertas

---

## 📞 Próximos Passos (Versão Completa)

Para uma solução de produção completa, seria necessário:
- Backend (Node.js / Python / PHP) com base de dados PostgreSQL
- API REST para dados reais
- Autenticação com JWT e controlo de sessões
- Integração com sistemas legados do MEC
- Módulo offline-first para escolas sem internet
- Suporte a línguas locais (Emakhuwa, Sena, Ndau, etc.)

---

**Desenvolvido para o Ministério da Educação e Cultura da República de Moçambique**
