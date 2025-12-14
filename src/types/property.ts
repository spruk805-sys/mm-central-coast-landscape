
export interface FeatureLocation {
  type: 'tree' | 'bush' | 'pool' | 'shed' | 'fence' | 'roof' | 'lawn' | 'path';
  x: number; // 0-100 percentage from left
  y: number; // 0-100 percentage from top
  w?: number; // width %
  h?: number; // height %
}

export interface PropertyAnalysis {
  lawnSqft: number;
  treeCount: number;
  bushCount: number;
  hasPool: boolean;
  hasFence: boolean;
  fenceLength: number;
  pathwaySqft: number;
  gardenBeds: number;
  drivewayPresent: boolean;
  confidence: number;
  notes: string[];
  locations?: FeatureLocation[]; // Legacy single-image format
  locationsByImage?: {
    image1?: FeatureLocation[];
    image2?: FeatureLocation[];
    image3?: FeatureLocation[];
  };
}
