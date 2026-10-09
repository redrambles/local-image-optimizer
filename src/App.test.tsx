import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";
import {
  processImage,
  type ProcessImageResult,
} from "./image-processing/processImage";

vi.mock("./image-processing/processImage", () => ({
  processImage: vi.fn(),
}));

const createObjectURLMock = vi.fn();
const revokeObjectURLMock = vi.fn();
const processImageMock = vi.mocked(processImage);

Object.defineProperty(URL, "createObjectURL", {
  configurable: true,
  value: createObjectURLMock,
});

Object.defineProperty(URL, "revokeObjectURL", {
  configurable: true,
  value: revokeObjectURLMock,
});

beforeEach(() => {
  createObjectURLMock.mockReset();
  createObjectURLMock.mockReturnValue("blob:original-preview");
  revokeObjectURLMock.mockReset();
  processImageMock.mockReset();
});

afterEach(() => {
  cleanup();
});

function getDropZone(): HTMLElement {
  const instructions = screen.getByText(
    "Drop an image here or choose a file.",
  );
  const dropZone = instructions.closest(".drop-zone");

  if (!(dropZone instanceof HTMLElement)) {
    throw new Error("The image drop zone could not be found.");
  }

  return dropZone;
}

test("starts over without resetting the processing preferences", async () => {
  const user = userEvent.setup();

  render(<App />);

  const fileInput = screen.getByLabelText<HTMLInputElement>("Image file");
  const maxDimensionInput = screen.getByLabelText(
    "Maximum width or height (px)",
  );
  const outputFormatSelect = screen.getByLabelText("Output format");
  const outputFileNameInput = screen.getByLabelText("Output filename");

  await user.clear(maxDimensionInput);
  await user.type(maxDimensionInput, "800");
  await user.selectOptions(outputFormatSelect, "image/jpeg");

  const file = new File(["image contents"], "mouse.jpg", {
    type: "image/jpeg",
  });

  await user.upload(fileInput, file);

  expect(fileInput.files).toHaveLength(1);
  expect(outputFileNameInput).toHaveValue("mouse-optimized");
  expect(
    screen.getByRole("img", {
      name: "Preview of mouse.jpg",
    }),
  ).toBeInTheDocument();

  const startOverButton = screen.getByRole("button", { name: "Start over" });

  await user.click(startOverButton);

  expect(fileInput.files).toHaveLength(0);
  expect(fileInput).toHaveFocus();
  expect(outputFileNameInput).toHaveValue("");
  expect(
    screen.queryByRole("img", { name: "Preview of mouse.jpg" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Start over" }),
  ).not.toBeInTheDocument();

  expect(maxDimensionInput).toHaveValue(800);
  expect(outputFormatSelect).toHaveValue("image/jpeg");
});

test("optimizes an image using the selected options and offers the result for download", async () => {
  const user = userEvent.setup();
  const processedResult: ProcessImageResult = {
    blob: new Blob(["processed image"], {
      type: "image/jpeg",
    }),
    originalDimensions: {
      width: 1200,
      height: 800,
    },
    processedDimensions: {
      width: 900,
      height: 600,
    },
  };

  processImageMock.mockResolvedValueOnce(processedResult);
  createObjectURLMock
    .mockReturnValueOnce("blob:original-preview")
    .mockReturnValueOnce("blob:processed-preview");

  render(<App />);

  const file = new File(["image contents"], "mouse.jpg", {
    type: "image/jpeg",
  });
  const fileInput = screen.getByLabelText<HTMLInputElement>("Image file");
  const maxDimensionInput = screen.getByLabelText(
    "Maximum width or height (px)",
  );
  const outputFormatSelect = screen.getByLabelText("Output format");
  const outputFilenameInput = screen.getByLabelText("Output filename");

  await user.upload(fileInput, file);
  await user.clear(maxDimensionInput);
  await user.type(maxDimensionInput, "900");
  await user.selectOptions(outputFormatSelect, "image/jpeg");
  await user.clear(outputFilenameInput);
  await user.type(outputFilenameInput, "holiday-card");
  await user.click(
    screen.getByRole("button", {
      name: "Optimize image",
    }),
  );

  expect(processImageMock).toHaveBeenCalledWith(file, {
    maxDimension: 900,
    mimeType: "image/jpeg",
    quality: 0.82,
  });
  expect(
    await screen.findByText("Image optimized successfully."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: "Image comparison",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", {
      name: "Processed preview of mouse.jpg",
    }),
  ).toHaveAttribute("src", "blob:processed-preview");
  expect(
    screen.getByRole("link", {
      name: "Download holiday-card.jpeg",
    }),
  ).toHaveAttribute("href", "blob:processed-preview");
  expect(
    screen.getByRole("link", {
      name: "Download holiday-card.jpeg",
    }),
  ).toHaveAttribute("download", "holiday-card.jpeg");
});

test("shows an accessible error when image processing fails", async () => {
  const user = userEvent.setup();

  processImageMock.mockRejectedValueOnce(
    new Error("The source image could not be decoded."),
  );

  render(<App />);

  const file = new File(["image contents"], "mouse.jpg", {
    type: "image/jpeg",
  });

  await user.upload(screen.getByLabelText("Image file"), file);
  await user.click(
    screen.getByRole("button", {
      name: "Optimize image",
    }),
  );

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The source image could not be decoded.",
  );
  expect(
    screen.queryByRole("img", {
      name: "Processed preview of mouse.jpg",
    }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", {
      name: /Download/,
    }),
  ).not.toBeInTheDocument();
  expect(createObjectURLMock).toHaveBeenCalledTimes(1);
});

