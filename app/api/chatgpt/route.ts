import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export const maxDuration = 30; // Extend timeout to 30 seconds for Hobby plan
export const dynamic = "force-dynamic";

// Models to try in order of preference (Gemini 2.5 family - current as of 2025)
const GEMINI_MODELS = [
    "gemini-2.5-flash", // Fast and efficient
    "gemini-2.5-flash-lite", // Even lighter version
    "gemini-2.5-pro", // More capable but slower
];

export async function POST(request: Request) {
    const startTime = Date.now();

    try {
        // 1. Validate environment variable
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            console.error(
                "❌ GEMINI_API_KEY is not set in environment variables"
            );
            return NextResponse.json(
                {
                    error: "AI service configuration error. Please contact support.",
                },
                { status: 500 }
            );
        }

        // 2. Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            console.error("❌ Failed to parse request body:", parseError);
            return NextResponse.json(
                { error: "Invalid request format" },
                { status: 400 }
            );
        }

        const { question } = body;

        if (
            !question ||
            typeof question !== "string" ||
            question.trim().length === 0
        ) {
            console.error("❌ Invalid question in request:", question);
            return NextResponse.json(
                {
                    error: "Question is required and must be a non-empty string",
                },
                { status: 400 }
            );
        }

        console.log(`📝 Processing question (${question.length} chars)`);

        // 3. Initialize Gemini API
        const genAI = new GoogleGenerativeAI(apiKey);

        // 4. Try models in order until one succeeds
        let lastError: any = null;

        for (const modelName of GEMINI_MODELS) {
            try {
                console.log(`🤖 Attempting with model: ${modelName}`);

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1500, // Reasonable limit for answers
                        topP: 0.9,
                        topK: 40,
                    },
                });

                // Create abort controller with timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

                try {
                    const prompt = `You are a helpful programming assistant. Provide a clear, concise, and accurate answer to the following question. Include code examples if relevant, and format your response in a well-structured manner.

Question: ${question}

Please provide a comprehensive answer that would help the person asking this question.`;

                    console.log(`⏳ Generating response with ${modelName}...`);
                    const result = await model.generateContent(prompt);
                    clearTimeout(timeoutId);

                    const response = result.response;
                    const text = response.text();

                    if (!text || text.trim().length === 0) {
                        throw new Error("Empty response from AI model");
                    }

                    const duration = Date.now() - startTime;
                    console.log(
                        `✅ Success with ${modelName} (${duration}ms, ${text.length} chars)`
                    );

                    return NextResponse.json({
                        reply: text.trim(),
                        model: modelName,
                        duration,
                    });
                } catch (generateError: any) {
                    clearTimeout(timeoutId);

                    if (generateError.name === "AbortError") {
                        console.warn(
                            `⏱️ Timeout with ${modelName}, trying next model...`
                        );
                        lastError = {
                            message: "Request timeout",
                            code: "TIMEOUT",
                        };
                        continue;
                    }

                    throw generateError;
                }
            } catch (modelError: any) {
                console.warn(
                    `⚠️ Model ${modelName} failed:`,
                    modelError.message
                );
                lastError = modelError;

                // If it's a 404, the model doesn't exist - try next one
                if (
                    modelError.status === 404 ||
                    modelError.message?.includes("404")
                ) {
                    console.log(`   Model not available, trying next...`);
                    continue;
                }

                // If it's another error, try next model anyway
                continue;
            }
        }

        // 5. All models failed
        console.error("❌ All models failed. Last error:", lastError);

        const errorMessage = lastError?.message || "Unknown error";
        const errorCode = lastError?.code || lastError?.status || "UNKNOWN";

        // Return appropriate error based on the last error
        if (errorCode === "TIMEOUT") {
            return NextResponse.json(
                {
                    error: "The AI service is taking too long to respond. Please try with a shorter question or try again later.",
                },
                { status: 408 }
            );
        }

        if (errorCode === 404) {
            return NextResponse.json(
                {
                    error: "AI models are temporarily unavailable. Please try again later.",
                },
                { status: 503 }
            );
        }

        return NextResponse.json(
            {
                error: "AI service encountered an error. Please try again.",
                details:
                    process.env.NODE_ENV === "development"
                        ? errorMessage
                        : undefined,
            },
            { status: 500 }
        );
    } catch (error: any) {
        console.error("❌ Unexpected error in API route:", error);

        return NextResponse.json(
            {
                error: "An unexpected error occurred. Please try again.",
                details:
                    process.env.NODE_ENV === "development"
                        ? error.message
                        : undefined,
            },
            { status: 500 }
        );
    }
}
