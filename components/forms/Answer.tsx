"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "../ui/form";
import { useForm } from "react-hook-form";
import { AnswerSchema } from "@/lib/validations";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import Image from "next/image";
import { createAnswer } from "@/lib/actions/answer.action";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamically import the client-only editor component to avoid SSR issues
const ClientEditor = dynamic(() => import("./ClientEditor"), {
    ssr: false,
    loading: () => (
        <div className="h-[350px] animate-pulse rounded-md bg-gray-100" />
    ),
});

interface Props {
    question: string;
    questionId: string;
    authorId: string;
}

const Answer = ({ question, questionId, authorId }: Props) => {
    const pathname = usePathname();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmittingAI, setSetIsSubmittingAI] = useState(false);
    const editorRef = useRef(null);

    const form = useForm<z.infer<typeof AnswerSchema>>({
        resolver: zodResolver(AnswerSchema),
        defaultValues: {
            answer: "",
        },
    });

    const handleCreateAnswer = async (values: z.infer<typeof AnswerSchema>) => {
        setIsSubmitting(true);

        try {
            await createAnswer({
                content: values.answer,
                author: JSON.parse(authorId),
                question: JSON.parse(questionId),
                path: pathname,
            });

            // Reset form first
            form.reset();

            // Clear editor content
            if (editorRef.current) {
                const editor = editorRef.current as any;
                editor.setContent("");
            }

            // Show success message (optional)
            console.log("Answer submitted successfully!");
        } catch (error) {
            console.error("Error submitting answer:", error);
            // You could add a toast notification here for better UX
        } finally {
            setIsSubmitting(false);
        }
    };

    const generateAIAnswer = async () => {
        if (!authorId) return;

        setSetIsSubmittingAI(true);

        try {
            console.log("Generating AI answer for question:", question);

            const response = await fetch("/api/chatgpt", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ question }),
            });

            console.log("API response status:", response.status);

            const responseData = await response.json();
            console.log("API response data:", responseData);

            if (!response.ok) {
                console.error("API Error:", responseData);

                // Show more specific error messages based on the response
                let errorMessage =
                    "Sorry, unable to generate AI answer. Please try again.";

                if (
                    response.status === 500 &&
                    responseData.error?.includes("environment variables")
                ) {
                    errorMessage =
                        "AI service is temporarily unavailable. Please try again later.";
                } else if (response.status === 408) {
                    errorMessage = 
                        "The AI is taking too long to respond. Please try again with a shorter question.";
                } else if (response.status === 400) {
                    errorMessage =
                        "Invalid request. Please refresh the page and try again.";
                } else if (responseData.error) {
                    errorMessage = `Error: ${responseData.error}`;
                }

                alert(errorMessage);
                return;
            }

            if (responseData.reply) {
                // Convert plain text to HTML format, preserving line breaks and formatting
                const formattedAnswer = responseData.reply
                    .replace(/\n/g, "<br />")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold text
                    .replace(/\*(.*?)\*/g, "<em>$1</em>"); // Italic text

                // Update both editor and form state
                if (editorRef.current) {
                    const editor = editorRef.current as any;
                    editor.setContent(formattedAnswer);
                }

                // Also update the form field value
                form.setValue("answer", formattedAnswer);

                console.log("AI answer inserted into editor successfully");
            } else {
                console.error("No reply received in response:", responseData);
                alert("Sorry, unable to generate AI answer. Please try again.");
            }
        } catch (error) {
            console.error("AI Answer Generation Error:", error);
            alert(
                "Sorry, there was a network error generating the AI answer. Please check your connection and try again."
            );
        } finally {
            setSetIsSubmittingAI(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
                <h4 className="paragraph-semibold text-dark400_light800">
                    Write your answer here
                </h4>

                <Button
                    className="btn light-border-2 gap-1.5 rounded-md px-4 py-2.5 text-primary-500 shadow-none dark:text-primary-500"
                    onClick={generateAIAnswer}
                    disabled={isSubmittingAI}
                >
                    {isSubmittingAI ? (
                        <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-b-2 border-primary-500"></div>
                            Generating...
                        </>
                    ) : (
                        <>
                            <Image
                                src="/assets/icons/stars.svg"
                                alt="star"
                                width={12}
                                height={12}
                                className="object-contain"
                            />
                            Generate AI Answer
                        </>
                    )}
                </Button>
            </div>

            <Form {...form}>
                <form
                    className="mt-6 flex w-full flex-col gap-10"
                    onSubmit={form.handleSubmit(handleCreateAnswer)}
                >
                    <FormField
                        control={form.control}
                        name="answer"
                        render={({ field }) => (
                            <FormItem className="flex w-full flex-col gap-3">
                                <FormControl className="mt-3.5">
                                    <ClientEditor
                                        apiKey={
                                            process.env
                                                .NEXT_PUBLIC_TINY_EDITOR_API_KEY
                                        }
                                        onInit={(evt: any, editor: any) => {
                                            editorRef.current = editor;
                                        }}
                                        onBlur={field.onBlur}
                                        onEditorChange={(content: string) =>
                                            field.onChange(content)
                                        }
                                    />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            className="primary-gradient w-fit text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default Answer;
