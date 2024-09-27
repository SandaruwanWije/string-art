"use client";

import { NailsCoordinatesCalculator } from '@/app/algorithm/NailsCoordinatesCalculator';
import { ControlType } from '@/app/types/enum/ControlType';
import Pica from 'pica';
import React, { useEffect, useRef, useState } from 'react';
import ManualViewingCanvas from './ManualViewCanvas';
import LeftStep from './LeftStep';
import RightStep from './RightStep';
import DrawFinalImage from './DrawFInalImage';

interface Props {
  nailSequence: number[];
  finalStringArt: ImageData | null
}

const pica = Pica();

const ManualViewing: React.FC<Props> = (props: Props) => {
  const { nailSequence, finalStringArt } = props;
  const [index, setIndex] = useState(0);
  const [target, setTarget] = useState<ImageData | null>(null);
  const [nailsCordinates, setNailsCordinates] = useState<[number, number][]>([]);
  const [constructedFinal, setConstructedFinal] = useState<ImageData | null>(null);
  const [isManualThreading, setIsManualThreading] = useState(false);

  useEffect(() => {
    setTarget(createImageData(800 * 7, 800 * 7, 255));
    const calculator = new NailsCoordinatesCalculator(800 * 7 / 2, 800 * 7 / 2, (800 * 7 / 2) - 1);
    setNailsCordinates(calculator.getNailsCoordinates(288));
  }, [])
  const createImageData = (width: number, height: number, fillValue: number): ImageData => {
    const imageData = new ImageData(width, height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i] = fillValue;
      imageData.data[i + 1] = fillValue;
      imageData.data[i + 2] = fillValue;
      imageData.data[i + 3] = 255;
    }
    return imageData;
  }
  const start = async () => {
    setIsManualThreading(true)
  };

  return (
    <div className="flex flex-col w-full h-full p-4 justify-center items-center bg-white">
      <div className="mb-4 text-lg font-semibold text-black">
        Current Index: {index} Current Nails: {nailSequence[index]} -{'>'} {nailSequence[index+1]}
      </div>
      <ManualViewingCanvas finalImage={constructedFinal} index={index}/>
      <div className="flex space-x-4 justify-center items-center bg-white">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-full"
          onClick={() => start()}
        >
          Start Manual Threading
        </button>
        <LeftStep />
        <RightStep nailSequence={nailSequence} setConstructedFinal={setConstructedFinal} target={target} setTarget={setTarget} nailsCordinates={nailsCordinates} isManualThreading={isManualThreading} index={index} setIndex={setIndex}/>
        <DrawFinalImage setConstructedFinal={setConstructedFinal} finalStringArt={finalStringArt} constructedFinal={constructedFinal} target={target}/>
      </div>
    </div>
  );
};

export default ManualViewing;