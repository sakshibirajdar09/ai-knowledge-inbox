import { GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';
import { logger } from '../utils/logger';

export const generateAnswerStream = async (question: string, context: string): Promise<GenerateContentStreamResult> => {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }

  const systemPrompt = `You are an assistant answering questions using the user's saved knowledge.
Use the provided context to answer the question.
If the answer cannot be found in the context, clearly say that the saved knowledge does not contain enough information.
Do not invent facts.

CRITICAL INSTRUCTION: You MUST cite your sources inline using bracketed notation mapped to the source IDs provided in the context (e.g., "This is a fact [1]." or "Another fact [2][3].").
Format answers using clean markdown (bold emphasis, bulleted lists, code styling).

Context:
----------------
${context}
----------------
`;

  const modelsToTry = [
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
    "gemini-3.5-flash"
  ];
  
  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      logger.info(`Attempting to generate answer stream with ${currentModel}`);
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: currentModel,
        systemInstruction: systemPrompt 
      });
      
      const result = await model.generateContentStream(question);
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      logger.warn(`Failed with model ${currentModel}: ${errorMessage}`);
      
      // If this was the last model in the chain, throw the error
      if (i === modelsToTry.length - 1) {
        logger.error('All models in fallback chain failed.');
        throw new Error(`AI Engine Error: ${errorMessage}`);
      }
      
      // Otherwise, wait 500ms and try the next model
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  throw new Error('AI Engine Error: Failed after maximum retries');
};
