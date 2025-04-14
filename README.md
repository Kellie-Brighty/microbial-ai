# Microbial AI - Personalized Microbiology Research Assistant

A specialized AI assistant for microbiology research and education that provides personalized conversations based on user interests and preferences.

## Features

- **AI-powered Microbiology Assistant**: Ask questions and get specialized information on microbiology topics.
- **User Authentication**: Create an account to personalize your AI experience.
- **Profile Customization**: Set your areas of interest and preferred topics.
- **Personalized Conversations**: The AI adapts its responses based on your profile information.
- **Thread Management**: Create and manage conversation threads for different topics.

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Firebase account for authentication and user data storage

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/microbial-ai.git
cd microbial-ai
```

2. Install dependencies:

```bash
npm install
# or
yarn
```

3. Set up environment variables:

Copy the `.env.sample` file to `.env` and fill in your API keys:

```bash
cp .env.sample .env
```

Then edit the `.env` file to add your API keys:

- OpenAI API key
- Firebase configuration (API key, auth domain, etc.)

### Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password method
3. Create a Firestore database
4. Add your Firebase configuration to your `.env` file

### Running the development server

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:5173

## User Authentication and Personalization

The user authentication system enables the AI to personalize conversations based on:

- User's display name
- Areas of interest
- Preferred microbiology topics
- Notes and additional context

After signing in, users can:

1. Edit their profile information
2. Add areas of interest
3. Specify preferred microbiology topics
4. Add notes that will be used as context for AI responses

The AI will use this information to:

- Address the user by name
- Focus on topics they're interested in
- Provide more relevant information based on their preferences
- Remember key details about the user between conversations

## Deployment

To build for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be in the `dist/` directory.

You can deploy the app to Firebase Hosting with:

```bash
firebase deploy
```

## Technologies

- React
- TypeScript
- Vite
- OpenAI API
- Firebase Authentication
- Firestore
- TailwindCSS

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
