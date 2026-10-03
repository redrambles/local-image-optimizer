import { useState, useEffect } from "react";
import {
    processImage,
    type ProcessImageOptions,
    type ProcessImageResult,
} from "../image-processing/processImage";

type ProcessedOutput = {
    result: ProcessImageResult;
    previewURL: string
}
type ProcessingState =

    | { status: "idle" }
    | { status: "ready" }
    | { status: "processing"; previousOutput: ProcessedOutput | null }
    | { status: "success"; output: ProcessedOutput }
    | {
        status: "error";
        message: string;
        previousOutput: ProcessedOutput | null;
    };

export function useImageProcessor() {

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [originalPreviewURL, setOriginalPreviewURL] = useState<string | null>(null);
    const [processingState, setProcessingState] = useState<ProcessingState>({
        status: "idle",
    });

    let processedOutput: ProcessedOutput | null = null;
    if (processingState.status === "success") {
        processedOutput = processingState.output
    } else if (processingState.status === "processing" || processingState.status === "error") {
        processedOutput = processingState.previousOutput
    }

    const processedResult = processedOutput?.result ?? null;
    const processedPreviewURL = processedOutput?.previewURL ?? null;

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

    function selectFile(file: File): void {
        // More important for when we support drag-and-drop
        if (!file.type.startsWith("image/")) {
            setSelectedFile(null);
            setOriginalPreviewURL(null);
            setProcessingState({
                status: "error",
                message: "Please choose an image file.",
                previousOutput: null // selecting an invalid file should not show previous output
            });

            return;
        }
        // We have an image, now let's create a preview
        const objectURL = URL.createObjectURL(file);

        setSelectedFile(file);
        setOriginalPreviewURL(objectURL);
        setProcessingState({ status: "ready" })
    }

    async function optimizeImage(options: ProcessImageOptions): Promise<void> {
        if (!selectedFile) {
            return
        }

        setProcessingState({ status: "processing", previousOutput: processedOutput });

        try {
            const result = await processImage(selectedFile, options);

            const resultURL = URL.createObjectURL(result.blob);

            setProcessingState({
                status: "success",
                output: {
                    result,
                    previewURL: resultURL
                }
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "The image could not be processed.";

            setProcessingState({
                status: "error",
                message,
                previousOutput: processedOutput
            });
        }
    }

    function reset(): void {
        setSelectedFile(null);
        setOriginalPreviewURL(null);
        setProcessingState({ status: "idle" });
    }

    return {
        selectedFile,
        processingState,
        originalPreviewURL,
        processedPreviewURL,
        processedResult,
        selectFile,
        optimizeImage,
        reset
    }
};
