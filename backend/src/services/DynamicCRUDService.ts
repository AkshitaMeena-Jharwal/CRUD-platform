import { PrismaClient } from '@prisma/client';
import { ModelDefinition, AuthRequest } from '../types/index.js';
import { RBACService } from './RBACService.js';

export class DynamicCRUDService {
  private prisma: PrismaClient;
  private rbacService: RBACService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.rbacService = new RBACService();
  }

  private buildWhereClause(model: ModelDefinition, req: AuthRequest, filters: any) {
    const where: any = { ...filters };
    
    // Apply ownership filter if user is not admin and ownerField exists
    if (req.user?.role !== 'Admin' && model.ownerField) {
      where[model.ownerField] = req.user?.id;
    }
    
    return where;
  }

  async createRecord(model: ModelDefinition, data: any, req: AuthRequest) {
    // Check permissions
    await this.rbacService.checkPermission(req.user!, model.name, 'create');

    // Add owner field if specified
    if (model.ownerField && req.user) {
      data[model.ownerField] = req.user.id;
    }

    const validatedData = this.validateData(model, data, true);
    
    // Use dynamic model access
    const modelClient = (this.prisma as any)[model.tableName!];
    if (!modelClient) {
      throw new Error(`Model ${model.tableName} not found in database`);
    }

    return await modelClient.create({
      data: validatedData
    });
  }

  async getRecords(model: ModelDefinition, req: AuthRequest, filters: any = {}) {
    await this.rbacService.checkPermission(req.user!, model.name, 'read');

    const where = this.buildWhereClause(model, req, filters);
    
    const modelClient = (this.prisma as any)[model.tableName!];
    return await modelClient.findMany({
      where,
      orderBy: { id: 'desc' }
    });
  }

  async getRecordById(model: ModelDefinition, id: string, req: AuthRequest) {
    await this.rbacService.checkPermission(req.user!, model.name, 'read');

    const where = this.buildWhereClause(model, req, { id });
    
    const modelClient = (this.prisma as any)[model.tableName!];
    const record = await modelClient.findUnique({
      where
    });

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  }

  async updateRecord(model: ModelDefinition, id: string, data: any, req: AuthRequest) {
    await this.rbacService.checkPermission(req.user!, model.name, 'update');

    // Check ownership if not admin
    if (req.user?.role !== 'Admin' && model.ownerField) {
      const existing = await this.getRecordById(model, id, req);
      if (existing[model.ownerField] !== req.user?.id) {
        throw new Error('Access denied: You can only update your own records');
      }
    }

    const where = this.buildWhereClause(model, req, { id });
    const validatedData = this.validateData(model, data, false);
    
    const modelClient = (this.prisma as any)[model.tableName!];
    return await modelClient.update({
      where,
      data: validatedData
    });
  }

  async deleteRecord(model: ModelDefinition, id: string, req: AuthRequest) {
    await this.rbacService.checkPermission(req.user!, model.name, 'delete');

    // Check ownership if not admin
    if (req.user?.role !== 'Admin' && model.ownerField) {
      const existing = await this.getRecordById(model, id, req);
      if (existing[model.ownerField] !== req.user?.id) {
        throw new Error('Access denied: You can only delete your own records');
      }
    }

    const where = this.buildWhereClause(model, req, { id });
    
    const modelClient = (this.prisma as any)[model.tableName!];
    return await modelClient.delete({
      where
    });
  }

  private validateData(model: ModelDefinition, data: any, isCreate: boolean = true) {
    const validated: any = {};
    
    for (const field of model.fields) {
      const value = data[field.name];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        if (isCreate && field.default !== undefined) {
          validated[field.name] = field.default;
        } else if (isCreate) {
          throw new Error(`Field ${field.name} is required`);
        }
      } else if (value !== undefined && value !== null) {
        // Type validation
        validated[field.name] = this.convertValue(value, field.type);
      }
    }
    
    return validated;
  }

  private convertValue(value: any, type: string): any {
    switch (type) {
      case 'number':
        const num = Number(value);
        if (isNaN(num)) throw new Error(`Invalid number value: ${value}`);
        return num;
      case 'boolean':
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1';
        }
        return Boolean(value);
      case 'date':
        const date = new Date(value);
        if (isNaN(date.getTime())) throw new Error(`Invalid date value: ${value}`);
        return date;
      default:
        return String(value);
    }
  }
}