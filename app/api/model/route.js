import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();

    const key = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const llm = new ChatGroq({
      model: "llama-3.3-70b-versatile", 
      temperature: 1,
      maxRetries: 2,
      apiKey: key,
    });

    // ✅ General AI Assistant prompt
    const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a smart, friendly, and conversational voice assistant. 
    Your responses should be natural, clear, and concise — as if you're speaking to someone directly.
    You should keep the tone helpful and human-like, avoiding robotic or overly formal phrasing.
    Always aim to understand what the user *means*, not just what they *say*.
    If the user gives an incomplete or vague input, ask clarifying questions or try to help based on best assumptions.
    Avoid saying you're an AI unless explicitly asked. Just be a helpful assistant the user can talk to naturally.`,
  ],
  ["human", "{input}"],
]);


    const chain = prompt.pipe(llm);

    const result = await chain.invoke({
      input: body.input || "Hello!",
    });

    return NextResponse.json({ output: result.content });
  } catch (error) {
    console.error("Error in POST request:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
