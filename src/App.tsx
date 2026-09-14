import "./App.css";
import { calculateSizeChange } from "./image-processing/calculateSizeChange";
import type { ChangeEvent } from "react";
import { useImageProcessor } from "./hooks/useImageProcessor";

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function App() {
  const {
    selectedFile,
    processingState,
    originalPreviewURL,
    processedPreviewURL,
    processedResult,
    selectFile,
    optimizeImage,
  } = useImageProcessor();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    // e.currentTarget.files is an array-like object
    const file = e.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    selectFile(file);
  };

  const handleOptimize = async () => {
    await optimizeImage({
      maxWidth: 1000,
      mimeType: "image/webp",
      quality: 0.82,
    });
  };

  const downloadName = selectedFile
    ? `${selectedFile.name.replace(/\.[^.]+$/, "")}-optimized.webp`
    : "optimized-image.webp";

  const sizeChange =
    selectedFile && processedResult
      ? calculateSizeChange(selectedFile.size, processedResult.blob.size)
      : null;

  return (
    <main>
      <h1>Browser photo lab</h1>
      <p>Choose an image to inspect and process locally.</p>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={processingState.status === "processing"}
      />
      {processingState.status === "processing" && (
        <p role="status">Processing image…</p>
      )}

      {processingState.status === "error" && (
        <p role="alert">{processingState.message}</p>
      )}

      {selectedFile && (
        <button
          type="button"
          onClick={handleOptimize}
          disabled={processingState.status === "processing"}
        >
          {processingState.status === "processing"
            ? "Optimizing..."
            : "Optimize image"}
        </button>
      )}

      {selectedFile && processedResult && (
        <section className="comparison">
          <h2 id="image-comparison-heading">Image comparison</h2>

          <div
            className="comparison-table-scroll"
            role="region"
            aria-labelledby="image-comparison-heading"
            tabIndex={0}
          >
            <table className="comparison-table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Original</th>
                  <th scope="col">Processed</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <th scope="row">Format</th>
                  <td>{selectedFile.type}</td>
                  <td>{processedResult.blob.type}</td>
                </tr>

                <tr>
                  <th scope="row">Dimensions</th>
                  <td>
                    {processedResult.originalDimensions.width} ×{" "}
                    {processedResult.originalDimensions.height}
                  </td>
                  <td>
                    {processedResult.processedDimensions.width} ×{" "}
                    {processedResult.processedDimensions.height}
                  </td>
                </tr>

                <tr>
                  <th scope="row">File size</th>
                  <td>{formatFileSize(selectedFile.size)}</td>
                  <td>{formatFileSize(processedResult.blob.size)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {sizeChange && (
            <p className={`size-change size-change--${sizeChange.kind}`}>
              {sizeChange.label}
            </p>
          )}
        </section>
      )}
      {originalPreviewURL && selectedFile && (
        <img
          src={originalPreviewURL}
          alt={`Preview of ${selectedFile.name}`}
          onLoad={(e) => {
            const image = e.currentTarget;
            console.table({
              naturalWidth: image.naturalWidth,
              naturalHeight: image.naturalHeight,
              displayedWidth: image.clientWidth,
              displayedHeight: image.clientHeight,
            });
          }}
        />
      )}

      {processedPreviewURL && selectedFile && (
        <>
          <h2>Processed WebP preview</h2>

          <img
            src={processedPreviewURL}
            alt={`Processed preview of ${selectedFile.name}`}
            onLoad={(event) => {
              const image = event.currentTarget;

              console.table({
                processedNaturalWidth: image.naturalWidth,
                processedNaturalHeight: image.naturalHeight,
                processedDisplayedWidth: image.clientWidth,
                processedDisplayedHeight: image.clientHeight,
              });
            }}
          />
          <a
            className="download-link"
            href={processedPreviewURL}
            download={downloadName}
          >
            Download {downloadName}
          </a>
        </>
      )}
    </main>
  );
}

export default App;
