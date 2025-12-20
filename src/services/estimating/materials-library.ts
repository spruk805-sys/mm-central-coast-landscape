import { StorageService } from '../storage';

export interface Material {
  id: string;
  name: string;
  category: 'fence' | 'pathway' | 'concrete' | 'rock' | 'sandstone' | 'other';
  unit: 'sqft' | 'linear_ft' | 'ton' | 'cubic_yard';
  unitCost: number;
}

export class MaterialsLibraryService {
  private storage = new StorageService('estimating/materials');
  private materials: Map<string, Material> = new Map();

  constructor() {
    this.seedMaterials();
    this.loadMaterials();
  }

  private loadMaterials() {
    const list = this.storage.list<Material>();
    list.forEach(m => this.materials.set(m.id, m));
  }

  private seedMaterials() {
    if (this.storage.list().length === 0) {
      const initialMaterials: Material[] = [
        // Fences
        { id: 'fence-wood', name: 'Cedar Privacy Fence', category: 'fence', unit: 'linear_ft', unitCost: 35 },
        { id: 'fence-vinyl', name: 'White Vinyl Fence', category: 'fence', unit: 'linear_ft', unitCost: 45 },
        { id: 'fence-iron', name: 'Wrought Iron Fence', category: 'fence', unit: 'linear_ft', unitCost: 65 },
        
        // Pathways
        { id: 'path-paver', name: 'Belgard Paver Pathway', category: 'pathway', unit: 'sqft', unitCost: 22 },
        { id: 'path-gravel', name: 'Decomposed Granite', category: 'pathway', unit: 'sqft', unitCost: 8 },
        
        // Concrete
        { id: 'conc-stamped', name: 'Stamped Concrete Patio', category: 'concrete', unit: 'sqft', unitCost: 18 },
        { id: 'conc-brushed', name: 'Brushed Finish Concrete', category: 'concrete', unit: 'sqft', unitCost: 12 },
        
        // Rock & Sandstone
        { id: 'rock-river', name: 'River Rock (Large)', category: 'rock', unit: 'ton', unitCost: 120 },
        { id: 'rock-lava', name: 'Red Lava Rock', category: 'rock', unit: 'ton', unitCost: 150 },
        { id: 'sand-santa-barbara', name: 'Santa Barbara Sandstone', category: 'sandstone', unit: 'ton', unitCost: 280 },
        { id: 'sand-flagstone', name: 'Arizona Flagstone', category: 'sandstone', unit: 'sqft', unitCost: 15 }
      ];
      initialMaterials.forEach(m => this.storage.save(m.id, m));
      console.log('[MaterialsLibrary] Seeded initial materials database');
    }
  }

  getMaterial(id: string): Material | undefined {
    return this.materials.get(id);
  }

  getAllMaterials(): Material[] {
    return Array.from(this.materials.values());
  }

  getMaterialsByCategory(category: Material['category']): Material[] {
    return this.getAllMaterials().filter(m => m.category === category);
  }

  calculateCost(materialId: string, quantity: number): number {
    const material = this.getMaterial(materialId);
    if (!material) return 0;
    return material.unitCost * quantity;
  }
}
