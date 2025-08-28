
import { GoogleGenAI, Type } from "@google/genai";
import type { Insights } from '../types';

const API_KEY = process.env.API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
    console.warn("API_KEY environment variable not set. AI features will use mock data.");
}

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A brief, rolling summary of the conversation so far. Should be no more than 2-3 sentences.",
    },
    actionItems: {
      type: Type.ARRAY,
      description: "A list of clear, concise action items identified from the conversation. Each item should be a short string.",
      items: { type: Type.STRING },
    },
    talkingPoints: {
      type: Type.ARRAY,
      description: "A list of suggested talking points or follow-up questions to guide the conversation or explore topics further. Each item should be a short string.",
      items: { type: Type.STRING },
    },
  },
  required: ["summary", "actionItems", "talkingPoints"],
};


export const getInsightsFromTranscript = async (transcript: string): Promise<Insights | null> => {
  if (!ai) {
    // Return mock data if API key is not present or initialization failed
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return {
      summary: "This is a mock summary because the Gemini API key is not configured. The assistant provides real-time analysis of the conversation.",
      actionItems: ["Mock Action: Finalize Q3 roadmap.", "Mock Action: Draft resource request for developers."],
      talkingPoints: ["Mock Suggestion: What are the key performance indicators (KPIs)?", "Mock Suggestion: Discuss potential risks and mitigation strategies."]
    };
  }

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Based on the following meeting transcript, please provide a summary, action items, and talking points. \n\nTranscript:\n${transcript}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const jsonText = result.text.trim();
    const parsedJson = JSON.parse(jsonText);
    
    if (parsedJson && typeof parsedJson.summary === 'string' && Array.isArray(parsedJson.actionItems) && Array.isArray(parsedJson.talkingPoints)) {
        return parsedJson as Insights;
    } else {
        console.error("Parsed JSON does not match Insights structure:", parsedJson);
        return null;
    }

  } catch (error) {
    console.error("Error generating insights from Gemini:", error);
    return null;
  }
};
