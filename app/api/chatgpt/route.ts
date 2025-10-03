import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
    const { question } = await request.json();

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
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
                }),
            }
        );

        const responseData = await response.json();

        if (
            responseData.candidates &&
            responseData.candidates[0] &&
            responseData.candidates[0].content &&
            responseData.candidates[0].content.parts &&
            responseData.candidates[0].content.parts[0]
        ) {
            const reply = responseData.candidates[0].content.parts[0].text;
            return NextResponse.json({ reply });
        } else {
            return NextResponse.json({
                error: "Unexpected API response structure",
                response: responseData,
            });
        }
        // const responseData = await response.json();
        // const reply = responseData.choices[0].message.content;

        // return NextResponse.json({ reply });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message });
    }
};
