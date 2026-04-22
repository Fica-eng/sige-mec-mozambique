// ============================================
// SIGE — Dados de Demonstração
// MEC Moçambique
// ============================================

const DATA = {

  kpis: {
    totalEscolas: 9847,
    totalAlunos: 6241830,
    totalProfessores: 187450,
    taxaAprovacao: 71.4,
    taxaEvasao: 8.2,
    ratioProfAluno: 33,
    taxaMatricula: 88.6,
    escolaridadeMedia: 7.2
  },

  provincias: [
    { nome: "Nampula",      alunos: 1241600, escolas: 2134, professores: 38200, aprov: 68.2, evasao: 9.1 },
    { nome: "Zambézia",     alunos: 1089400, escolas: 1876, professores: 33100, aprov: 65.8, evasao: 10.4 },
    { nome: "Tete",         alunos: 621300,  escolas: 986,  professores: 18700, aprov: 72.1, evasao: 7.8  },
    { nome: "Sofala",       alunos: 589200,  escolas: 904,  professores: 17800, aprov: 74.3, evasao: 7.2  },
    { nome: "Maputo Prov",  alunos: 541800,  escolas: 742,  professores: 16400, aprov: 81.7, evasao: 5.1  },
    { nome: "Gaza",         alunos: 487600,  escolas: 698,  professores: 14900, aprov: 76.4, evasao: 6.8  },
    { nome: "Niassa",       alunos: 421300,  escolas: 621,  professores: 12800, aprov: 63.9, evasao: 12.3 },
    { nome: "Manica",       alunos: 398700,  escolas: 589,  professores: 12100, aprov: 73.8, evasao: 8.0  },
    { nome: "Inhambane",    alunos: 376400,  escolas: 534,  professores: 11400, aprov: 77.2, evasao: 6.4  },
    { nome: "Cabo Delgado", alunos: 312100,  escolas: 478,  professores: 9400,  aprov: 61.4, evasao: 14.7 },
    { nome: "Maputo Cidade",alunos: 162430,  escolas: 285,  professores: 13150, aprov: 84.6, evasao: 4.2  },
  ],

  evolucaoMatriculas: {
    anos: [2019, 2020, 2021, 2022, 2023, 2024],
    total: [5412000, 5698000, 5841000, 5980000, 6089000, 6241830],
    masculino: [2844000, 2991000, 3062000, 3128000, 3184000, 3261000],
    feminino: [2568000, 2707000, 2779000, 2852000, 2905000, 2980830]
  },

  desempenhoPorDisciplina: {
    disciplinas: ["Português", "Matemática", "Inglês", "História", "Ciências", "Ed. Física", "Geografia"],
    taxaAprovacao: [74.2, 58.3, 62.1, 79.8, 68.4, 91.2, 76.5],
    media: [11.8, 9.4, 10.1, 12.6, 11.2, 14.8, 12.2]
  },

  evasaoPorCausa: {
    causas: ["Dificuldade Financeira", "Trabalho Infantil", "Casamento Precoce", "Distância da Escola", "Gravidez", "Falta de Interesse", "Outras"],
    percentual: [31.4, 22.8, 14.6, 12.3, 9.1, 6.4, 3.4]
  },

  evasaoEvolutiva: {
    anos: [2019, 2020, 2021, 2022, 2023, 2024],
    taxa: [10.8, 11.2, 9.9, 9.1, 8.6, 8.2]
  },

  distribuicaoPorNivel: {
    niveis: ["EP1 (1ª–5ª)", "EP2 (6ª–7ª)", "ESG1 (8ª–10ª)", "ESG2 (11ª–12ª)"],
    alunos: [3841200, 1204600, 872400, 323630]
  },

  escolas: [
    { id: 1,  nome: "EB 25 de Setembro",         provincia: "Maputo Cidade", distrito: "KaMpfumu",  tipo: "Primária",   alunos: 1842, professores: 48, aprov: 87.2 },
    { id: 2,  nome: "Escola Secundária Josina",    provincia: "Maputo Cidade", distrito: "KaMaxakeni", tipo: "Secundária", alunos: 2156, professores: 62, aprov: 81.4 },
    { id: 3,  nome: "EB Eduardo Mondlane",        provincia: "Gaza",          distrito: "Xai-Xai",    tipo: "Primária",   alunos: 1234, professores: 34, aprov: 74.8 },
    { id: 4,  nome: "EPC Samora Machel",           provincia: "Nampula",       distrito: "Nampula",    tipo: "Primária",   alunos: 2341, professores: 58, aprov: 69.1 },
    { id: 5,  nome: "Escola Sec. de Nacala",      provincia: "Nampula",       distrito: "Nacala",     tipo: "Secundária", alunos: 1876, professores: 51, aprov: 66.8 },
    { id: 6,  nome: "EB Frelimo",                  provincia: "Zambézia",      distrito: "Quelimane",  tipo: "Primária",   alunos: 1654, professores: 43, aprov: 63.4 },
    { id: 7,  nome: "Escola Sec. da Beira",       provincia: "Sofala",        distrito: "Beira",      tipo: "Secundária", alunos: 2098, professores: 57, aprov: 76.9 },
    { id: 8,  nome: "EPC Kwame Nkrumah",           provincia: "Tete",          distrito: "Tete",       tipo: "Primária",   alunos: 1432, professores: 38, aprov: 71.2 },
    { id: 9,  nome: "Escola Sec. de Chimoio",     provincia: "Manica",        distrito: "Chimoio",    tipo: "Secundária", alunos: 1789, professores: 49, aprov: 73.6 },
    { id: 10, nome: "EB Agosto de 1975",           provincia: "Inhambane",     distrito: "Inhambane",  tipo: "Primária",   alunos: 1123, professores: 31, aprov: 78.1 },
    { id: 11, nome: "EPC Julius Nyerere",          provincia: "Niassa",        distrito: "Lichinga",   tipo: "Primária",   alunos: 987,  professores: 27, aprov: 61.8 },
    { id: 12, nome: "Escola Sec. de Pemba",       provincia: "Cabo Delgado",  distrito: "Pemba",      tipo: "Secundária", alunos: 1456, professores: 41, aprov: 59.4 },
  ],

  alunos: [
    { id: 1,   nome: "Ana Beatriz Machava",     escola: "EB 25 de Setembro",       serie: "5ª Classe",  genero: "F", status: "Ativo",     media: 13.4 },
    { id: 2,   nome: "Carlos Nhantumbo",         escola: "EPC Samora Machel",       serie: "7ª Classe",  genero: "M", status: "Ativo",     media: 11.2 },
    { id: 3,   nome: "Fátima Sitoe",             escola: "Escola Sec. Josina",      serie: "10ª Classe", genero: "F", status: "Ativo",     media: 14.8 },
    { id: 4,   nome: "João Munguambe",           escola: "EB Eduardo Mondlane",     serie: "3ª Classe",  genero: "M", status: "Ativo",     media: 10.6 },
    { id: 5,   nome: "Maria Conceição Bila",    escola: "Escola Sec. de Nacala",   serie: "11ª Classe", genero: "F", status: "Transferido",media: 12.1 },
    { id: 6,   nome: "Pedro Cossa",              escola: "Escola Sec. da Beira",    serie: "9ª Classe",  genero: "M", status: "Ativo",     media: 9.8  },
    { id: 7,   nome: "Rosa Chissano",            escola: "EB Frelimo",              serie: "4ª Classe",  genero: "F", status: "Ativo",     media: 12.9 },
    { id: 8,   nome: "Tomás Macuacua",           escola: "EPC Kwame Nkrumah",       serie: "6ª Classe",  genero: "M", status: "Evadido",   media: 8.1  },
    { id: 9,   nome: "Lurdes Mondlane",          escola: "Escola Sec. de Chimoio",  serie: "12ª Classe", genero: "F", status: "Ativo",     media: 15.2 },
    { id: 10,  nome: "Eugénio Tembe",            escola: "EB Agosto de 1975",       serie: "2ª Classe",  genero: "M", status: "Ativo",     media: 11.7 },
  ],

  professores: [
    { id: 1,  nome: "Dr. António Mabunda",    escola: "Escola Sec. Josina",     disciplina: "Matemática",  nivel: "Licenciatura", anos: 14, avaliacao: 4.7 },
    { id: 2,  nome: "Dra. Celeste Chaúque",   escola: "EB 25 de Setembro",      disciplina: "Português",   nivel: "Bacharelato",  anos: 8,  avaliacao: 4.4 },
    { id: 3,  nome: "Prof. David Cumbe",       escola: "Escola Sec. da Beira",   disciplina: "Inglês",      nivel: "Licenciatura", anos: 11, avaliacao: 4.5 },
    { id: 4,  nome: "Dra. Helena Uaiene",     escola: "EPC Samora Machel",      disciplina: "Ciências",    nivel: "Mestrado",     anos: 17, avaliacao: 4.9 },
    { id: 5,  nome: "Prof. Jaime Baloi",       escola: "Escola Sec. de Pemba",   disciplina: "História",    nivel: "Bacharelato",  anos: 5,  avaliacao: 3.9 },
    { id: 6,  nome: "Dra. Lurdes Nguenha",    escola: "Escola Sec. de Chimoio", disciplina: "Geografia",   nivel: "Licenciatura", anos: 9,  avaliacao: 4.3 },
    { id: 7,  nome: "Prof. Manuel Matsinhe",   escola: "EB Eduardo Mondlane",    disciplina: "Ed. Física",  nivel: "Bacharelato",  anos: 6,  avaliacao: 4.1 },
    { id: 8,  nome: "Dra. Natércia Guambe",   escola: "EPC Kwame Nkrumah",      disciplina: "Matemática",  nivel: "Licenciatura", anos: 12, avaliacao: 4.6 },
  ],

  ratioProvincial: [
    { provincia: "Maputo Cidade", ratio: 12, meta: 30, status: "Ótimo"  },
    { provincia: "Maputo Prov.",  ratio: 24, meta: 35, status: "Bom"    },
    { provincia: "Gaza",          ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Inhambane",     ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Sofala",        ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Manica",        ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Tete",          ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Zambézia",      ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Nampula",       ratio: 33, meta: 35, status: "Bom"    },
    { provincia: "Niassa",        ratio: 33, meta: 35, status: "Crítico"},
    { provincia: "Cabo Delgado",  ratio: 33, meta: 35, status: "Crítico"},
  ]
};
