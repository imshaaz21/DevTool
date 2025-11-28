# DevTools Suite

![CI](https://github.com/imshaaz21/DevTool/workflows/CI/badge.svg)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTools&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTools)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTools&metric=coverage)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTools)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTools&metric=bugs)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTools)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTools&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTools)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTools&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTools)

A modular full-stack web application containing multiple developer tools in one UI.

## Features

### 1. Saudi Fake Data Generator
- Generate realistic test data for Saudi and non-Saudi individuals
- Includes Arabic names with English transliteration
- Generates proper formatted IDs (Saudi NID, Iqama, Passport)
- Export data as JSON or table format with pagination

### 2. JSON Formatter
- Parse, format, and minify JSON
- Multiple indentation options (2, 4 spaces, tabs)
- Real-time validation with error messages
- Copy formatted output to clipboard

### 3. JSON Comparison
- Side-by-side comparison of two JSON objects
- Visual diff highlighting (additions, deletions, modifications)
- Structural validation
- View specific sections or all differences

### 4. Feature Toggle Diff
- Compare feature toggles between environments (e.g., ops vs release)
- Identify enabled/disabled features across environments
- Side-by-side JSON editor for easy comparison

### 5. Encoder/Decoder & Hash Generator
- Base64 encode/decode
- URL encode/decode
- HTML encode/decode
- Hash generation (MD5, SHA-1, SHA-256, SHA-512)
- JWT decode and validation

### 6. Base64 Image Viewer
- Decode and view Base64 encoded images
- Display image metadata (dimensions, format, size)
- Download the decoded image

## Tech Stack

- **Frontend**: React, Next.js 14, TailwindCSS
- **State Management**: React Hooks
- **Styling**: TailwindCSS with dark mode support
- **Testing**: Jest, React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18.x or later (required for testing)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/devtools-suite.git
cd devtools-suite
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Testing

This project uses Jest and React Testing Library for testing.

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### CI/CD & Code Quality

The project includes a GitHub Actions workflow that automatically:
- Runs on every push and pull request to `main`/`master`
- Tests on Node.js 18.x and 20.x
- Executes linting, tests, and builds
- Uploads test coverage reports
- **Analyzes code quality with SonarCloud** (bugs, vulnerabilities, code smells)

**Setting up SonarCloud** (optional but recommended):
- See [SONARCLOUD_SETUP.md](./SONARCLOUD_SETUP.md) for step-by-step instructions
- It's free for public repositories
- Provides automated code quality feedback on every PR

See [TESTING.md](./TESTING.md) for more details on the testing infrastructure.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Deployment

### Deploying to Vercel

The easiest way to deploy this application is using Vercel:

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and sign up or log in.
3. Click "New Project" and import your repository.
4. Keep the default settings and click "Deploy".

### Deploying with Docker

1. Build the Docker image:
```bash
docker build -t devtools-suite .
```

2. Run the container:
```bash
docker run -p 3000:3000 devtools-suite
```

## Project Structure

```
devtools-suite/
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI/CD workflow
├── app/                     # Next.js app directory
│   ├── base64-viewer/       # Base64 Image Viewer module
│   ├── encoder-decoder/     # Encoder/Decoder & Hash Generator module
│   ├── json-comparator/     # Feature Toggle Diff module
│   ├── json-comparison/     # JSON Comparison module
│   ├── json-formatter/      # JSON Formatter module
│   ├── saudi-data-generator/ # Saudi Fake Data Generator module
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── providers.tsx        # Context providers
├── components/              # Reusable components
│   ├── InteractiveJson.tsx  # Interactive JSON viewer
│   ├── JsonDiffViewer.tsx   # JSON diff visualization
│   ├── JsonEditorComponent.tsx # JSON editor wrapper
│   ├── Sidebar.tsx          # Sidebar navigation
│   └── ThemeToggle.tsx      # Dark/light mode toggle
├── utils/                   # Utility functions
│   ├── base64ImageViewer.ts # Base64 image utilities
│   ├── encoderDecoder.ts    # Encoding/decoding utilities
│   ├── jsonComparator.ts    # JSON comparison utilities
│   ├── jsonDiff.ts          # JSON diff algorithms
│   ├── jsonFormatter.ts     # JSON formatting utilities
│   └── saudiDataGenerator.ts # Saudi data generation utilities
├── __tests__/               # Test files
│   └── example.test.tsx     # Example test
├── public/                  # Static assets
├── jest.config.js           # Jest configuration
├── jest.setup.js            # Jest setup file
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # TailwindCSS configuration
├── tsconfig.json            # TypeScript configuration
└── TESTING.md               # Testing documentation
```

## Extending the Project

The application is designed to be modular and easy to extend. To add a new tool:

1. Create a new directory in the `app` directory for your tool.
2. Add utility functions in the `utils` directory.
3. Update the sidebar navigation in `components/Sidebar.tsx`.
4. Add a card for your tool on the home page in `app/page.tsx`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
