# UIT Translation App - Setup Guide

## Overview

This application provides a translation interface using the Bing Translate API. The UI features a three-panel layout:
- **Left Panel**: Input text area and source language selection
- **Center Panel**: Translate button and controls
- **Right Panel**: Translation output

## Architecture

The application uses a **backend proxy server** running on port **49653** to handle CORS issues when calling the Bing Translate API. The Angular frontend communicates with this backend server.

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Angular   │─────▶│  Backend Proxy   │─────▶│  Bing Translate │
│  Frontend   │◀─────│   (Port 49653)   │◀─────│      API        │
│ (Port 4200) │      └──────────────────┘      └─────────────────┘
└─────────────┘
```

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

## Running the Application

You need to run **both** the backend server and the Angular frontend.

### Option 1: Run in Two Separate Terminals

**Terminal 1 - Start Backend Server:**
```bash
npm run backend
```

This will start the backend proxy server on `http://localhost:49653`.

**Terminal 2 - Start Angular Frontend:**
```bash
npm start
```

This will start the Angular development server on `http://localhost:4200`.

### Option 2: Using Process Managers (Recommended for Development)

You can use tools like `concurrently` or `pm2` to run both servers simultaneously.

#### Using npm-run-all (install first):

```bash
npm install --save-dev npm-run-all
```

Then add to `package.json` scripts:
```json
"dev": "npm-run-all --parallel backend start"
```

Run with:
```bash
npm run dev
```

## Accessing the Application

Once both servers are running:

1. Open your browser and navigate to: `http://localhost:4200`
2. You should see the translation interface with three panels
3. The backend proxy on port 49653 handles all translation API calls

## Usage

1. **Select Source Language**: Choose from the dropdown in the left panel (or use "Auto Detect")
2. **Enter Text**: Type or paste your text in the left text area (max 5,000 characters)
3. **Select Target Language**: Choose your desired translation language in the right panel
4. **Click Translate**: Click the "Translate" button in the center panel
5. **View Translation**: The translated text will appear in the right panel
6. **Copy Output**: Use the "Copy to Clipboard" button to copy the translation

## Features

- ✨ **Auto Language Detection**: Automatically detects the source language
- 🔄 **Language Swap**: Swap source and target languages with one click
- 📋 **Copy to Clipboard**: Easily copy translated text
- 🎨 **Modern UI**: Clean three-panel design with teal/green color scheme
- ⚡ **Real-time Translation**: Fast translation using Bing Translate API
- 🌍 **25+ Languages**: Support for major world languages

## Backend API Endpoints

The backend server (port 49653) provides the following endpoints:

### POST /api/translate

Translates text from one language to another.

**Request Body:**
```json
{
  "text": "Hello, world!",
  "fromLang": "auto-detect",
  "toLang": "es"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "Hello, world!",
    "translation": "¡Hola, mundo!",
    "language": {
      "from": "en",
      "to": "es",
      "score": 1.0
    }
  }
}
```

### GET /api/health

Health check endpoint to verify the backend is running.

**Response:**
```json
{
  "status": "healthy",
  "service": "Bing Translation API",
  "timestamp": "2026-04-03T11:18:11.573Z"
}
```

## Troubleshooting

### Backend Server Not Running

**Error**: "Translation failed" or network errors in browser console

**Solution**: Make sure the backend server is running on port 49653:
```bash
npm run backend
```

Verify it's running by visiting: `http://localhost:49653/api/health`

### Port 49653 Already in Use

**Error**: `EADDRINUSE: address already in use :::49653`

**Solution**: Either:
1. Stop the process using port 49653
2. Or change the port in `examples/backend-translation-api.js` and `src/app/services/translation.service.ts`

### CORS Errors

If you see CORS errors, ensure:
1. The backend server is running
2. The frontend is making requests to `http://localhost:49653` (not directly to Bing)
3. The backend has CORS enabled (it should be by default)

### Translation Fails

Common causes:
1. Backend server not running
2. No internet connection (Bing API requires internet)
3. Text exceeds 5,000 character limit
4. Invalid language codes

## Production Deployment

For production deployment:

1. **Backend**: Deploy the backend server (`examples/backend-translation-api.js`) to your hosting platform
2. **Frontend**: Update the API URL in `src/app/services/translation.service.ts` to point to your production backend
3. **Build**: Run `npm run build` to create production build
4. **Deploy**: Deploy the `dist/` folder to your web server

### Environment Variables

Set the backend port using environment variables:

```bash
PORT=49653 node examples/backend-translation-api.js
```

## Development

### Project Structure

```
uit-translation-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── translator/          # Main translation component
│   │   └── services/
│   │       └── translation.service.ts  # Translation service (calls backend)
├── examples/
│   └── backend-translation-api.js   # Backend proxy server (port 49653)
└── package.json
```

### Making Changes

- **UI Changes**: Edit files in `src/app/components/translator/`
- **Backend Changes**: Edit `examples/backend-translation-api.js`
- **API Integration**: Edit `src/app/services/translation.service.ts`

## License

This project uses the `bing-translate-api` package. Please refer to Bing's terms of service for API usage guidelines.

## Support

For issues or questions, please check:
1. This setup guide
2. The main README.md
3. Backend server logs in the terminal
4. Browser console for frontend errors
