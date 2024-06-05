import { useEffect, useRef } from "react";
import { runComputeDemo1 } from "./demos/computeDemo1";
import { runComputeDemo2 } from "./demos/computeDemo2";

export const App = () => {
  const canvasSourceRef = useRef<HTMLCanvasElement>(null);
  const canvasTargetRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    canvasTargetRef.current!.getContext("2d");
    const canvas = canvasSourceRef.current!;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "red";
    context.fillRect(0, 0, canvas.width / 10, canvas.height / 10);

    runComputeDemo2(canvasSourceRef.current!, canvasTargetRef.current!);
    // const ctx = canvasTargetRef.current!.getContext("2d");
    // if (ctx) {
    //   const imgData = new ImageData(2, 2);
    //   imgData.data.set(
    //     new Uint8ClampedArray([
    //       255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255,
    //       255, 255,
    //     ])
    //   );
    //   ctx.putImageData(imgData, 0, 0);
    // }
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 w-96">
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

