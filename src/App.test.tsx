import { cleanup, render, screen } from "@testing-library/react";
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
