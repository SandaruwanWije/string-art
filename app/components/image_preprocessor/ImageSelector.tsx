"use client";

import { useEffect, useState } from "react";

interface Props {
  setSelectedImage: React.Dispatch<React.SetStateAction<HTMLImageElement | null>>;
  threddingInProgress: boolean
}

const ImageSelector: React.FC<Props> = (props: Props) => {
  const {
    setSelectedImage,
    threddingInProgress
  } = props
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile) {
      setFile(selectedFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          const img = new Image();
          img.src = reader.result as string;
          img.onload = () => {
            setSelectedImage(img);
          };
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  useEffect(() => {
    const image = new Image();
    image.src = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/base.jpeg`;
    image.onload = () => {
      setSelectedImage(image)
    };
  }, [])
  return (
    <div className="flex flex-col items-center w-full space-y-4 mt-5">
      <label className="flex flex-col items-center p-3 bg-blue-500 border border-blue-600 rounded-full cursor-pointer text-white hover:bg-blue-600 transition duration-300 w-full max-w-xs text-center">
        <span className="text-sm font-medium">
          {file ? file.name : 'Click to Upload(JPG, JPEG, PNG)'}
        </span>
        <input
          disabled={threddingInProgress}
          type="file"
          accept="image/jpeg, image/jpg, image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
      {file && (
        <button
          disabled={threddingInProgress}
          onClick={() => setFile(null)}
          className="px-6 py-2 bg-red-500 text-white font-semibold rounded-full shadow-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75 transition-all"
        >
          Remove File
        </button>
      )}
    </div>
  );
};

export default ImageSelector;
