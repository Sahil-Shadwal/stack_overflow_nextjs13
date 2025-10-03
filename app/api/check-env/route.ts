import { NextResponse } from "next/server";

export const GET = async () => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY?.length || 0;

    return NextResponse.json({
        hasApiKey,
        apiKeyLength,
        // Don't log the actual key for security
        apiKeyPreview: process.env.GEMINI_API_KEY
            ? `${process.env.GEMINI_API_KEY.substring(0, 8)}...`
            : "undefined",
        allEnvVars: Object.keys(process.env).filter(
            (key) => key.includes("GEMINI") || key.includes("API")
        ),
    });
};
