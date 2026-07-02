import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

export const analyzeCircuit = async (
  base64Image: string,
  mimeType: string,
  description: string,
  language: string
): Promise<string> => {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }

  // Use gemini-2.5-flash for vision tasks as requested
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const langInstruction = language === 'hi' 
    ? 'Please respond entirely in Hindi.' 
    : 'Please respond entirely in English.';

  const systemPrompt = `
You are an expert hydraulic and mechanical circuit diagnostic assistant.
Analyze the provided circuit diagram image and the user's problem description.

Instructions:
1. Identify visible components if legible.
2. Reason step by step about likely causes of the stated symptom.
3. Suggest a prioritized check order for troubleshooting.
4. Explicitly flag when image quality or legibility limits your confidence.
5. End with a short disclaimer: "This is an AI-generated triage aid, not a certified diagnosis. Always consult a professional and follow safety protocols."

${langInstruction}
`;

  const prompt = `Problem Description: ${description}\n\n${systemPrompt}`;

  const imageParts = [
    {
      inlineData: {
        data: base64Image,
        mimeType
      },
    },
  ];

  const result = await model.generateContent([prompt, ...imageParts]);
  const response = result.response;
  return response.text();
};
