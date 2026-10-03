import "./App.css";
import { useState, useRef } from "react";
import { calculateSizeChange } from "./image-processing/calculateSizeChange";
import type { ChangeEvent } from "react";
import { useImageProcessor } from "./hooks/useImageProcessor";
import { isValidMaxDimension } from "./image-processing/isValidMaxDimension";
import type { OutputMimeType } from "./image-processing/processImage";

function formatFileSize(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`;
}

function App() {
  const [maxDimensionInput, setMaxDimensionInput] = useState("1000");
  // derive from state
  const maxDimension = Number(maxDimensionInput);
  const isMaxDimensionValid = isValidMaxDimension(maxDimension);
  const {
    selectedFile,
    processingState,
    originalPreviewURL,
    processedPreviewURL,
    processedResult,
    selectFile,
    optimizeImage,
    reset,
  } = useImageProcessor();
  const [outputMimeType, setOutputMimeType] =
    useState<OutputMimeType>("image/webp");
  const [compressionQuality, setCompressionQuality] = useState<number>(82);
  const [outputFileName, setOutputFileName] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    // e.currentTarget.files is an array-like object
    const file = e.currentTarget.files?.[0];

    if (!file) {
      return;
    }
    const originalNameWithoutExtension = file.name.replace(/\.[^.]+$/, "");

    setOutputFileName(`${originalNameWithoutExtension}-optimized`);
    selectFile(file);
  };

  const handleOptimize = async () => {
    if (!isMaxDimensionValid) {
      return;
    }
    await optimizeImage({
      maxDimension,
      mimeType: outputMimeType,
      quality:
        outputMimeType === "image/png" ? undefined : compressionQuality / 100,
    });
  };

  const formattedMimeForDownload = processedResult?.blob.type.split("/")[1];
  const outputFileNameBase = outputFileName.trim() || "optimized-image";
  const downloadName = formattedMimeForDownload
    ? `${outputFileNameBase}.${formattedMimeForDownload}`
    : null;

  const sizeChange =
    selectedFile && processedResult
      ? calculateSizeChange(selectedFile.size, processedResult.blob.size)
      : null;

  const handleReset = () => {
    reset();
    setOutputFileName("");

    if (imageInputRef.current) {
      imageInputRef.current.value = ""; // Have to reach into the DOM node with a ref to clear the input and focus
      imageInputRef.current.focus();
    }
  };
  return (
    <main>
      <h1>Browser photo lab</h1>
      <p>Choose an image to inspect and process locally.</p>
      <div className="controls">
        <div className="control">
          <label htmlFor="image-file">Image file</label>
          <input
            id="image-file"
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={processingState.status === "processing"}
          />
        </div>
        <div className="control">
          <label htmlFor="max-dimension">Maximum width or height (px)</label>

          <input
            id="max-dimension"
            type="number"
            aria-invalid={!isMaxDimensionValid}
            aria-describedby={
              isMaxDimensionValid
                ? "max-dimension-help"
                : "max-dimension-help max-dimension-error"
            }
            min="1"
            step="1"
            value={maxDimensionInput}
            onChange={(event) => {
              const desiredDimension = event.currentTarget.value;
              setMaxDimensionInput(desiredDimension);
            }}
            disabled={processingState.status === "processing"}
          />
          <p id="max-dimension-help" className="control-help">
            Neither dimension will exceed this value. Smaller images will not be
            enlarged.
          </p>
          {!isMaxDimensionValid && (
            <p id="max-dimension-error" className="control-error">
              Enter a positive whole number.
            </p>
          )}
        </div>
        <div className="control">
          <label htmlFor="output-format">Output format</label>
          <select
            id="output-format"
            value={outputMimeType}
            onChange={(e) =>
              setOutputMimeType(e.currentTarget.value as OutputMimeType)
            }
            disabled={processingState.status === "processing"}
          >
            <option value="image/webp">WebP</option>
            <option value="image/jpeg">JPEG</option>
            <option value="image/png">PNG</option>
          </select>
        </div>
        <div className="control">
          <label htmlFor="compression-quality">
            Compression quality {compressionQuality}%
          </label>
          <input
            id="compression-quality"
            type="range"
            step="1"
            value={compressionQuality}
            onChange={(e) =>
              setCompressionQuality(e.currentTarget.valueAsNumber)
            }
            disabled={
              processingState.status === "processing" ||
              outputMimeType === "image/png"
            }
            aria-describedby="compression-quality-help"
            min="1"
            max="100"
          />
          <p id="compression-quality-help" className="control-help">
            {outputMimeType === "image/png"
              ? "PNG uses lossless encoding, so this setting does not apply."
              : "Higher quality usually produces a larger file."}
          </p>
        </div>
        <div className="control">
          <label htmlFor="output-filename">Output filename</label>
          <input
            id="output-filename"
            aria-describedby="output-filename-help"
            value={outputFileName}
            onChange={(e) => setOutputFileName(e.currentTarget.value)}
            type="text"
            disabled={!selectedFile || processingState.status === "processing"}
          />
          <p id="output-filename-help" className="control-help">
            The appropriate file extension will be added automatically.
          </p>
        </div>
      </div>

      <div className="status-region" aria-live="polite">
        {processingState.status === "processing" && (
          <p role="status">
            {processedResult
              ? "Updating image… Showing the previous result."
              : "Processing image…"}
          </p>
        )}

        {processingState.status === "success" && (
          <p>Image optimized successfully.</p>
        )}

        {processingState.status === "error" && (
          <p role="alert">{processingState.message}</p>
        )}
      </div>

      <div className="action-buttons">
        {selectedFile && (
          <button
            type="button"
            id="optimize-button"
            onClick={handleOptimize}
            disabled={
              processingState.status === "processing" || !isMaxDimensionValid
            }
          >
            {processingState.status === "processing"
              ? "Optimizing..."
              : "Optimize image"}
          </button>
        )}

        {processingState.status !== "idle" && (
          <button
            type="button"
            id="reset-button"
            onClick={handleReset}
            disabled={processingState.status === "processing"}
          >
            Start over
          </button>
        )}
      </div>
      {selectedFile && processedResult && (
        <section
          className="comparison"
          aria-busy={processingState.status === "processing"}
        >
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
        <img src={originalPreviewURL} alt={`Preview of ${selectedFile.name}`} />
      )}

      {processedPreviewURL && selectedFile && downloadName && (
        <>
          <h2>Processed preview</h2>

          <img
            src={processedPreviewURL}
            alt={`Processed preview of ${selectedFile.name}`}
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
