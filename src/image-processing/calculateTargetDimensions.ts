export type ImageDimensions = {
  width: number;
  height: number;
};

export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxDimension: number,
): ImageDimensions {
  const maxOriginalDimension = Math.max(originalWidth, originalHeight);
  const scale = Math.min(1, maxDimension / maxOriginalDimension);
  const width = Math.round(originalWidth * scale);
  const height = Math.round(originalHeight * scale);

  return {
    width,
    height,
  };
}
