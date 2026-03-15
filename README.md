# Netflix Clone - Frontend

This is the **Angular 21** frontend for the Netflix Clone project.  
It connects to the Spring Boot backend to display videos, handle authentication, and manage subscriptions.

---

## 🛠 Tech Stack

- Angular 21
- TypeScript
- HTML5 & CSS3
- SCSS
- Bootstrap / Tailwind CSS
- RxJS
- Angular HTTP Client

---

## 🚀 Features

- User registration & login (JWT secured via backend)
- Browse videos by category
- Play videos (video player integration)
- Subscription management
- Responsive design for desktop and mobile
- Connects seamlessly to backend REST APIs

---

## 📂 Project Structure


src/
├─ app/
│ ├─ components/ # UI components
│ ├─ services/ # HTTP services for API calls
│ ├─ models/ # TypeScript models/interfaces
│ ├─ auth/ # Login/Register components & guards
│ └─ app.module.ts
├─ assets/ # Images & videos
└─ environments/
└─ environment.ts # API URL config


---

## ⚙️ Setup Instructions

### 1. Clone Repository
```bash
git clone https://github.com/amannmishra/netflix-clone.git
cd netflix-clone
2. Install Dependencies
npm install
3. Run Development Server
ng serve

Open browser at: http://localhost:4200/

The app reloads automatically on changes

4. Connect to Backend

Edit src/environments/environment.ts to point to your backend API:

export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
🧪 Testing

Run unit tests:

ng test

Run e2e tests (optional):

ng e2e
📌 Notes

Make sure the backend is running before starting the frontend

Optional: Add screenshots or GIFs of the app for better project presentation

This project is portfolio-ready, ideal for internship or job showcase
