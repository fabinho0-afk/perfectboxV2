import { GoogleGenAI } from "@google/genai";

export interface AnalysisResult {
  status: 'Íntegro' | 'Deformado' | 'Danificado';
  confidence: number;
  anomalies: string[];
  geometricAnalysis: {
    parallelism: string;
    orthogonality: string;
    surfaceIntegrity: string;
  };
  technicalDetails: string;
}

export async function analyzePackageIntegrity(imageBase64: string): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY_VERCEL;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY_VERCEL is not defined. Please check your environment variables.");
  }
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Analise esta imagem de uma caixa de papelão para controle de qualidade industrial.
    Identifique deformações, rasgos, amassados ou irregularidades geométricas.
    
    Responda estritamente em formato JSON com a seguinte estrutura:
    {
      "status": "Íntegro" | "Deformado" | "Danificado",
      "confidence": número entre 0 e 1,
      "anomalies": ["lista de strings"],
      "geometricAnalysis": {
        "parallelism": "descrição curta",
        "orthogonality": "descrição curta",
        "surfaceIntegrity": "descrição curta"
      },
      "technicalDetails": "explicação técnica detalhada"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: imageBase64.split(',')[1] || imageBase64
              }
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("Resposta vazia da IA.");
    const result = JSON.parse(text.trim());
    return result as AnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}
