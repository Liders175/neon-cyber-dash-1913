
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAICoachingMessage = async (score: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Ти - крутий кібер-тренер гри Neon Cyber Dash. Гість програв з рахунком ${score}. Напиши дуже коротке (до 10 слів), саркастичне, але мотивуюче повідомлення українською мовою для наступної спроби.`,
    });
    return response.text || "Спробуй ще раз, самураю!";
  } catch (error) {
    console.error("AI Coach error:", error);
    return "Не зупиняйся, швидкість - це життя!";
  }
};
