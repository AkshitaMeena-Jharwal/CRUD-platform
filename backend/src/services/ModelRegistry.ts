import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ModelDefinition } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class ModelRegistry {
  private modelsDir = path.join(__dirname, '../models');
  private registeredModels: Map<string, ModelDefinition> = new Map();

  constructor() {
    this.ensureModelsDir();
    this.loadExistingModels();
  }

  private async ensureModelsDir(): Promise<void> {
    try {
      await fs.access(this.modelsDir);
    } catch {
      await fs.mkdir(this.modelsDir, { recursive: true });
    }
  }

  private async loadExistingModels(): Promise<void> {
    try {
      const files = await fs.readdir(this.modelsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(this.modelsDir, file),
            'utf-8'
          );
          const model: ModelDefinition = JSON.parse(content);
          this.registeredModels.set(model.name, model);
        }
      }
      console.log(`Loaded ${this.registeredModels.size} existing models`);
    } catch (error) {
      console.error('Error loading existing models:', error);
    }
  }

  async registerModel(model: ModelDefinition): Promise<void> {
    const tableName = model.tableName || `${model.name.toLowerCase()}s`;
    const modelWithTable = { ...model, tableName };

    // Save to file
    const filePath = path.join(this.modelsDir, `${model.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(modelWithTable, null, 2));

    // Register in memory
    this.registeredModels.set(model.name, modelWithTable);
    
    console.log(`Model ${model.name} registered and saved to ${filePath}`);
  }

  getModel(name: string): ModelDefinition | undefined {
    return this.registeredModels.get(name);
  }

  getAllModels(): ModelDefinition[] {
    return Array.from(this.registeredModels.values());
  }

  async deleteModel(name: string): Promise<void> {
    const filePath = path.join(this.modelsDir, `${name}.json`);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Model file not found for deletion: ${name}`);
    }
    this.registeredModels.delete(name);
  }
}