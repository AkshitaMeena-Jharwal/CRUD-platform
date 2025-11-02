![Screenshot 1](https://github.com/AkshitaMeena-Jharwal/CRUD-platform/blob/main/frontend/public/Screenshot%202025-11-02%20150836.png?raw=true)

![Screenshot 2](https://github.com/AkshitaMeena-Jharwal/CRUD-platform/blob/main/frontend/public/Screenshot%202025-11-02%20150853.png?raw=true)

# 🧩 Auto-Generated CRUD + RBAC Platform

A **low-code internal developer platform** that allows admin users to define data models dynamically through a web interface.  
Once published, the system automatically generates:
- ✅ CRUD APIs (Create, Read, Update, Delete)
- ✅ Admin interface for managing records
- ✅ Role-Based Access Control (RBAC) with JWT Authentication
- ✅ File-based persistence for model definitions

---

## 🚀 Features

### 🧱 1. Model Definition via UI
Admins can define new models using a form-based editor:
- Model Name (e.g., `Product`, `Employee`)
- Fields: name, type, required, default, unique
- Optional relation & owner fields
- RBAC permissions per role (Admin, Manager, Viewer)

**Example model definition:**
'''json
{
  "name": "Employee",
  "fields": [
    { "name": "name", "type": "string", "required": true },
    { "name": "age", "type": "number" },
    { "name": "isActive", "type": "boolean", "default": true }
  ],
  "ownerField": "ownerId",
  "rbac": {
    "Admin": ["all"],
    "Manager": ["create", "read", "update"],
    "Viewer": ["read"]
  }
}
'''

💾 2. File-Based Model Persistence
When a model is published:

Its definition is saved under /backend/src/models/<ModelName>.json

These model files serve as the source of truth for CRUD generation

The system can dynamically load and register routes on startup

⚙️ 3. Dynamic CRUD API Generation
For every published model, the backend automatically creates:

bash
Copy code
POST   /api/<modelName>
GET    /api/<modelName>
GET    /api/<modelName>/:id
PUT    /api/<modelName>/:id
DELETE /api/<modelName>/:id
All endpoints:

Are registered dynamically at runtime

Enforce RBAC permissions and ownership rules

Use Prisma ORM for database operations

🧑‍💼 4. Admin Interface
The React-based Admin UI provides:

Model listing and creation forms

Dynamic forms and tables based on model fields

Publish button to trigger model file creation and CRUD route registration

🔐 5. Role-Based Access Control (RBAC)
Supports roles: Admin, Manager, Viewer (extendable)

Permissions applied per model

Enforced through JWT middleware on all routes

Example rules:

Role	Create	Read	Update	Delete
Admin	✅	✅	✅	✅
Manager	✅	✅	✅	❌
Viewer	❌	✅	❌	❌

🏗️ Tech Stack
Layer	Technology
Backend	Node.js + Express.js
Database ORM	Prisma
Frontend	React + Vite
Authentication	JWT
Database	PostgreSQL / MySQL / SQLite (configurable)

⚙️ Setup Instructions
1️⃣ Clone Repository
bash
Copy code
git clone https://github.com/AkshitaMeena-Jharwal/CRUD-platform.git
cd CRUD-platform
2️⃣ Install Dependencies
Backend:
bash
Copy code
cd backend
npm install
Frontend:
bash
Copy code
cd ../frontend
npm install
3️⃣ Environment Setup
Create a .env file inside /backend:

ini
Copy code
DATABASE_URL="file:./dev.db"        # or your PostgreSQL URL
JWT_SECRET="your-secret-key"
PORT=5000
4️⃣ Prisma Setup
Run database migrations:

bash
Copy code
npx prisma migrate dev --name init
Optionally, open Prisma Studio to inspect data:

bash
Copy code
npx prisma studio
5️⃣ Start the App
Backend:
bash
Copy code
cd backend
npm run dev
Frontend:
bash
Copy code
cd ../frontend
npm run dev
Now visit the frontend in your browser — it should be running on:
👉 http://localhost:5173
and the backend on:
👉 http://localhost:5000

🧠 How It Works
Admin defines model → via UI form.

Model published → server writes JSON file (e.g., Employee.json).

Server reloads routes → dynamic CRUD endpoints created.

RBAC applied → middleware checks JWT + role permissions.

Admin UI updates automatically → shows new model’s CRUD interface.

📂 Project Structure
graphql
Copy code
CRUD-platform/
│
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── models/                # JSON model definitions
│   │   ├── routes/                # Dynamic API routes
│   │   ├── middlewares/           # RBAC + Auth
│   │   ├── utils/                 # File writer, loader, etc.
│   │   └── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/              # API calls
│   └── package.json
│
└── README.md
🧩 Example Flow
Admin logs into the system.

Defines a model like Product with fields: name, price, ownerId.

Clicks Publish.

Backend writes /models/Product.json and registers:

bash
Copy code
POST /api/products
GET /api/products
GET /api/products/:id
PUT /api/products/:id
DELETE /api/products/:id
Admin UI refreshes with Product table and CRUD forms.

RBAC ensures each user sees only their permitted actions.

🧰 Scripts
Command	Description
npm run dev	Run in development mode
npm start	Run production build
npx prisma migrate dev	Run DB migrations
npx prisma studio	Open Prisma GUI
npm run build	Create optimized build (frontend)

🧪 Tests (Optional)
Unit tests for dynamic API generation

Integration tests for RBAC middleware

To run tests:

bash
Copy code
npm test
📸 Demo & Screenshots (optional)
Add screenshots or a short demo video showing:

Model creation UI

CRUD endpoints visible in API tester (Postman)

RBAC enforcement examples
![Model Form](CRUD-platform/frontend/public
/Screenshot 2025-11-02 150836.png)

![Admin Dashboard Screenshot](CRUD-platform/frontend/public
/Screenshot 2025-11-02 150836.png
)

📄 License
This project is open-source under the MIT License.
