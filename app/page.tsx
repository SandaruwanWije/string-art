"use client";

import React, { useState } from 'react';
import ImagePreProcessor from './components/image_preprocessor/ImagePreProcessor';
import ViewingThreads from './components/string_art_visualizer/ViewingThreads';
import ManualViewing from './components/guided_viewer/ManualViewing';

const Home: React.FC = () => {
  const [imgXPos, setImgXPos] = useState(0)
  const [imgYPos, setImgYPos] = useState(0)
  const [imgScale, setImgScale] = useState(1)
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [nailSequence, setNailSequence] = useState<number[]>([]);
  const [finalStringArt, setFinalStringArt] = useState<ImageData | null>(null)

  const [numOfNails, setNumOfNails] = useState(250);
  const [stringWeight, setStringWeight] = useState(20);
  const [maxLineCount, setMaxLineCount] = useState(4000);
  const [threddingInProgress, setThreddingInProgress] = useState(false);

  return (
    <div className='container'>
      {/* For larger screens, use flex-row. For smaller screens, flex-col. */}
      <div className='flex flex-col md:flex-row h-screen'>
        <div className='h-full md:h-[80%] md:basis-1/2 mt-10 p-5'>
          <ImagePreProcessor
            setImgXPos={setImgXPos}
            setImgYPos={setImgYPos}
            setImgScale={setImgScale}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            numOfNails={numOfNails}
            maxLineCount={maxLineCount}
            stringWeight={stringWeight}
            setNumOfNails={setNumOfNails}
            setStringWeight={setStringWeight}
            setMaxLineCount={setMaxLineCount}
            threddingInProgress={threddingInProgress}
          />
        </div>
        <div className='h-full md:h-[80%] md:basis-1/2 mt-10 p-5'>
          <ViewingThreads
            imgXPos={imgXPos}
            imgYPos={imgYPos}
            imgScale={imgScale}
            selectedImage={selectedImage}
            setNailSequence={setNailSequence}
            setFinalStringArt={setFinalStringArt}
            numOfNails={numOfNails}
            maxLineCount={maxLineCount}
            stringWeight={stringWeight}
            setThreddingInProgress={setThreddingInProgress}
            threddingInProgress={threddingInProgress}
          />
        </div>
      </div>

      <div className="flex flex-col h-screen m-4 content-center p-5">
        <div className="basis-full">
          <ManualViewing
            nailSequence={nailSequence}
            finalStringArt={finalStringArt}
            threddingInProgress={threddingInProgress}
            nailCount={numOfNails}
          />
        </div>
      </div>
    </div>
    
  );
};

export default Home;
