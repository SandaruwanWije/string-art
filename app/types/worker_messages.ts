export type CalculateLineMsgToWorker = {
    xc: number;
    yc: number;
    r: number;
    num_of_nails: number;
};

export type CalculateLineMsgFromWorker = {
    message: string;
    nailsCoordinates: [number, number][];
    allLineCoordinates:  { [key: string]: Array<[number, number]>; };
    count: number,
    type: string
};

export type LineSolverMsgToWorker = {
    allLineCoordinates:  { [key: string]: Array<[number, number]>; }; 
    imageData: ImageData;            
    max_line_count: number;          
    height: number;                  
    width: number;                   
    nailsCordinates: [number, number][];     
    output_scaling_factor: number;   
    string_weight: number;            
    skip: number;
};

export type LineSolverMsgFromWorker = {
    message: string;
    nailSeq: number[];
    imageData: ImageData;
    count: number;
    type: string;
};