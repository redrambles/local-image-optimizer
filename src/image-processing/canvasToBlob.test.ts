import { expect, test } from "vitest";
import { canvasToBlob } from "./canvasToBlob";

test("resolves with the Blob produced by the canvas", async () => {
    const expectedBlob = new Blob(
        ["fake image data"],
        { type: "image/webp" },
    );

    const canvas = {
        toBlob(callback: BlobCallback) {
            callback(expectedBlob);
        }
    } as unknown as HTMLCanvasElement;

    const result = await canvasToBlob(canvas, "image/webp", 0.82);

    expect(result).toBe(expectedBlob)
});

test("rejects when the canvas cannot produce a Blob", async () => {
    const canvas = {
        toBlob(callback: BlobCallback) {
            callback(null)
        },
    } as unknown as HTMLCanvasElement;

    // Cannot await result - rejects happens immediately so we need to return the promise
    // and await the result of the expect call
    const result = canvasToBlob(canvas, "image/webp", 0.82);
    await expect(result).rejects.toThrow("The canvas could not be encoded");

    // or could write it like this:
    // await expect(canvasToBlob(canvas, "image/webp", 0.82)).rejects.toThrow("The canvas could not be encoded");
})