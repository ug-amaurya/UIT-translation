# UIT Translation App

This is an Angular 19 application with PrimeNG and PrimeFlex integration for building the UIT Translation platform. The app now includes **Bing Translate API** integration for real-time translation capabilities.

## Tech Stack

- **Angular 19** - Latest Angular framework with standalone components
- **PrimeNG 19** - Comprehensive UI component library
- **PrimeFlex** - Utility-first CSS framework
- **PrimeIcons** - Icon library
- **@primeuix/themes** - Modern theming system (Aura preset)
- **bing-translate-api** - Translation API package (v4.2.0)

## Features

✨ **Translation Features:**
- 🌍 Support for 25+ languages
- 🔍 Automatic language detection
- 🔄 Swap source and target languages
- 📋 Copy translation to clipboard
- ⚡ Real-time translation
- 📊 Character count indicator (max 5,000 characters)

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Getting Started

### Installation

Install dependencies:

```bash
npm install
```

### Running the Application

**Important**: This application requires running both a backend server and the Angular frontend.

**Step 1 - Start Backend Server (Port 49653):**
```bash
npm run backend
```

**Step 2 - Start Angular Frontend (in a new terminal):**
```bash
npm start
```

Once both servers are running, open your browser and navigate to `http://localhost:4200/`.

For detailed setup instructions, troubleshooting, and deployment guide, see **[SETUP.md](./SETUP.md)**.

### Quick Start (One Command)

You can also install `npm-run-all` to run both servers simultaneously:
```bash
npm install --save-dev npm-run-all
```

Then add this to your `package.json` scripts:
```json
"dev": "npm-run-all --parallel backend start"
```

And run:
```bash
npm run dev
```

### Building

To build the project for production:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory.

## Project Structure

```
uit-translation-app/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   └── translator/          # Translation component
│   │   │       ├── translator.component.ts
│   │   │       ├── translator.component.html
│   │   │       ├── translator.component.scss
│   │   │       └── translator.component.spec.ts
│   │   ├── services/
│   │   │   ├── translation.service.ts    # Bing Translate API service
│   │   │   └── translation.service.spec.ts
│   │   ├── app.component.ts       # Main app component
│   │   ├── app.component.html     # Main template
│   │   ├── app.config.ts          # App configuration with PrimeNG & HttpClient
│   │   └── app.routes.ts          # Routing configuration
│   ├── styles.scss                # Global styles with PrimeIcons & PrimeFlex
│   └── index.html                 # Main HTML file
├── angular.json                   # Angular CLI configuration
├── package.json                   # Dependencies (includes bing-translate-api)
└── tsconfig.json                  # TypeScript configuration
```

## PrimeNG Configuration

The application is configured to use PrimeNG 19 with the Aura theme preset. The configuration is in `src/app/app.config.ts`:

```typescript
providePrimeNG({
  theme: {
    preset: Aura
  }
})
```

## Bing Translate API Integration

The application uses the `bing-translate-api` package (v4.2.0) for translation features.

### Translation Service

The `TranslationService` (`src/app/services/translation.service.ts`) provides:
- Browser-compatible translation using Bing's public API endpoint
- Support for 25+ languages
- Automatic language detection
- Language code to name mapping

### Translator Component

The `TranslatorComponent` (`src/app/components/translator/`) provides a full-featured UI with:
- Source and target language selection
- Text input with character limit (5,000 chars)
- Real-time translation
- Language swap functionality
- Copy to clipboard feature
- Loading states and error handling

### Usage Example

```typescript
import { TranslationService } from './services/translation.service';

// Inject the service
constructor(private translationService: TranslationService) {}

// Translate text
this.translationService.translate('Hello', 'en', 'es').subscribe({
  next: (result) => {
    console.log(result.translation); // "Hola"
  },
  error: (error) => {
    console.error('Translation failed:', error);
  }
});
```

### Important Notes

1. **CORS Considerations**: The browser-based implementation may encounter CORS issues in some environments. For production use, consider setting up a backend proxy server.

2. **Alternative Backend Usage**: The `bing-translate-api` package is designed for Node.js. For full functionality, you can:
   - Set up a backend API endpoint that uses the package
   - See the `examples/` directory for a complete Node.js/Express backend implementation
   - Use the backend example as a reference for production deployment

3. **Rate Limits**: Be aware of Bing Translator's rate limits and terms of service.

## Backend Integration Example

For production use, we recommend using a Node.js backend with the bing-translate-api package. A complete example is provided in the `examples/` directory:

**The backend server runs on port 49653 to handle CORS issues:**

```bash
# Run the backend server
npm run backend
```

The backend will be available at `http://localhost:49653`.

See `examples/README.md` and **[SETUP.md](./SETUP.md)** for detailed setup instructions and API documentation.

## Code Scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Running Tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner:

```bash
ng test
```

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [PrimeNG Documentation](https://primeng.org)
- [PrimeFlex Documentation](https://primeflex.org)
- [Angular CLI Reference](https://angular.dev/tools/cli)
