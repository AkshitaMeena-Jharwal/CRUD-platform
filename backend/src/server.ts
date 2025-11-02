const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const JWT_SECRET = 'your-super-secret-jwt-key-here';

app.use(cors());
app.use(express.json());

// Initialize demo users on startup
async function initializeDemoUsers() {
  console.log('🌱 Checking demo users...');
  
  const demoUsers = [
    { email: 'admin@example.com', password: 'admin123', role: 'Admin' },
    { email: 'manager@example.com', password: 'manager123', role: 'Manager' },
    { email: 'viewer@example.com', password: 'viewer123', role: 'Viewer' },
  ];

  for (const userData of demoUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role,
        },
      });
      console.log(`✅ Created demo user: ${userData.email}`);
    } else {
      console.log(`✅ Demo user already exists: ${userData.email}`);
    }
  }
}

// Auth middleware
const authMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { email, password, role = 'Viewer' } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Model registry
class ModelRegistry {
  private modelsDir: string;
  private registeredModels: Map<string, any>;

  constructor() {
    this.modelsDir = path.join(__dirname, 'models');
    this.registeredModels = new Map();
    this.ensureModelsDir();
    this.loadExistingModels();
  }

  private async ensureModelsDir() {
    try {
      await fs.access(this.modelsDir);
    } catch {
      await fs.mkdir(this.modelsDir, { recursive: true });
    }
  }

  private async loadExistingModels() {
    try {
      const files = await fs.readdir(this.modelsDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(
            path.join(this.modelsDir, file),
            'utf-8'
          );
          const model = JSON.parse(content);
          this.registeredModels.set(model.name, model);
        }
      }
      console.log(`📁 Loaded ${this.registeredModels.size} existing models`);
    } catch (error) {
      console.error('Error loading existing models:', error);
    }
  }

  async registerModel(model: any) {
    const tableName = model.tableName || `${model.name.toLowerCase()}s`;
    const modelWithTable = { ...model, tableName };

    const filePath = path.join(this.modelsDir, `${model.name}.json`);
    await fs.writeFile(filePath, JSON.stringify(modelWithTable, null, 2));

    this.registeredModels.set(model.name, modelWithTable);
    console.log(`✅ Model ${model.name} registered and saved to ${filePath}`);
  }

  getModel(name: string) {
    return this.registeredModels.get(name);
  }

  getAllModels() {
    return Array.from(this.registeredModels.values());
  }
}

const modelRegistry = new ModelRegistry();

// Dynamic CRUD Service
class DynamicCRUDService {
  private prisma: any;

  constructor(prisma: any) {
    this.prisma = prisma;
  }

  async createRecord(model: any, data: any, req: any) {
    // Add owner field if specified
    if (model.ownerField && req.user) {
      data[model.ownerField] = req.user.id;
    }

    const validatedData = this.validateData(model, data, true);
    
    const modelClient = this.prisma[model.tableName];
    if (!modelClient) {
      throw new Error(`Model ${model.tableName} not found in database`);
    }

    return await modelClient.create({
      data: validatedData
    });
  }

  async getRecords(model: any, req: any, filters: any = {}) {
    const where = this.buildWhereClause(model, req, filters);
    
    const modelClient = this.prisma[model.tableName];
    return await modelClient.findMany({
      where,
      orderBy: { id: 'desc' }
    });
  }

  async getRecordById(model: any, id: string, req: any) {
    const where = this.buildWhereClause(model, req, { id });
    
    const modelClient = this.prisma[model.tableName];
    const record = await modelClient.findUnique({
      where
    });

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  }

  async updateRecord(model: any, id: string, data: any, req: any) {
    const where = this.buildWhereClause(model, req, { id });
    const validatedData = this.validateData(model, data, false);
    
    const modelClient = this.prisma[model.tableName];
    return await modelClient.update({
      where,
      data: validatedData
    });
  }

