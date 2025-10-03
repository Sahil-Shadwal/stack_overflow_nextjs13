import { NextResponse } from "next/server";

export const GET = async () => {
    const hasApiKey = !!process.env.GEMINI_API_KEY;
    const apiKeyLength = process.env.GEMINI_API_KEY?.length || 0;
    
    // Get all environment variables that might be related
    const envVars = Object.keys(process.env).filter(key => 
        key.includes("GEMINI") || 
        key.includes("API") || 
        key.includes("NEXT") ||
        key.includes("VERCEL")
    );
    
    return NextResponse.json({
        hasApiKey,
        apiKeyLength,
        // Don't log the actual key for security
        apiKeyPreview: process.env.GEMINI_API_KEY ? 
            `${process.env.GEMINI_API_KEY.substring(0, 8)}...` : 
            'undefined',
        environment: process.env.NODE_ENV,
        platform: process.env.VERCEL ? 'Vercel' : 'Local',
        timestamp: new Date().toISOString(),
        relevantEnvVars: envVars,
        // Check if we're in production
        isProduction: process.env.NODE_ENV === 'production',
        vercelEnv: process.env.VERCEL_ENV
    });
};
