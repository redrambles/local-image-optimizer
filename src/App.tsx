import "./App.css";
import {
  processImage,
  type ProcessImageResult,
} from "./image-processing/processImage";
import { calculateSizeChange } from "./image-processing/calculateSizeChange";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

type ProcessingState =
  | { status: "idle" }
  | { status: "processing" }
  | { status: "success"; result: ProcessImageResult; previewURL: string }
  | {
      status: "error";
      message: string;
    };

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: "idle",
  });

  const processedResult =
    processingState.status === "success" ? processingState.result : null;
  const processedPreviewURL =
    processingState.status === "success" ? processingState.previewURL : null;

  useEffect(() => {
    if (!previewURL) {
      return;
    }

    return () => {
      // Clean up the object URL when the component unmounts or when a new file is selected
      URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  useEffect(() => {
    if (!processedPreviewURL) return;

    return () => {
      URL.revokeObjectURL(processedPreviewURL);
    };
  }, [processedPreviewURL]);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    // e.target.files is an array-like object
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }
    // More important for when we support drag-and-drop
    if (!file.type.startsWith("image/")) {
      setSelectedFile(null);
      setPreviewURL(null);
      setProcessingState({
        status: "error",
        message: "Please choose an image file.",
      });

      return;
    }
    // We have an image, now let's create a preview and process it
    const objectURL = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewURL(objectURL);
    setProcessingState({ status: "processing" });

    try {
      const result = await processImage(file, {
        maxWidth: 1000,
        mimeType: "image/webp",
        quality: 0.82,
      });

      const resultURL = URL.createObjectURL(result.blob);

      setProcessingState({
        status: "success",
        result,
        previewURL: resultURL,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The image could not be processed.";

      setProcessingState({
        status: "error",
        message,
      });
    }
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
        onChange={handleFileChange}
        disabled={processingState.status === "processing"}
      />
      {processingState.status === "processing" && (
        <p role="status">Processing image…</p>
      )}

      {processingState.status === "error" && (
        <p role="alert">{processingState.message}</p>
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
      {previewURL && selectedFile && (
        <img
          src={previewURL}
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
