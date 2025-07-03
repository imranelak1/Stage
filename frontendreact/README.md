# SensThings Frontend

Application frontend React pour SensThings, développée avec Vite, TypeScript et TailwindCSS.

## Installation

```bash
npm install
```

## Développement local

```bash
npm run dev
```

## Construction pour production

```bash
npm run build
```

## Déploiement sur Vercel

Le projet est configuré pour être déployé sur Vercel. Un fichier `vercel.json` est inclus à la racine du projet avec les paramètres de configuration nécessaires.

### Étapes pour déployer sur Vercel

1. Créez un compte sur [Vercel](https://vercel.com) si vous n'en avez pas déjà un
2. Installez l'outil CLI Vercel (optionnel)
   ```bash
   npm install -g vercel
   ```
3. Connectez-vous à votre compte Vercel
   ```bash
   vercel login
   ```
4. Déployez l'application
   ```bash
   vercel
   ```
   
Alternativement, vous pouvez déployer directement depuis l'interface web de Vercel en important votre projet depuis GitHub.

### Variables d'environnement

Les variables d'environnement suivantes doivent être configurées dans le tableau de bord Vercel :

- `VITE_API_BASE_URL` : URL de base de l'API backend (par exemple, https://api.sensthings.ma)

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
