# DevTools Suite

A modular full-stack web application containing multiple developer tools in one UI.

## Features

### 1. Saudi Fake Data Generator
- Generate realistic test data for Saudi and non-Saudi individuals
- Includes Arabic names with English transliteration
- Generates proper formatted IDs (Saudi NID, Iqama, Passport)
- Export data as JSON or CSV

### 2. JSON Key Comparator
- Compare two JSON objects to identify differences in structure
- View keys that exist in one object but not the other
- Tree-diff view for hierarchical comparison
- Pretty-print JSON for better readability

### 3. Base64 Image Viewer
- Decode and view Base64 encoded images
- Display image metadata (dimensions, format, size)
- Download the decoded image

## Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **State Management**: React Hooks
- **Styling**: TailwindCSS with dark mode support
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18.x or later
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
├── app/                    # Next.js app directory
│   ├── base64-viewer/      # Base64 Image Viewer module
│   ├── json-comparator/    # JSON Key Comparator module
│   ├── saudi-data-generator/ # Saudi Fake Data Generator module
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # Context providers
├── components/             # Reusable components
│   ├── Sidebar.tsx         # Sidebar navigation
│   └── ThemeToggle.tsx     # Dark/light mode toggle
├── utils/                  # Utility functions
│   ├── base64ImageViewer.ts # Base64 image utilities
│   ├── jsonComparator.ts   # JSON comparison utilities
│   └── saudiDataGenerator.ts # Saudi data generation utilities
├── public/                 # Static assets
├── next.config.js          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # TailwindCSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Extending the Project

The application is designed to be modular and easy to extend. To add a new tool:

1. Create a new directory in the `app` directory for your tool.
2. Add utility functions in the `utils` directory.
3. Update the sidebar navigation in `components/Sidebar.tsx`.
4. Add a card for your tool on the home page in `app/page.tsx`.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
