// src/ai/flows/categorize-transaction.ts
'use server';

/**
 * @fileOverview An AI agent that categorizes transactions based on description.
 *
 * - categorizeTransaction - A function that categorizes a transaction.
 * - CategorizeTransactionInput - The input type for the categorizeTransaction function.
 * - CategorizeTransactionOutput - The return type for the categorizeTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategorizeTransactionInputSchema = z.object({
  transactionDescription: z
    .string()
    .describe('The description of the transaction to categorize.'),
  vendorName: z.string().optional().describe('The name of the vendor, if available.'),
});
export type CategorizeTransactionInput = z.infer<typeof CategorizeTransactionInputSchema>;

const CategorizeTransactionOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The category of the transaction.  For example: Food, Rent, Transportation, Shopping, Entertainment, Utilities, Salary, Investments, etc.'
    ),
  confidence: z
    .number()
    .describe('A number between 0 and 1 indicating the confidence in the categorization.'),
});
export type CategorizeTransactionOutput = z.infer<typeof CategorizeTransactionOutputSchema>;

export async function categorizeTransaction(
  input: CategorizeTransactionInput
): Promise<CategorizeTransactionOutput> {
  return categorizeTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'categorizeTransactionPrompt',
  input: {schema: CategorizeTransactionInputSchema},
  output: {schema: CategorizeTransactionOutputSchema},
  prompt: `You are a personal finance expert.  Your job is to categorize transactions into common categories.

  The available categories are: Food, Rent, Transportation, Shopping, Entertainment, Utilities, Salary, Investments, Other

  Please categorize the following transaction.  If the vendor name is available, use it to help you categorize the transaction.

  Transaction Description: {{{transactionDescription}}}
  Vendor Name: {{{vendorName}}}

  Respond ONLY with a valid JSON object conforming to the schema.  The confidence score should represent how certain you are of the category.  If you are not sure, default to the \"Other\" category and give a low confidence score.
  `,
});

const categorizeTransactionFlow = ai.defineFlow(
  {
    name: 'categorizeTransactionFlow',
    inputSchema: CategorizeTransactionInputSchema,
    outputSchema: CategorizeTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
