# 🌍 Translation App

Angular + Express (Serverless) Translation App deployed on Vercel using `bing-translate-api`.

## 🧱 Tech Stack

- **Frontend:** Angular
- **Backend:** Serverless (Express-style functions)
- **Deployment:** Vercel
- **Translation Engine:** `bing-translate-api`

## 📁 Project Structure

```
translation-app/
├── frontend/        # Angular app
├── api/             # Backend (Vercel functions)
├── package.json     # Root package configuration
└── vercel.json      # Vercel deployment configuration
```

## 🚀 Getting Started

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## 🚀 Deployment

Deploy to Vercel by connecting your GitHub repository and configuring:

- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/dist/frontend`
