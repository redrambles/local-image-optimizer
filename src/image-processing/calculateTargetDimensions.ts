export type ImageDimensions = {
  width: number;
  height: number;
};

export function calculateTargetDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
): ImageDimensions {
  const scale = Math.min(1, maxWidth / originalWidth);
  const width = Math.round(originalWidth * scale);
  const height = Math.round(originalHeight * scale);

  return {
    width,
    height,
  };
}
