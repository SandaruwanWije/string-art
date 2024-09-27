import { LineSolverMsgToWorker } from "../types/worker_messages";
import { LineSolver } from "./LineSolverForWorker";

const ctx: Worker = self as any;

ctx.addEventListener("message", async (event) => {
  console.log("Recieved message to lineSolverWorker")
  const data: LineSolverMsgToWorker = event.data;

  const {
    allLineCoordinates,
    imageData,
    max_line_count,
    height,
    width,
    nailsCordinates,
    output_scaling_factor,
    string_weight,
    skip
  } = data;
    const lineSolver = new LineSolver();
    const count = 5000;
    const nailSeq = await lineSolver.solveIterativelyWithLineScores(
      allLineCoordinates,
      imageData,
      max_line_count,
      height,
      width,
      nailsCordinates,
      output_scaling_factor,
      string_weight,
      skip,
      (progress) => {
        ctx.postMessage({
          message: "Worker done work!",
          nailSeq: [],
          imageData: progress.image,
          count: progress.count
        });
      }
    );
    console.log("lineSolverWorker Job done posting result to main thread")
    ctx.postMessage({
      message: "Worker done work!",
      nailSeq: nailSeq,
      imageData: nailSeq
    });
});

export default null as any;

