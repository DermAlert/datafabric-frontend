export const Patients = [
  {
    id: "p-001",
    nome: "Maria Aparecida Silva",
    idade: 54,
    genero: "Feminino",
    dataSubmissao: "2025-11-20T08:30:00",
    scoreRiscoML: "ALTO",
    anamnese: {
      fototipo: {
        cor_pele: "Branca",
        reacao_sol: "Queima com facilidade",
        cor_olhos: "Azuis"
      },
      historico: {
        familiar: true,
        pessoal: false,
        detalhe_familiar: "Pai com histórico de Melanoma"
      },
      risco: {
        protetor_solar: false,
        exposicao: "Diária (Trabalho rural)"
      }
    },
    lesoes: [
      {
        id: "l-01",
        localizacao: "Antebraço Esquerdo",
        coordenadas: { x: 75, y: 45 },
        descricao: "Mancha assimétrica com bordas irregulares.",
        fotoUrl: "https://placehold.co/300x300/png?text=Lesao+Braço",
        predicaoML: "Melanoma (89%)"
      },
      {
        id: "l-02",
        localizacao: "Face",
        coordenadas: { x: 50, y: 15 },
        descricao: "Pequena sarda.",
        fotoUrl: "https://placehold.co/300x300/png?text=Lesao+Face",
        predicaoML: "Benigno (98%)"
      }
    ]
  },
  {
    id: "p-002",
    nome: "João Oliveira",
    idade: 29,
    genero: "Masculino",
    dataSubmissao: "2025-11-20T09:15:00",
    scoreRiscoML: "BAIXO",
    anamnese: {
      fototipo: {
        cor_pele: "Morena",
        reacao_sol: "Bronzeia facilmente",
        cor_olhos: "Castanhos"
      },
      historico: {
        familiar: false,
        pessoal: false,
        detalhe_familiar: ""
      },
      risco: {
        protetor_solar: true,
        exposicao: "Ocasional"
      }
    },
    lesoes: [
      {
        id: "l-03",
        localizacao: "Ombro Direito",
        coordenadas: { x: 35, y: 25 },
        descricao: "Pinta uniforme.",
        fotoUrl: "https://placehold.co/300x300/png?text=Lesao+Ombro",
        predicaoML: "Benigno (95%)"
      }
    ]
  }
];