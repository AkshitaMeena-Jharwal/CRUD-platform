import { Router } from 'express';
import { ModelDefinition, AuthRequest } from '../types/index.js';
import { DynamicCRUDService } from '../services/DynamicCRUDService.js';
import { authMiddleware } from '../middleware/auth.js';

export class RouteGenerator {
  static generateRoutes(model: ModelDefinition, crudService: DynamicCRUDService): Router {
    const router = Router();
    const routePath = `/${model.name.toLowerCase()}`;

    // Apply auth middleware to all routes
    router.use(authMiddleware);

    // CREATE
    router.post(routePath, async (req: AuthRequest, res) => {
      try {
        const record = await crudService.createRecord(model, req.body, req);
        res.status(201).json(record);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // READ ALL
    router.get(routePath, async (req: AuthRequest, res) => {
      try {
        const records = await crudService.getRecords(model, req, req.query);
        res.json(records);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // READ ONE
    router.get(`${routePath}/:id`, async (req: AuthRequest, res) => {
      try {
        const record = await crudService.getRecordById(model, req.params.id, req);
        res.json(record);
      } catch (error: any) {
        res.status(404).json({ error: error.message });
      }
    });

    // UPDATE
    router.put(`${routePath}/:id`, async (req: AuthRequest, res) => {
      try {
        const record = await crudService.updateRecord(model, req.params.id, req.body, req);
        res.json(record);
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    // DELETE
    router.delete(`${routePath}/:id`, async (req: AuthRequest, res) => {
      try {
        await crudService.deleteRecord(model, req.params.id, req);
        res.status(204).send();
      } catch (error: any) {
        res.status(400).json({ error: error.message });
      }
    });

    return router;
  }
}