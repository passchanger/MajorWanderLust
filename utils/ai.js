async function getAiResponse(prompt) {
    try {
        // 1. Connect to the library
        const { GoogleGenAI } = await import("@google/genai");
        const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        // 2. Ask the question
        const result = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ 
                role: "user", 
                parts: [{ text: "You are a travel guide. Answer this: " + prompt }] 
            }]
        });

        // 3. Send the answer back
        return result.text; 

    } catch (error) {
        console.error("AI Error:", error.message);
        return "I'm having a bit of trouble. Try asking again!";
    }
}
module.exports = getAiResponse;