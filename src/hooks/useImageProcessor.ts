import { useState, useEffect } from "react";
import {
    processImage,
    type ProcessImageResult,
} from "../image-processing/processImage";

type ProcessingState =
    | { status: "idle" }
    | { status: "processing" }
    | { status: "success"; result: ProcessImageResult; previewURL: string }
    | {
        status: "error";
        message: string;
    };

export function useImageProcessor() {

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [originalPreviewURL, setOriginalPreviewURL] = useState<string | null>(null);
    const [processingState, setProcessingState] = useState<ProcessingState>({
        status: "idle",
    });
    const processedResult =
        processingState.status === "success" ? processingState.result : null;
    const processedPreviewURL =
        processingState.status === "success" ? processingState.previewURL : null;

    useEffect(() => {
        if (!originalPreviewURL) {
            return;
        }

        return () => {
            // Clean up the object URL when the component unmounts or when a new file is selected
            URL.revokeObjectURL(originalPreviewURL);
        };
    }, [originalPreviewURL]);

    useEffect(() => {
        if (!processedPreviewURL) return;

        return () => {
            URL.revokeObjectURL(processedPreviewURL);
        };
    }, [processedPreviewURL]);

    async function processFile(file: File): Promise<void> {

        // More important for when we support drag-and-drop
        if (!file.type.startsWith("image/")) {
            setSelectedFile(null);
            setOriginalPreviewURL(null);
            setProcessingState({
                status: "error",
                message: "Please choose an image file.",
            });

            return;
        }
        // We have an image, now let's create a preview and process it
        const objectURL = URL.createObjectURL(file);

        setSelectedFile(file);
        setOriginalPreviewURL(objectURL);
        setProcessingState({ status: "processing" });

        try {
            const result = await processImage(file, {
                maxWidth: 1000,
                mimeType: "image/webp",
                quality: 0.82,
            });

            const resultURL = URL.createObjectURL(result.blob);

            setProcessingState({
                status: "success",
                result,
                previewURL: resultURL,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "The image could not be processed.";

            setProcessingState({
                status: "error",
                message,
            });
        }
    }

    return {
        selectedFile,
        processingState,
        originalPreviewURL,
        processedPreviewURL,
        processedResult,
        processFile,
    }
};