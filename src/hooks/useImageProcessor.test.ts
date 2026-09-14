// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { useImageProcessor } from "./useImageProcessor";
import {
    processImage,
    type ProcessImageOptions,
    type ProcessImageResult,
} from "../image-processing/processImage";

const createObjectURLMock = vi.fn(() => "blob:original-preview");
const revokeObjectURLMock = vi.fn();

vi.mock("../image-processing/processImage", () => ({
    processImage: vi.fn(),
}));

const processImageMock = vi.mocked(processImage);

Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: createObjectURLMock
})

Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: revokeObjectURLMock
})

beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLMock.mockReturnValue(
        "blob:original-preview",
    );
})

test("selects a valid image and enters the ready state", () => {
    const file = new File(["image contents"], "mouse.jpg", {
        type: "image/jpeg",
    });

    const { result, unmount } = renderHook(() => useImageProcessor());

    act(() => {
        result.current.selectFile(file);
    });

    expect(result.current.selectedFile).toBe(file);
    expect(result.current.originalPreviewURL).toBe("blob:original-preview");
    expect(result.current.processingState).toEqual({
        status: "ready"
    });
    expect(createObjectURLMock).toHaveBeenCalledWith(file);

    unmount();
})

test("selecting a non-image file returns an error state", () => {
    const file = new File(["text file"], "ooops.txt", {
        type: "text/plain"
    });

    const { result, unmount } = renderHook(() => useImageProcessor());

    act(() => {
        result.current.selectFile(file);
    });

    expect(result.current.selectedFile).toBe(null)
    expect(result.current.originalPreviewURL).toBe(null);
    expect(result.current.processingState).toEqual({
        status: "error",
        message: "Please choose an image file."
    });
    expect(createObjectURLMock).not.toHaveBeenCalled();

    unmount();
})

test("Optimizing a valid image file calls processImage and returns success", async () => {
    const file = new File(['image contents'], "mouse.jpg", {
        type: "image/jpeg"
    });

    const options: ProcessImageOptions = {
        maxWidth: 1000,
        mimeType: "image/webp",
        quality: 0.82
    }

    const processedResult: ProcessImageResult = {
        blob: new Blob(["processed image"], {
            type: "image/webp"
        }),
        originalDimensions: {
            width: 1200,
            height: 800,
        },
        processedDimensions: {
            width: 1000,
            height: 667,
        },
    };

    processImageMock.mockResolvedValue(processedResult);

    createObjectURLMock
        .mockReturnValueOnce("blob:original-preview")
        .mockReturnValueOnce("blob:processed-preview");

    const { result, unmount } = renderHook(() => useImageProcessor());



    act(() => result.current.selectFile(file));

    await act(async () => {
        await result.current.optimizeImage(options)
    });

    expect(processImageMock).toHaveBeenCalledWith(file, options);
    expect(result.current.processedResult).toBe(processedResult);
    expect(result.current.processedPreviewURL).toBe("blob:processed-preview");
    expect(result.current.processingState).toEqual({
        status: 'success',
        result: processedResult,
        previewURL: "blob:processed-preview"
    })

    unmount();
})
