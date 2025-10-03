import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    try {
        // Check if required environment variable exists
        if (!process.env.GEMINI_API_KEY) {
            console.error("GEMINI_API_KEY is not set in environment variables");
            return NextResponse.json(
                {
                    error: "API configuration error. Please check environment variables.",
                },
                { status: 500 }
            );
        }

        // Validate request body
        let question;
        try {
            const body = await request.json();
            question = body.question;
        } catch (parseError) {
            console.error("Failed to parse request body:", parseError);
            return NextResponse.json(
                {
                    error: "Invalid request format",
                },
                { status: 400 }
            );
        }

        if (
            !question ||
            typeof question !== "string" ||
            question.trim().length === 0
        ) {
            return NextResponse.json(
                {
                    error: "Question is required and must be a non-empty string",
                },
                { status: 400 }
            );
        }

        console.log("Making request to Gemini API...");
        
        // Add timeout to the fetch request to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                signal: controller.signal,
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `You are a knowledgeable assistant that provides quality information. Tell me ${question}`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: 1000,
                        temperature: 0.7,
                    },
                }),
            }
        );
        
        clearTimeout(timeoutId);

        console.log("Gemini API response status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Gemini API error:", response.status, errorText);
            return NextResponse.json(
                {
                    error: `API request failed with status ${response.status}`,
                    details: errorText,
                },
                { status: 500 }
            );
        }

        const responseData = await response.json();
        console.log(
            "Gemini API response:",
            JSON.stringify(responseData, null, 2)
        );

        if (
            responseData.candidates &&
            responseData.candidates[0] &&
            responseData.candidates[0].content &&
            responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts[0]
        ) {
            const reply = responseData.candidates[0].content.parts[0].text;
            console.log("Successfully extracted reply from Gemini response");
            return NextResponse.json({ reply });
        } else {
            console.error("Unexpected API response structure:", responseData);
            return NextResponse.json(
                {
                    error: "Unexpected API response structure",
                    response: responseData,
                },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error in chatgpt API route:", error);
        
        // Handle specific timeout errors
        if (error.name === 'AbortError') {
            return NextResponse.json({ 
                error: "Request timeout - the AI service is taking too long to respond. Please try again with a shorter question." 
            }, { status: 408 });
        }
        
        return NextResponse.json({ 
            error: error.message || "Internal server error" 
        }, { status: 500 });
    }
};
