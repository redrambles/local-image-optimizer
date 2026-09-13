export type SizeChange = {
    kind: "smaller" | "larger" | "same";
    percentage: number;
    label: string;
};

export function calculateSizeChange(
    originalSize: number,
    processedSize: number,
): SizeChange {
    const reduction = (1 - processedSize / originalSize) * 100;

    if (reduction > 0) {
        // made it smaller
        return {
            kind: "smaller",
            percentage: reduction,
            label: `${reduction.toFixed(1)}% smaller`,
        };
    }

    if (reduction < 0) {
        // made it larger
        const increase = Math.abs(reduction);
        return {
            kind: "larger",
            percentage: increase,
            label: `${increase.toFixed(1)}% larger`,
        };
    }

    // no change in size
    return {
        kind: "same",
        percentage: 0,
        label: "Same size",
    };
}