# Browser photo lab

Browser-first image optimization with React and TypeScript. Images are decoded, resized, and re-encoded locally; the processed result can be previewed and downloaded without uploading the original.

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
- [ ] Add controls for maximum dimension, output format, compression quality, and output filename.
- [ ] Introduce an explicit Optimize action so selecting a file and processing it are separate steps.
- [ ] Complete the idle, ready, processing, success, error, reset, and reprocess experiences.
- [ ] Add focused tests for the processing lifecycle and user-facing workflow.
- [ ] Remove learning-only console output.
- [ ] Complete an accessibility, narrow-screen, documentation, and production-build review.

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

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
