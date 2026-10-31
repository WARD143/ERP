# EduPulse AI — Quick Terminal Commands Manual

**Engineering Capstone Project – 1 (A.Y. 2026–2027)**  
*Project Team:* G. Akshath (2420030512) · P. TejAditya (2420030520) · I. Rajesh (2420030684)  
*Guide:* Dr. Pratusha Mam | *Department:* Computer Science & Engineering (CSE)

---

## 1. Quick Command Summary Cheat Sheet

| Component | Goal | Terminal Command |
| :--- | :--- | :--- |
| **Frontend (React)** | Install dependencies | `npm install` |
| **Frontend (React)** | Start development server | `npm run dev:frontend` *(runs on http://localhost:5173)* |
| **Frontend (React)** | Build for production | `npm run build` |
| **Frontend (React)** | Type-check / Lint | `npm run lint` |
| **Backend (Flask)** | Create virtual environment | `python3 -m venv venv` |
| **Backend (Flask)** | Activate virtual environment | `source venv/bin/activate` *(Mac/Linux)* or `venv\Scripts\activate` *(Windows)* |
| **Backend (Flask)** | Install Flask dependencies | `pip install -r backend_flask/requirements.txt` |
| **Backend (Flask)** | Run Flask server | `python3 backend_flask/app.py` *(runs on http://127.0.0.1:5000)* |
| **All-in-One (Node)** | Run Full-stack Unified App | `npm run dev` *(runs frontend + backend on http://localhost:3000)* |

---

## 2. Frontend Commands (`npm`)

Open a terminal in the root project folder:

### Step 1: Install packages
```bash
npm install
```

### Step 2: Run Frontend Development Server
```bash
npm run dev:frontend
```
* Runs the Vite React SPA on **`http://localhost:5173`**.
* Any API requests to `/api/*` are automatically proxied to the Python Flask backend at `http://127.0.0.1:5000` (configured in `vite.config.ts`).

### Step 3: Production Build
```bash
npm run build
```
* Compiles TypeScript and creates optimized minified assets in the `/dist` directory.

### Step 4: Preview Production Build
```bash
npm run preview
```

---

## 3. Backend Commands (`Flask` in Python)

Open a second terminal window in the project folder:

### Step 1: Navigate to the Flask Backend directory
```bash
cd backend_flask
```

### Step 2: Create a Python Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv venv

# On Windows:
python -m venv venv
```

### Step 3: Activate the Virtual Environment
```bash
# On Linux / macOS:
source venv/bin/activate

# On Windows Command Prompt:
venv\Scripts\activate.bat

# On Windows PowerShell:
venv\Scripts\Activate.ps1
```

### Step 4: Install Flask Dependencies
```bash
pip install -r requirements.txt
```
*This installs:*
* `flask` (REST API server)
* `flask-cors` (Cross-Origin Resource Sharing for React frontend)
* `python-dotenv` (environment variables)

### Step 5: Run the Flask Backend Server
```bash
python app.py
```
*Or using the Flask CLI:*
```bash
flask --app app run --port 5000 --debug
```
* Server starts on **`http://127.0.0.1:5000`**.
* It connects directly to the SQLite database (`academic_analytics.sqlite`) with all student marks, attendance, alerts, and mentoring records.

---

## 4. How Frontend & Flask Backend Communicate

1. The React Vite frontend runs on **`http://localhost:5173`**.
2. The Python Flask server runs on **`http://127.0.0.1:5000`**.
3. **`vite.config.ts`** automatically forwards all `/api/*` calls from the browser to Flask:
   ```ts
   server: {
     port: 5173,
     proxy: {
       '/api': {
         target: 'http://127.0.0.1:5000',
         changeOrigin: true
       }
     }
   }
   ```
4. You can also specify an explicit API URL when running the frontend:
   ```bash
   VITE_API_URL=http://127.0.0.1:5000 npm run dev:frontend
   ```

---

## 5. Ready-to-Use Login Credentials

### Student Profile:
* **Roll Number:** `2420030520` (P. TejAditya) or `2420030512` (G. Akshath) or `2420030684` (I. Rajesh)
* **Password:** `student123`

### Faculty / Proctor Profile:
* **Employee ID:** `EMP-CSE-042` (Dr. Pratusha Mam — Capstone Guide)
* **Password:** `guide123`

### Institutional Admin Profile:
* **Employee ID:** `ADM-CSE-001` (Dr. S. K. Murthy — Dean)
* **Password:** `admin123`
