export interface AutomationLead {
  id: string;
  name: string;
  phone: string;
  origin: string;
  timestamp: string;
  aiSummary: string;
  interestLevel: 'Alto' | 'Médio' | 'Baixo';
  data?: {
    income?: string;
    region?: string;
    propertyType?: string;
  };
}

export const MOCK_LEADS: AutomationLead[] = [
  {
    id: 'lead-001',
    name: 'Contato via Instagram',
    phone: '11999998888',
    origin: 'Instagram Ads - Campanha Lançamento',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    aiSummary: 'Cliente interessado em apartamentos de 2 dormitórios na zona sul. Renda compatível com financiamento. Perguntou sobre entrada parcelada.',
    interestLevel: 'Alto',
    data: {
      income: 'R$ 8.000',
      region: 'Zona Sul',
      propertyType: 'Apartamento 2 dorms'
    }
  },
  {
    id: 'lead-002',
    name: 'Visitante Site',
    phone: '11977776666',
    origin: 'Site Oficial - Formulário Contato',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    aiSummary: 'Dúvida sobre valores do empreendimento Vista Verde. Ainda não possui financiamento aprovado.',
    interestLevel: 'Médio',
    data: {
      income: 'Não informado',
      region: 'Centro',
      propertyType: 'Studio'
    }
  }
];
