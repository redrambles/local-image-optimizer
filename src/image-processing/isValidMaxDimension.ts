export function isValidMaxDimension(dimension: number): boolean {
    return Number.isInteger(dimension) && dimension > 0;
}