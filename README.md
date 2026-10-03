# Browser photo lab

Browser-first image optimization with React and TypeScript. Images are decoded,
resized, and re-encoded locally; the processed result can be previewed and
downloaded without uploading the original.

## Features

- Process images entirely in the browser without uploading them.
- Limit the longest image dimension without enlarging smaller images.
- Encode WebP, JPEG, or PNG output.
- Adjust compression quality for lossy formats.
- Compare original and processed dimensions, formats, and file sizes.
- Preview, rename, and download the processed image.
- Preserve the previous result while reprocessing or recovering from an error.

## How it works

The selected `File` is decoded into an `ImageBitmap`. The app calculates target
dimensions, draws the bitmap onto an in-memory Canvas, and encodes the Canvas as
a new `Blob`. Object URLs provide local previews and downloads, and are revoked
when they are replaced, reset, or no longer needed.

```text
File -> ImageBitmap -> Canvas -> Blob -> object URL -> preview/download
```

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Quality checks

```bash
npm test -- --run
npm run typecheck
npm run lint
npm run build
```

The test suite covers image-processing utilities, the processing lifecycle hook,
object-URL cleanup, and the main user workflows.

## Privacy

Image decoding, resizing, encoding, previewing, and downloading all happen on
the user's device. Version 1 does not upload or persist selected images.

## Roadmap

The Version 1 goal is a complete standalone browser image optimizer. Uploads,
storage, authentication, and galleries belong in the separate Mouse and Bug's
Adventures project, which can later reuse the processing work developed here.

### Foundation completed

- [x] Select, inspect, preview, resize, encode, and download an image.
- [x] Keep the processing canvas out of the visible DOM.
- [x] Extract and test dimension calculation and Canvas-to-Blob conversion.
- [x] Extract a typed `processImage()` function with processing options and a structured result.
- [x] Show original-versus-processed dimensions, format, size, and percentage change.
- [x] Add processing and error states.

### Version 1.0

- [x] Extract the processing lifecycle, React state, and object-URL cleanup into a `useImageProcessor()` hook.
- [x] Add controls for maximum dimension, output format, compression quality, and output filename.
- [x] Introduce an explicit Optimize action so selecting a file and processing it are separate steps.
- [x] Complete the idle, ready, processing, success, error, reset, and reprocess experiences.
  - [x] Preserve the previous preview and comparison while reprocessing, with a visible updating state.
- [x] Add focused tests for the processing lifecycle and user-facing workflow.
- [x] Remove learning-only console output.
- [x] Complete an accessibility, narrow-screen, documentation, and production-build review.

### Follow-up releases

#### Version 1.1 — Drag and drop

- [ ] Accept images from an accessible drop zone.
- [ ] Route the file picker and drop zone through one shared image entry point.

#### Version 1.2 — Clipboard paste

- [ ] Accept pasted images from the clipboard.
- [ ] Route pasted files through the same validation and processing entry point.

#### Version 1.3 — Image edge cases

- [ ] Improve handling for transparency, very large images, corrupted images, and unusual formats.

#### Version 1.4 — Background processing experiment

- [ ] Explore Web Workers and `OffscreenCanvas` if large images cause noticeable UI stutters.

#### Version 1.5 — Responsive image variants

- [ ] Generate multiple image sizes suitable for responsive delivery with `srcset`.

Storybook is optional for this project. It is likely to provide more value first
in Mouse and Bug's Adventures, where there are reusable visual components and
more application states to develop in isolation.
