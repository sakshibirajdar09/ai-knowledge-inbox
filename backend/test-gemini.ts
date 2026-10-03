import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
async function run() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const res = await model.generateContent("hello");
    console.log("SUCCESS basic:", res.response.text());
  } catch(e) {
    console.error("FAIL basic:", e.message);
  }

  try {
    const model2 = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: "You are a helpful assistant"
    });
    const res2 = await model2.generateContent("hello");
    console.log("SUCCESS system:", res2.response.text());
  } catch(e) {
    console.error("FAIL system:", e.message);
  }
}
run();
