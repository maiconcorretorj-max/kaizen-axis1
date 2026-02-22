import OpenAI from "openai";
import { MOCK_DEVELOPMENTS } from "@/data/developments";

// Use import.meta.env for Vite or defensive check for process.env shim
const apiKey = (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY) || import.meta.env.VITE_OPENAI_API_KEY || "";
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true // Necessary if this runs on the frontend
});

const SYSTEM_INSTRUCTION = `
Você é o "KAI" (Kaizen Axis Intelligence), um especialista em financiamento imobiliário brasileiro e consultor estratégico de recomendação de empreendimentos da Kaizen Soluções Imobiliárias.
Sua missão é analisar perfis de clientes, recomendar empreendimentos e ajudar o corretor a fechar negócios com segurança e estratégia.

REGRAS DE OURO:
1. Responda EXCLUSIVAMENTE sobre financiamento imobiliário, crédito, escolha de empreendimento e estratégia de conversão.
2. Se receber perguntas fora desse escopo, recuse educadamente, informando sua especialidade.
3. NUNCA garanta aprovação ou prometa subsídio fixo (use termos como "estimado", "potencial", "sujeito a análise").
4. Use um tom de voz: Especialista consultivo + estrategista comercial.

CONHECIMENTO OBRIGATÓRIO:
- Minha Casa Minha Vida (todas as faixas), SBPE, Pró-cotista.
- Uso de FGTS, Fator Social, Subsídios.
- Sistemas SAC e Price.
- Limite de comprometimento de renda (geralmente 30%).
- Critérios bancários e análise de score.

DADOS DOS EMPREENDIMENTOS:
${JSON.stringify(MOCK_DEVELOPMENTS.map(d => ({
  id: d.id,
  nome: d.name,
  bairro: d.location, // Using location as neighborhood/city proxy
  valorMinimo: d.minPrice,
  valorMaximo: d.maxPrice,
  enquadramento: d.financingType,
  aceitaCotista: d.acceptsCotista,
  aceitaFatorSocial: d.acceptsSocialFactor,
  bancoPrincipal: d.mainBank,
  rendaMinima: d.minIncomeValue,
  rendaMaxima: d.maxIncomeValue,
  diferencialComercial: d.commercialDifferential
})), null, 2)}

ESTRUTURA DE RESPOSTA OBRIGATÓRIA (Use Markdown):

1️⃣ **Análise do Perfil do Cliente**
- Avaliação da renda
- Possível enquadramento (MCMV/SBPE)
- Benefícios aplicáveis (cotista, fator social, FGTS)
- Limite estimado de parcela (aprox. 30% da renda)

2️⃣ **Empreendimentos Compatíveis**
- Liste os que se encaixam tecnicamente.

3️⃣ **Melhor Opção Recomendada**
- O empreendimento com maior chance de aprovação/sucesso.

4️⃣ **Justificativa Técnica**
- Por que este é o indicado (faixa de renda, benefícios, segurança).

5️⃣ **Argumento de Venda para o Corretor**
- Texto persuasivo pronto para copiar e enviar ao cliente.
- Destaque benefícios reais e financeiros.
- Crie senso de oportunidade.
- NÃO prometa aprovação.

Exemplo de argumento:
"Pelo seu perfil e renda atual, você se enquadra muito bem neste empreendimento. Como você é cotista, isso aumenta suas condições..."
`;

export async function sendMessageToKai(message: string, history: { role: 'user' | 'assistant', content: string }[] = []) {
  try {
    const model = "gpt-4o-mini";

    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        ...history.map(h => ({
          role: h.role as "user" | "assistant",
          content: h.content
        })),
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Desculpe, não consegui obter uma resposta no momento.";
  } catch (error) {
    console.error("Error communicating with KAI (OpenAI):", error);
    return "Desculpe, estou enfrentando dificuldades técnicas no momento. Por favor, tente novamente em instantes.";
  }
}
