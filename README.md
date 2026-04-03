# UIT Translation App

This is an Angular 19 application with PrimeNG and PrimeFlex integration for building the UIT Translation platform.

## Tech Stack

- **Angular 19** - Latest Angular framework with standalone components
- **PrimeNG 19** - Comprehensive UI component library
- **PrimeFlex** - Utility-first CSS framework
- **PrimeIcons** - Icon library
- **@primeuix/themes** - Modern theming system (Aura preset)

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

## Getting Started

### Installation

Install dependencies:

```bash
npm install
```

### Development Server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

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
│   │   ├── app.component.ts       # Main app component
│   │   ├── app.component.html     # Main template
│   │   ├── app.config.ts          # App configuration with PrimeNG setup
│   │   └── app.routes.ts          # Routing configuration
│   ├── styles.scss                # Global styles with PrimeIcons & PrimeFlex
│   └── index.html                 # Main HTML file
├── angular.json                   # Angular CLI configuration
├── package.json                   # Dependencies
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
