import { useEffect } from "react";
import { runComputeDemo1 } from "./demos/computeDemo1";

export const App = () => {
  useEffect(() => {
    runComputeDemo1();
  }, []);
  return <div className="bg-blue-200">test</div>;
};

