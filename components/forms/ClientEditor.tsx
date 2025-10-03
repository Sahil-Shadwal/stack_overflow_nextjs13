"use client";

import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "@/context/ThemeProvider";

interface ClientEditorProps {
    apiKey?: string;
    onInit?: (evt: any, editor: any) => void;
    onBlur?: () => void;
    onEditorChange?: (content: string) => void;
    initialValue?: string;
}

const ClientEditor = ({
    apiKey,
    onInit,
    onBlur,
    onEditorChange,
    initialValue = "",
}: ClientEditorProps) => {
    const { mode } = useTheme();

    return (
        <Editor
            apiKey={apiKey}
            initialValue={initialValue}
            onInit={onInit}
            onBlur={onBlur}
            onEditorChange={onEditorChange}
            init={{
                height: 350,
                menubar: false,
                plugins: [
                    "advlist",
                    "autolink",
                    "lists",
                    "link",
                    "image",
                    "charmap",
                    "preview",
                    "anchor",
                    "searchreplace",
                    "visualblocks",
                    "codesample",
                    "fullscreen",
                    "insertdatetime",
                    "media",
                    "table",
                ],
                toolbar:
                    "undo redo | " +
                    "codesample | bold italic forecolor | alignleft aligncenter |" +
                    "alignright alignjustify | bullist numlist",
                content_style: "body { font-family:Inter; font-size:16px }",
                skin: mode === "dark" ? "oxide-dark" : "oxide",
                content_css: mode === "dark" ? "dark" : "light",
            }}
        />
    );
};

export default ClientEditor;
