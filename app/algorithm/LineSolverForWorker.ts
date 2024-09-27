import Pica from 'pica';
import { NailsCoordinatesCalculator } from './NailsCoordinatesCalculator';
import { Dispatch, SetStateAction } from 'react';

const pica = Pica();

export class LineSolver {
    public async solveIterativelyWithLineScores(
        allLineCoordinates: { [key: string]: Array<[number, number]>; },
        baseImage: ImageData,
        maxIterations: number,
        height: number,
        width: number,
        nailsCoord: Array<[number, number]>,
        outputScalingFactor: number,
        stringWeight: number,
        skip: number,
        onProgress?: (progress: any) => void
    ) {
        const doneNails: Set<string> = new Set();
        const nailSequence: number[] = [];
        const lastPins: number[] = [];
        let count = 0;
        let error = this.subtractImages(this.createImageData(height, width, 255), baseImage);
        const nailsCount = nailsCoord.length;
        let startNail = 0;
        nailSequence.push(startNail);
        let target = this.createImageData(height * outputScalingFactor, width * outputScalingFactor, 255);

        while (count <= maxIterations) {
            let bestNail = this.getBestNail(skip, nailsCount, startNail, lastPins, doneNails, allLineCoordinates, error);

            const lineMask = this.createImageData(height, width, 0);
            const lineCoordinates = allLineCoordinates[`${startNail}_${bestNail}`];
            for (const coord of lineCoordinates) {
                this.setPixelValue(lineMask, coord[0], coord[1], stringWeight);
            }

            error = this.subtractImages(error, lineMask);

            doneNails.add(`${startNail}_${bestNail}`);
            doneNails.add(`${bestNail}_${startNail}`);

            const startPoint = {
                x: nailsCoord[startNail][0] * outputScalingFactor,
                y: nailsCoord[startNail][1] * outputScalingFactor,
            };
            const endPoint = {
                x: nailsCoord[bestNail][0] * outputScalingFactor,
                y: nailsCoord[bestNail][1] * outputScalingFactor,
            };
            startNail = bestNail;
            lastPins.push(bestNail);
            if (lastPins.length > 30) {
                lastPins.shift();
            }
            nailSequence.push(bestNail);
            target = this.drawLineUsingBreshenHamLineDrawingAlgo(target, startPoint, endPoint);
            if (count % 10 === 0) {
                if (onProgress) {
                    onProgress({
                        image: target,
                        count: count
                    });
                }
            }
            count++;
        }
        return nailSequence
    }

    private getBestNail(skip: number, nailsCount: number, startNail: number, lastPins: number[], doneNails: Set<string>, allLineCoordinates: { [key: string]: [number, number][]; }, error: ImageData) {
        let maxLineScore = -1;
        let bestNail = -1;

        for (let offset = skip; offset < nailsCount - skip; offset++) {
            const endNail = (startNail + offset) % nailsCount;
            const combination = `${startNail}_${endNail}`;
            if (lastPins.includes(endNail) || doneNails.has(combination)) {
                continue;
            }

            const lineCoordinates = allLineCoordinates[combination];
            const lineScore = this.getLineScore(error, lineCoordinates);

            if (lineScore > maxLineScore) {
                bestNail = endNail;
                maxLineScore = lineScore;
            }
        }
        return bestNail;
    }

    private getLineScore(error: ImageData, param: Array<[number, number]>): number {
        const scores: number[] = [];
        for (const coord of param) {
            scores.push(this.getPixelValue(error, coord[0], coord[1]));
        }
        return scores.reduce((a, b) => a + b, 0) / param.length;
    }

    private createImageData(width: number, height: number, fillValue: number): ImageData {
        const imageData = new ImageData(width, height);
        for (let i = 0; i < imageData.data.length; i += 4) {
            imageData.data[i] = fillValue;
            imageData.data[i + 1] = fillValue;
            imageData.data[i + 2] = fillValue;
            imageData.data[i + 3] = 255;
        }
        return imageData;
    }
    private getPixelValue(imageData: ImageData, x: number, y: number): number {
        const index = (y * imageData.width + x) * 4;
        return imageData.data[index];
    }

    private setPixelValue(imageData: ImageData, x: number, y: number, value: number): void {
        const index = (y * imageData.width + x) * 4;
        imageData.data[index] = value;
        imageData.data[index + 1] = value;
        imageData.data[index + 2] = value;
    }

    private subtractImages(imageData1: ImageData, imageData2: ImageData): ImageData {
        const result = new ImageData(imageData1.width, imageData1.height);
        for (let i = 0; i < result.data.length; i += 4) {
            result.data[i] = imageData1.data[i] - imageData2.data[i];
            result.data[i + 1] = imageData1.data[i + 1] - imageData2.data[i + 1];
            result.data[i + 2] = imageData1.data[i + 2] - imageData2.data[i + 2];
            result.data[i + 3] = 255;
        }
        return result;
    }

    private drawLineUsingBreshenHamLineDrawingAlgo(imageData: ImageData, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): ImageData {
        const { width, height, data } = imageData;

        const dx = Math.abs(endPoint.x - startPoint.x);
        const dy = Math.abs(endPoint.y - startPoint.y);
        const sx = startPoint.x < endPoint.x ? 1 : -1;
        const sy = startPoint.y < endPoint.y ? 1 : -1;
        let err = dx - dy;

        let x = startPoint.x;
        let y = startPoint.y;

        while (true) {
            if (x >= 0 && x < width && y >= 0 && y < height) {
                const index = (y * width + x) * 4;
                data[index] = 20;     // R
                data[index + 1] = 20; // G
                data[index + 2] = 20; // B
                data[index + 3] = 255; // A
            }

            if (x === endPoint.x && y === endPoint.y) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }

        return imageData;
    }

    private showImage(outputContext: CanvasRenderingContext2D, imageData: ImageData): void {
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

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

