import fs from 'fs';
import path from 'path';

/**
 * Storage Service
 * Handles persistence for operational data (Time entries, Sites, Logs)
 * Uses local file system for MVP/Production readiness without external DB dependencies.
 */
export class StorageService {
  private baseDir: string;

  constructor(domain: string) {
    this.baseDir = path.join(process.cwd(), 'data', domain);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  save<T>(id: string, data: T): void {
    const filePath = path.join(this.baseDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  get<T>(id: string): T | null {
    const filePath = path.join(this.baseDir, `${id}.json`);
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  }

  list<T>(): T[] {
    if (!fs.existsSync(this.baseDir)) return [];
    return fs.readdirSync(this.baseDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const content = fs.readFileSync(path.join(this.baseDir, f), 'utf-8');
        return JSON.parse(content) as T;
      });
  }

  delete(id: string): void {
    const filePath = path.join(this.baseDir, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
