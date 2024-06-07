import { useEffect, useRef } from "react";
import { runComputeDemo1 } from "./demos/computeDemo1";
import { runComputeDemo2 } from "./demos/computeDemo2";
import { runComputeDemo00 } from "./demos/computeDemo00";

const loadImageIntoCanvas = (src: string, canvas: HTMLCanvasElement) => {
  return new Promise((resolve, reject) => {
    const context = canvas.getContext("2d");

    if (!context) {
      reject();
      return;
    }

    const image = new Image();
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(undefined);
    };
    image.src = src;
  });
};

export const App = () => {
  const canvasSourceRef = useRef<HTMLCanvasElement>(null);
  const canvasTargetRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    canvasTargetRef.current!.getContext("2d");
    const canvas = canvasSourceRef.current!;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "red";
    context.fillRect(0, 0, canvas.width / 2, canvas.height / 2);
    // runComputeDemo2(canvasSourceRef.current!, canvasTargetRef.current!);
    runComputeDemo00();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasSourceRef.current!;
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        loadImageIntoCanvas(reader.result as string, canvas).then(() => {
          console.log("Image loaded", canvas.width, canvas.height);
          canvasTargetRef.current!.width = canvas.width;
          canvasTargetRef.current!.height = canvas.height;
          runComputeDemo2(
            canvasSourceRef.current!,
            canvasTargetRef.current!,
            canvas.width * canvas.height * 4 * 4
          );
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-row gap-4 p-4 w-96">
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => runComputeDemo1()}
      >
        Run compute demo 1
      </button>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() =>
          runComputeDemo2(canvasSourceRef.current!, canvasTargetRef.current!)
        }
      >
        Run compute demo 2
      </button>
      <div className="flex gap-2 items-center">
        <label htmlFor="search-image-upload">Load search image</label>
        <input
          id="search-image-upload"
          onChange={(e) => handleImageChange(e)}
          type="file"
        />
      </div>
      <canvas
        ref={canvasSourceRef}
        width={100}
        height={100}
        className="border border-gray-500"
      />
      <canvas
        ref={canvasTargetRef}
        width={100}
        height={100}
        className="border border-gray-500"
      />
    </div>
  );
};

