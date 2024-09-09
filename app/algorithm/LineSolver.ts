import Pica from 'pica';

const pica = Pica();
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export class LineSolver {
    public async solveIterativelyWithLineScores(
allLineCoordinates: { [key: string]: Array<[number, number]>; }, baseImage: ImageData, maxIterations: number, height: number, width: number, nailsCoord: Array<[number, number]>, outputScalingFactor: number, stringWeight: number, canvas: HTMLCanvasElement, skip: number, setCount: any    ) {
        const doneNails: Set<string> = new Set();
        const nailSequence: number[] = [];
        const lastPins: number[] = [];
        let count = 0;
        let error = this.subtractImages(this.createImageData(height, width, 255), baseImage);
        const nailsCount = nailsCoord.length;
        let startNail = 0;
        nailSequence.push(startNail);
        let targetResized = this.createImageData(height * outputScalingFactor, width * outputScalingFactor, 255);
        let ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('2D context not available');
        }

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
            count++;
            nailSequence.push(bestNail);
            targetResized = this.drawLineUsingBreshenHamLineDrawingAlgo(targetResized, startPoint, endPoint);
            if (count % 10 === 0) {
                this.showImage(ctx, targetResized);
                await this.sleep(100)
            }
            console.log("count: ", count);
            setCount(count)
        }
        // this.downloadFinalImage(width, outputScalingFactor, height, targetResized);
        return nailSequence
    }

    private downloadFinalImage(width: number, outputScalingFactor: number, height: number, targetResized: ImageData) {
        const offscreenCanvas = new OffscreenCanvas(width * outputScalingFactor, height * outputScalingFactor);
        offscreenCanvas.width = targetResized.width;
        offscreenCanvas.height = targetResized.height;
        const offScreenContext = offscreenCanvas.getContext('2d');
        if (!offScreenContext) {
            throw new Error('2D context not available');
        }

        offScreenContext.putImageData(targetResized, 0, 0);

        offscreenCanvas.convertToBlob().then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'image.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
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
            const lineScore = this.getLineScoreWithoutW(error, lineCoordinates);

            if (lineScore > maxLineScore) {
                bestNail = endNail;
                maxLineScore = lineScore;
            }
        }
        return bestNail;
    }

    private getLineScoreWithoutW(error: ImageData, param: Array<[number, number]>): number {
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
            imageData.data[i + 3] = 255; // Alpha channel
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
            result.data[i + 3] = 255; // Alpha channel
        }
        return result;
    }

    private drawLine(imageData: ImageData, startPoint: { x: number; y: number }, endPoint: { x: number; y: number }): ImageData {
        const offscreenCanvas = new OffscreenCanvas(imageData.width, imageData.height);
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('2D context not available');
        }

        ctx.globalCompositeOperation = 'source-over';
        ctx.putImageData(imageData, 0, 0);
        ctx.beginPath();
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(endPoint.x, endPoint.y);
        ctx.stroke();

        return ctx.getImageData(0, 0, imageData.width, imageData.height);
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



    private resizeImageData(imageData: ImageData, width: number, height: number, outputScalingFactor: number): ImageData {
        const offscreenCanvas = new OffscreenCanvas(width * outputScalingFactor, height * outputScalingFactor);
        const ctx = offscreenCanvas.getContext('2d');
        if (!ctx) {
            throw new Error('2D context not available');
        }
        ctx.putImageData(imageData, 0, 0);
        const resizedCanvas = new OffscreenCanvas(width, height);
        const resizedCtx = resizedCanvas.getContext('2d');
        if (!resizedCtx) {
            throw new Error('2D context not available');
        }
        resizedCtx.drawImage(offscreenCanvas, 0, 0, width, height);
        return resizedCtx.getImageData(0, 0, width, height);
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

