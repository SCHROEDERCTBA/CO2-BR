import { defineFlow, generate } from '@genkit-ai/flow';
import { geminiPro } from '@genkit-ai/googleai';
import { z } from 'zod';

// Define the structure of the data we want the AI to extract.
const OrderDataSchema = z.object({
  customer_name: z.string().describe('O nome completo do cliente.'),
  customer_cpf: z.string().describe('O CPF do cliente, se houver.'),
  customer_phone: z.string().describe('O número de telefone ou WhatsApp do cliente.'),
  customer_email: z.string().describe('O endereço de e-mail do cliente.'),
  customer_address: z.string().describe('O endereço de entrega completo do cliente (rua, número, bairro).'),
  customer_zip: z.string().describe('O CEP (código postal) do cliente.'),
  notes: z.string().describe('Quaisquer observações ou detalhes adicionais sobre o pedido.'),
});

// Define the AI flow
export const parseOrderTextFlow = defineFlow(
  {
    name: 'parseOrderTextFlow',
    inputSchema: z.object({ text: z.string() }),
    outputSchema: OrderDataSchema,
  },
  async (input) => {
    const prompt = `
      Você é um assistente de entrada de dados altamente preciso para um sistema de gerenciamento de pedidos.
      Sua tarefa é analisar o texto fornecido pelo usuário e extrair as informações do cliente e do pedido.
      O texto pode estar desestruturado, contendo várias informações misturadas.
      Extraia os seguintes campos e preencha-os no formato JSON solicitado:
      - customer_name: O nome completo do cliente.
      - customer_cpf: O CPF do cliente.
      - customer_phone: O número de telefone ou WhatsApp.
      - customer_email: O e-mail do cliente.
      - customer_address: O endereço de entrega (rua, número, bairro).
      - customer_zip: O CEP.
      - notes: Observações gerais sobre o pedido.

      Se uma informação específica não estiver presente no texto, retorne uma string vazia para o campo correspondente.
      Analise o seguinte texto:

      --- TEXTO DO USUÁRIO ---
      ${input.text}
      --- FIM DO TEXTO ---
    `;

    const llmResponse = await generate({
      prompt: prompt,
      model: geminiPro,
      output: {
        schema: OrderDataSchema,
      },
    });

    return llmResponse.output()!;
  }
);
