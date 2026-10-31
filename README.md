# AI-Driven Student Performance Analytics & Early Warning System (EduPulse AI)

**Engineering Capstone Project – 1 · Academic Year 2026–2027**  
**Department of Computer Science & Engineering (CSE)**

---

### Project Team
* **G. Akshath** — 2420030512
* **P. TejAditya** — 2420030520
* **I. Rajesh** — 2420030684

### Project Guide
* **Dr. Pratusha Mam** — Associate Professor & Capstone Guide

---

## 🚀 Running the Project

### Option A: Standard Dual-Process Setup (Frontend via `npm` + Backend via `Flask`)

#### 1. Backend (Flask)
```bash
# Navigate to flask backend folder
cd backend_flask

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Flask backend on http://127.0.0.1:5000
python app.py
```

#### 2. Frontend (React / Vite)
```bash
# In the root project directory:
npm install

# Start Vite React frontend on http://localhost:5173
npm run dev:frontend
```
> The React frontend is pre-configured to proxy `/api/*` requests to the Flask server running at `http://127.0.0.1:5000`.

---

### Option B: All-in-One Full-Stack Node Mode (Single Port 3000)
```bash
npm install
npm run dev
```
> Launches the complete application on `http://localhost:3000`.

---

## 🔑 Login Credentials

| Role | Username / ID | Password | Profile |
| :--- | :--- | :--- | :--- |
| **Student** | `2420030520` | `student123` | P. TejAditya (Capstone Team) |
| **Student** | `2420030512` | `student123` | G. Akshath (Capstone Team) |
| **Student** | `2420030684` | `student123` | I. Rajesh (Capstone Team) |
| **Student** | `2420030533` | `student123` | Rahul Verma (Attendance Risk Case) |
| **Faculty & Guide** | `EMP-CSE-042` | `guide123` | Dr. Pratusha Mam (Guide & Associate Professor) |
| **Course Faculty** | `EMP-CSE-058` | `faculty123` | Prof. K. Ramanathan (DBMS / OS Faculty) |
| **Administrator** | `ADM-CSE-001` | `admin123` | Dr. S. K. Murthy (Dean of Academic Analytics) |

---

## 🏛️ System Modules & Features
1. **Academic Intelligence & Risk Engine:** Multi-factor weighted score analysis (Midterms, Quizzes, Assignments, Labs, Attendance).
2. **Early Warning Signals:** Debarment warnings, low assessment triggers, score drop detection.
3. **What-If Simulation Sandbox:** Real-time projected GPA impact by simulating study hours and attendance changes.
4. **Proctorial Mentoring Desk:** Weekly student wellness logging (stress, confidence, study/sleep tracking), 1-on-1 counseling diary, parent alert flags.
5. **University ERP Hub:** Digital Exam Admit Card (Hall Ticket with statutory debarment checks), Provisional Grade Transcript, Daily Class Timetable, and Campus Circulars.