  async deleteRecord(model: any, id: string, req: any) {
    const where = this.buildWhereClause(model, req, { id });
    
    const modelClient = this.prisma[model.tableName];
    return await modelClient.delete({
      where
    });
  }

  private buildWhereClause(model: any, req: any, filters: any) {
    const where: any = { ...filters };
    
    // Apply ownership filter if user is not admin and ownerField exists
    if (req.user?.role !== 'Admin' && model.ownerField) {
      where[model.ownerField] = req.user?.id;
    }
    
    return where;
  }

  private validateData(model: any, data: any, isCreate: boolean = true) {
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
        validated[field.name] = this.convertValue(value, field.type);
      }
    }
    
    return validated;
  }

  private convertValue(value: any, type: string) {
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

const crudService = new DynamicCRUDService(prisma);

// Model management routes
app.post('/api/models', authMiddleware, async (req: any, res: any) => {
  try {
    const model = req.body;
    
    // Only allow Admin to create models
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ error: 'Only Admin can create models' });
    }

    await modelRegistry.registerModel(model);
    
    res.status(201).json({ 
      message: 'Model published successfully',
      model 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/models', authMiddleware, async (req: any, res: any) => {
  try {
    const models = modelRegistry.getAllModels();
    res.json(models);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dynamic model routes
app.post('/api/:modelName', authMiddleware, async (req: any, res: any) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const record = await crudService.createRecord(model, req.body, req);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/:modelName', authMiddleware, async (req: any, res: any) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const records = await crudService.getRecords(model, req, req.query);
    res.json(records);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/:modelName/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const record = await crudService.getRecordById(model, req.params.id, req);
    res.json(record);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

app.put('/api/:modelName/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    const record = await crudService.updateRecord(model, req.params.id, req.body, req);
    res.json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/:modelName/:id', authMiddleware, async (req: any, res: any) => {
  try {
    const model = modelRegistry.getModel(req.params.modelName);
    if (!model) {
      return res.status(404).json({ error: 'Model not found' });
    }

    await crudService.deleteRecord(model, req.params.id, req);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req: any, res: any) => {
  res.json({ 
    status: 'OK', 
    message: 'CRUD Platform Server is running',
    timestamp: new Date().toISOString(),
    models: modelRegistry.getAllModels().length
  });
});

app.get('/', (req: any, res: any) => {
  res.send(`
    <html>
      <head>
        <title>CRUD Platform API</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .endpoint { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>🚀 CRUD Platform API</h1>
        <p>Backend server is running successfully!</p>
        
        <h2>Available Endpoints:</h2>
        <div class="endpoint"><strong>GET</strong> /api/health - Health check</div>
        <div class="endpoint"><strong>POST</strong> /api/auth/register - Register user</div>
        <div class="endpoint"><strong>POST</strong> /api/auth/login - Login user</div>
        <div class="endpoint"><strong>POST</strong> /api/models - Create model (Admin only)</div>
        <div class="endpoint"><strong>GET</strong> /api/models - List all models</div>
        
        <p>Once you create a model (e.g., "Product"), these endpoints become available:</p>
        <div class="endpoint"><strong>POST</strong> /api/Product - Create record</div>
        <div class="endpoint"><strong>GET</strong> /api/Product - List records</div>
        <div class="endpoint"><strong>GET</strong> /api/Product/:id - Get record</div>
        <div class="endpoint"><strong>PUT</strong> /api/Product/:id - Update record</div>
        <div class="endpoint"><strong>DELETE</strong> /api/Product/:id - Delete record</div>
        
        <p><a href="/api/health">Check API Health</a></p>
      </body>
    </html>
  `);
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize demo users
    await initializeDemoUsers();
    
    // Start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`👤 Demo users created: admin@example.com / admin123`);
      console.log(`👤 Demo users created: manager@example.com / manager123`);
      console.log(`👤 Demo users created: viewer@example.com / viewer123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();