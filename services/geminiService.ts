import { GoogleGenAI } from "@google/genai";

function getApiKey(): string | undefined {
  const key = (process.env.API_KEY || process.env.GEMINI_API_KEY || "").trim();
  return key ? key : undefined;
}

export const getAICoachingMessage = async (score: number): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // В браузері без ключа — просто не ламаємо гру
    return "Спробуй ще раз, самураю!";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Ти - крутий кібер-тренер гри Neon Cyber Dash. Гість програв з рахунком ${score}. Напиши дуже коротке (до 10 слів), саркастичне, але мотивуюче повідомлення українською мовою для наступної спроби.`,
    });

    return response.text || "Спробуй ще раз, самураю!";
  } catch (error) {
    console.error("AI Coach error:", error);
    return "Не зупиняйся, швидкість - це життя!";
  }
};