test("highlights the drop zone while a file is dragged over it", () => {
  render(<App />);

  const dropZone = getDropZone();

  fireEvent.dragEnter(dropZone, {
    dataTransfer: {
      files: [],
      types: ["Files"],
    },
  });

  expect(dropZone).toHaveClass("drop-zone--active");

  fireEvent.dragLeave(dropZone, {
    dataTransfer: {
      files: [],
      types: ["Files"],
    },
  });

  expect(dropZone).not.toHaveClass("drop-zone--active");
});

test("replaces a picker-selected image with a dropped image", async () => {
  const user = userEvent.setup();

  render(<App />);

  const fileInput = screen.getByLabelText<HTMLInputElement>("Image file");
  const outputFileNameInput = screen.getByLabelText("Output filename");
  const pickerFile = new File(["first image"], "cat.jpg", {
    type: "image/jpeg",
  });
  const droppedFile = new File(["second image"], "mouse.png", {
    type: "image/png",
  });

  await user.upload(fileInput, pickerFile);

  expect(fileInput.files).toHaveLength(1);
  expect(outputFileNameInput).toHaveValue("cat-optimized");

  const dropZone = getDropZone();

  fireEvent.dragEnter(dropZone, {
    dataTransfer: {
      files: [droppedFile],
      types: ["Files"],
    },
  });

  expect(dropZone).toHaveClass("drop-zone--active");

  fireEvent.drop(dropZone, {
    dataTransfer: {
      files: [droppedFile],
      types: ["Files"],
    },
  });

  expect(dropZone).not.toHaveClass("drop-zone--active");
  expect(fileInput.files).toHaveLength(0);
  expect(outputFileNameInput).toHaveValue("mouse-optimized");
  expect(
    screen.getByRole("img", {
      name: "Preview of mouse.png",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("img", {
      name: "Preview of cat.jpg",
    }),
  ).not.toBeInTheDocument();
  expect(createObjectURLMock).toHaveBeenLastCalledWith(droppedFile);
});

test("shows an accessible error when a non-image file is dropped", () => {
  render(<App />);

  const fileInput = screen.getByLabelText("Image file");
  const invalidFile = new File(["plain text"], "notes.txt", {
    type: "text/plain",
  });

  fireEvent.drop(getDropZone(), {
    dataTransfer: {
      files: [invalidFile],
      types: ["Files"],
    },
  });

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Please choose an image file.",
  );
  expect(fileInput).toHaveAttribute("aria-invalid", "true");
  expect(fileInput).toHaveAccessibleDescription(
    "Drop an image here or choose a file. Please choose an image file.",
  );
  expect(getDropZone()).toHaveClass("drop-zone--error");
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(createObjectURLMock).not.toHaveBeenCalled();
});
