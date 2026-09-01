import "./App.css";
import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  useEffect(() => {
    if (!previewURL) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const objectURL = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewURL(objectURL);

    console.log(file);
    console.log({ objectURL });

    console.table({
      name: file.name,
      type: file.type,
      sizeInBytes: file.size,
      sizeInMiB: (file.size / 1024 / 1024).toFixed(2),
      lastModified: new Date(file.lastModified).toLocaleString(),
    });
  };

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
    </main>
  );
}

export default App;
