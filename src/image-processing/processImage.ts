import { calculateTargetDimensions, type ImageDimensions } from "./calculateTargetDimensions";
import { canvasToBlob } from "./canvasToBlob";
import { isValidMaxDimension } from "./isValidMaxDimension";

export type OutputMimeType =
    | "image/webp"
    | "image/jpeg"
    | "image/png";

export type ProcessImageOptions = {
    maxDimension: number;
    mimeType: OutputMimeType;
    quality?: number;
}

export type ProcessImageResult = {
    blob: Blob;
    originalDimensions: ImageDimensions;
    processedDimensions: ImageDimensions;
}


export async function processImage(
    source: Blob,
    options: ProcessImageOptions
): Promise<ProcessImageResult> {


    if (!isValidMaxDimension(options.maxDimension)) {
        throw new Error("The maximum dimension must be a positive integer.")
    };


    const bitmap = await createImageBitmap(source);

    const originalDimensions: ImageDimensions = {
        width: bitmap.width,
        height: bitmap.height,
    };

    try {
        const processedDimensions = calculateTargetDimensions(
            bitmap.width,
            bitmap.height,
            options.maxDimension
        )

        const canvas = document.createElement("canvas");
        canvas.width = processedDimensions.width;
        canvas.height = processedDimensions.height;

        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error("A 2D canvas context could not be created.")
        }

        context.drawImage(bitmap, 0, 0, processedDimensions.width, processedDimensions.height);

        const blob = await canvasToBlob(canvas, options.mimeType, options.quality);

        return {
            blob,
            originalDimensions,
            processedDimensions
        };
    } finally {
        bitmap.close();
    }
}