import "./App.css";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [processedPreviewURL, setProcessedPreviewURL] = useState<string | null>(
    null,
  );

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

    const objectURL = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewURL(objectURL);
    setProcessedPreviewURL(null);

    const bitmap = await createImageBitmap(file);
    const maxWidth = 1000;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const targetWidth = Math.round(bitmap.width * scale);
    const targetHeight = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    // Need to give the canvas workspace the correct dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");

    if (!context) {
      bitmap.close();
      return;
    }

    // tell the browser how to draw the image on the canvase workspace
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    canvas.toBlob(
      (processedBlob) => {
        if (!processedBlob) {
          console.log("The Canvas could not be encoded.");
          return;
        }

        setProcessedPreviewURL(URL.createObjectURL(processedBlob));

        console.log({ processedBlob });

        console.table({
          type: processedBlob.type,
          sizeInBytes: processedBlob.size,
          sizeInMiB: (processedBlob.size / (1024 * 1024)).toFixed(2),
        });
      },
      "image/webp",
      0.82,
    );
  };

  const downloadName = selectedFile
    ? `${selectedFile.name.replace(/\.[^.]+$/, "")}-optimized.webp`
    : "optimized-image.webp";

  return (
    <main>
      <h1>Browser photo lab</h1>
      <p>Choose an image to inspect and process locally.</p>
      <input type="file" accept="image/*" onChange={handleFileChange} />
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
