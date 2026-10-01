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
        message: "Please choose an image file.",
        previousOutput: null,
    });
    expect(createObjectURLMock).not.toHaveBeenCalled();

    unmount();
})

test("Optimizing a valid image file calls processImage and returns success", async () => {
    const file = new File(['image contents'], "mouse.jpg", {
        type: "image/jpeg"
    });

    const options: ProcessImageOptions = {
        maxDimension: 1000,
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
        output: {
            result: processedResult,
            previewURL: "blob:processed-preview"
        }
    })

    unmount();
})

test("keeps the previous output while reprocessing and after failure", async () => {

    const file = new File(["image contents"], "mouse.jpg", {
        type: "image/jpeg",
    })

    const options: ProcessImageOptions = {
        maxDimension: 1000,
        mimeType: "image/webp",
        quality: 0.82,
    }

    const firstProcessedResult: ProcessImageResult = {
        blob: new Blob(["first processed Image"], {
            type: "image/webp"
        }),
        originalDimensions: {
            width: 1200,
            height: 800,
        },
        processedDimensions: {
            width: 1000,
            height: 667,
        }
    };

    processImageMock.mockResolvedValueOnce(firstProcessedResult);

    createObjectURLMock
        .mockReturnValueOnce("blob:original-preview")
        .mockReturnValueOnce("blob:first-processed-preview");

    const { result, unmount } = renderHook(() => useImageProcessor());

    act(() => result.current.selectFile(file));

    await act(async () => {
        await result.current.optimizeImage(options)
    });

    expect(result.current.processingState.status).toBe("success");
    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe(
        "blob:first-processed-preview"
    );

    let rejectSecondProcessing!: (reason: unknown) => void;

    const secondProcessingPromise = new Promise<ProcessImageResult>((_resolve, reject) => {
        rejectSecondProcessing = reject;
    })

    processImageMock.mockReturnValueOnce(
        secondProcessingPromise,
    );

    let reprocessingPromise!: Promise<void>;

    // do not await so that we can test the 'pending' promise and 'processing' status
    act(() => {
        reprocessingPromise = result.current.optimizeImage(options)
    })

    expect(result.current.processingState).toEqual({
        status: "processing",
        previousOutput: {
            result: firstProcessedResult,
            previewURL: "blob:first-processed-preview"
        },
    });

    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe("blob:first-processed-preview")

    await act(async () => {
        rejectSecondProcessing(
            new Error("The image could not be updated.")
        );

        await reprocessingPromise;
    });

    expect(result.current.processingState).toEqual({
        status: "error",
        message: "The image could not be updated.",
        previousOutput: {
            result: firstProcessedResult,
            previewURL: "blob:first-processed-preview"
        }
    })

    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe("blob:first-processed-preview")
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith(
        "blob:first-processed-preview",
    );

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:first-processed-preview")
})


test("keeps the previous output while reprocessing and shows a new output after success", async () => {

    const file = new File(["image contents"], "mouse.jpg", {
        type: "image/jpeg",
    })

    const options: ProcessImageOptions = {
        maxDimension: 1000,
        mimeType: "image/webp",
        quality: 0.82,
    }

    const firstProcessedResult: ProcessImageResult = {
        blob: new Blob(["first processed Image"], {
            type: "image/webp"
        }),
        originalDimensions: {
            width: 1200,
            height: 800,
        },
        processedDimensions: {
            width: 1000,
            height: 667,
        }
    };

    processImageMock.mockResolvedValueOnce(firstProcessedResult);

    createObjectURLMock
        .mockReturnValueOnce("blob:original-preview")
        .mockReturnValueOnce("blob:first-processed-preview")
        .mockReturnValueOnce("blob:second-processed-preview");

    const { result, unmount } = renderHook(() => useImageProcessor());

    act(() => result.current.selectFile(file));

    await act(async () => {
        await result.current.optimizeImage(options)
    });

    expect(result.current.processingState.status).toBe("success");
    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe(
        "blob:first-processed-preview"
    );

    const secondProcessedResult: ProcessImageResult = {
        blob: new Blob(["second processed Image"], {
            type: "image/webp"
        }),
        originalDimensions: {
            width: 1200,
            height: 800,
        },
        processedDimensions: {
            width: 1000,
            height: 667,
        }
    };

    let resolveSecondProcessing!: (
        result: ProcessImageResult
    ) => void;

    const secondProcessingPromise = new Promise<ProcessImageResult>((resolve) => {
        resolveSecondProcessing = resolve;
    })

    processImageMock.mockReturnValueOnce(
        secondProcessingPromise,
    );

    let reprocessingPromise!: Promise<void>;

    // do not await so that we can test the 'pending' promise and 'processing' status
    act(() => {
        reprocessingPromise = result.current.optimizeImage(options)
    })

    expect(result.current.processingState).toEqual({
        status: "processing",
        previousOutput: {
            result: firstProcessedResult,
            previewURL: "blob:first-processed-preview"
        },
    });

    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe("blob:first-processed-preview")
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith(
        "blob:first-processed-preview",
    );

    await act(async () => {
        resolveSecondProcessing(secondProcessedResult);

        await reprocessingPromise;
    });

    expect(result.current.processingState).toEqual({
        status: "success",
        output: {
            result: secondProcessedResult,
            previewURL: "blob:second-processed-preview"
        }
    })

    expect(result.current.processedResult).toBe(secondProcessedResult);
    expect(result.current.processedPreviewURL).toBe("blob:second-processed-preview")
    expect(revokeObjectURLMock).toHaveBeenCalledWith(
        "blob:first-processed-preview",
    );
    expect(revokeObjectURLMock).not.toHaveBeenCalledWith(
        "blob:second-processed-preview",
    );

    unmount();

    expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:second-processed-preview")
})

test("resets image state and revokes its preview URLs", async () => {

    const file = new File(["image contents"], "mouse.jpg", {
        type: "image/jpeg",
    })

    const options: ProcessImageOptions = {
        maxDimension: 1000,
        mimeType: "image/webp",
        quality: 0.82,
    }

    const firstProcessedResult: ProcessImageResult = {
        blob: new Blob(["first processed Image"], {
            type: "image/webp"
        }),
        originalDimensions: {
            width: 1200,
            height: 800,
        },
        processedDimensions: {
            width: 1000,
            height: 667,
        }
    };

    processImageMock.mockResolvedValueOnce(firstProcessedResult);

    createObjectURLMock
        .mockReturnValueOnce("blob:original-preview")
        .mockReturnValueOnce("blob:first-processed-preview")

    const { result, unmount } = renderHook(() => useImageProcessor());

    act(() => result.current.selectFile(file));

    await act(async () => {
        await result.current.optimizeImage(options)
    });

    expect(result.current.processingState.status).toBe("success");
    expect(result.current.processedResult).toBe(firstProcessedResult);
    expect(result.current.processedPreviewURL).toBe(
        "blob:first-processed-preview"
    );

    act(() => {
        result.current.reset();
    });

    expect(result.current.selectedFile).toBe(null);
    expect(result.current.originalPreviewURL).toBe(null);
    expect(result.current.processedPreviewURL).toBe(null);
    expect(result.current.processedResult).toBe(null);
    expect(result.current.processingState).toEqual({
        status: "idle"
    });
    expect(revokeObjectURLMock).toHaveBeenCalledWith(
        "blob:original-preview",
    );
    expect(revokeObjectURLMock).toHaveBeenCalledWith(
        "blob:first-processed-preview",
    );
    unmount();
});
