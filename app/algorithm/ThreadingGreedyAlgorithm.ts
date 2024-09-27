import Pica from 'pica';
import { Dispatch, SetStateAction } from "react";
import { CalculateLineMsgFromWorker, CalculateLineMsgToWorker, LineSolverMsgFromWorker, LineSolverMsgToWorker } from "../types/worker_messages";

const pica = Pica();

export class ThreadingGreedyAlgorithm {
    private xc: number = 250;
    private yc: number = 250;
    private r: number = 250;
    private height: number = 500;
    private width: number = 500;
    private output_scaling_factor: number = 7;
    private skip: number = 20;

    public async startThreading(
        canvasId: string,
        image: HTMLImageElement | null,
        setCount: React.Dispatch<React.SetStateAction<number>>, setNailSequence: React.Dispatch<React.SetStateAction<number[]>>,
        setViewedImage: Dispatch<SetStateAction<ImageData | null>>,
        num_of_nails: number,
        max_line_count: number,
        string_weight: number
    ) {
        let canvas: HTMLCanvasElement = document.getElementById(canvasId) as HTMLCanvasElement;
        let ctx: CanvasRenderingContext2D | null = null
        let imageData: ImageData;
        let nailSeq: number[] = [];
        let allLineCoordinates = {}
        if (canvas) {
            ctx = canvas.getContext('2d');
            if (ctx && image) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'destination-in';
                ctx.beginPath();
                ctx.arc(Math.floor(500 / 2 - 1), Math.floor(500 / 2 - 1), this.r, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();

                this.convertToGrayscale(imageData);

                ctx.putImageData(imageData, 0, 0);
                ctx.globalCompositeOperation = 'destination-in';
                ctx.beginPath();
                ctx.arc(Math.floor(500 / 2 - 1), Math.floor(500 / 2 - 1), this.r, 0, Math.PI * 2);
                ctx.closePath();
                ctx.fill();
                ctx.globalCompositeOperation = 'source-over';

                console.log("Started working with web workers")
                const lineCalculateWorker = new Worker(new URL("./WorkerForCalculateLines.ts", import.meta.url));
                const calculateLinMsgToWorker: CalculateLineMsgToWorker = { xc: this.xc, yc: this.yc, r: this.r, num_of_nails: num_of_nails }
                const lineSolverMsgToWorker: LineSolverMsgToWorker = {
                    max_line_count: max_line_count,
                    imageData: imageData,
                    height: this.height,
                    width: this.width,
                    output_scaling_factor: this.output_scaling_factor,
                    string_weight: string_weight,
                    skip: this.skip,
                    allLineCoordinates: {},
                    nailsCordinates: []
                }
                console.log("Started post message to lineCalculateWorker")
                setCount(1100)
                lineCalculateWorker.postMessage(calculateLinMsgToWorker);

                lineCalculateWorker.onmessage = function (e) {
                    const calculateLinMsgFromWorker: CalculateLineMsgFromWorker = e.data

                    setCount(calculateLinMsgFromWorker.count)
                    // console.log("Recieved lineCalculateWorker posted message", e)
                    // const calculateLinMsgFromWorker: CalculateLineMsgFromWorker = e.data
                    // if (ctx) {
                    //     drawNails(calculateLinMsgFromWorker.nailsCoordinates, ctx);
                    // }

                    // const lineSolverWorker = new Worker(new URL("./WorkerForLineSolver.ts", import.meta.url));

                    // lineSolverMsgToWorker.allLineCoordinates = calculateLinMsgFromWorker.allLineCoordinates
                    // lineSolverMsgToWorker.nailsCordinates = calculateLinMsgFromWorker.nailsCoordinates

                    // console.log("Started post message to lineSolverWorker")
                    // setCount(1000)
                    // // lineSolverWorker.postMessage(lineSolverMsgToWorker);
                    // lineSolverWorker.onmessage = function (e) {
                    //     console.log("Recieved lineSolverWorker posted message", e)
                    //     const lineSolverMsgFromWorker: LineSolverMsgFromWorker = e.data

                    //     if (ctx) {
                    //         showImage(ctx, lineSolverMsgFromWorker.imageData)
                    //     }
                    //     // setNailSequence(lineSolverMsgFromWorker.nailSeq)
                    //     // cleanup(ctx, canvas)
                    //     console.log(e)
                    // };
                    // console.log(e)
                };
            }
        }
        return { nailSeq, allLineCoordinates };
    }
    private convertToGrayscale(imageData: ImageData) {
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const gray = 0.21 * r + 0.72 * g + 0.07 * b;
            data[i] = gray;
            data[i + 1] = gray;
            data[i + 2] = gray;
        }
    }
}
function drawNails(nailsCordinates: [number, number][], ctx: CanvasRenderingContext2D) {
    nailsCordinates.forEach(([xx, yy]) => {
        for (let x = xx; x < xx + 2; x++) {
            for (let y = yy; y < yy + 2; y++) {
                if (ctx) {
                    const pixelData = ctx.createImageData(1, 1);
                    pixelData.data[0] = 255;
                    pixelData.data[1] = 0;
                    pixelData.data[2] = 0;
                    pixelData.data[3] = 255;
                    ctx.putImageData(pixelData, x, y);
                }
            }
        };
    });
}


function cleanup(ctx: CanvasRenderingContext2D | null, canvas: HTMLCanvasElement | null) {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    canvas = null;
    ctx = null;
}


function showImage(outputContext: CanvasRenderingContext2D, imageData: ImageData): void {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext("2d");

    if (ctx != null) {
        ctx.putImageData(imageData, 0, 0);

        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = 500;
        outputCanvas.height = 500;

        pica.resize(canvas, outputCanvas, {
            quality: 3
        }).then((result) => {
            if (outputContext != null) {
                outputContext.drawImage(outputCanvas, 0, 0);
            }
        }).catch((error) => {
            console.error("Error during resizing with Pica: ", error);
        }).finally(() => {
            canvas.remove();
            outputCanvas.remove();
        });;
    }
}