export function canvasToBlob(
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number,
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error("The canvas could not be encoded"));
                    return;
                }
                resolve(blob);
            },
            type,
            quality,
        );
    });
}