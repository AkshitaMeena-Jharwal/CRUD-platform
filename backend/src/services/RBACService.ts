import { User } from '../types/index.js';
import { ModelRegistry } from './ModelRegistry.js';

export class RBACService {
  private modelRegistry: ModelRegistry;

  constructor() {
    this.modelRegistry = new ModelRegistry();
  }

  async checkPermission(user: User, modelName: string, action: 'create' | 'read' | 'update' | 'delete'): Promise<void> {
    const model = this.modelRegistry.getModel(modelName);
    
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    const permissions = model.rbac[user.role];
    
    if (!permissions) {
      throw new Error('Access denied: No permissions for this role');
    }

    if (permissions.includes('all')) {
      return;
    }

    if (!permissions.includes(action)) {
      throw new Error(`Access denied: ${action} permission required`);
    }
  }

  getUserPermissions(user: User, modelName: string): string[] {
    const model = this.modelRegistry.getModel(modelName);
    if (!model) return [];
    
    const permissions = model.rbac[user.role];
    if (permissions.includes('all')) {
      return ['create', 'read', 'update', 'delete'];
    }
    return permissions;
  }
}