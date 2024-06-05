import { useEffect } from "react";
import { runComputeDemo1 } from "./demos/computeDemo1";
import { runComputeDemo2 } from "./demos/computeDemo2";

export const App = () => {
  useEffect(() => {
    runComputeDemo1();
  }, []);
  return (
    <div className="flex flex-col gap-4 p-4 w-96">
      <button className="btn btn-primary" onClick={() => runComputeDemo1()}>
        Run compute demo 1
      </button>
      <button className="btn btn-primary" onClick={() => runComputeDemo2()}>
        Run compute demo 2
      </button>
    </div>
  );
};

