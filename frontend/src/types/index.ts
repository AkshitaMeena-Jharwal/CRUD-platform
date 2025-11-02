export interface ModelField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'text';
  required: boolean;
  default?: any;
  unique?: boolean;
  relation?: {
    model: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one';
  };
}

export interface RBACConfig {
  [role: string]: ('create' | 'read' | 'update' | 'delete' | 'all')[];
}

export interface ModelDefinition {
  name: string;
  tableName?: string;
  fields: ModelField[];
  ownerField?: string;
  rbac: RBACConfig;
}

export interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date;
}