# Copilot Instructions for WOMA Mobile

## Project Overview
**WOMA Mobile** is a React Native mobile application built with Expo (v54.0) and React 19.1. The project uses the New Architecture (`newArchEnabled: true`), targeting iOS, Android, and Web platforms simultaneously.

## Architecture & Structure

### Entry Point
- **`index.js`**: Registers the root component using `registerRootComponent(App)` from Expo
- **`App.js`**: Root component - the single entry point for the entire app
- **`app.json`**: Expo configuration for all platform-specific settings (icons, splash screens, permissions, etc.)

### Platform Targets
- **iOS**: Supports iPad (via `supportsTablet: true`)
- **Android**: Edge-to-edge display enabled with adaptive icons
- **Web**: Served with favicon support

## Development Workflow

### Core Commands
- `npm start` — Start Expo development server (choose platform interactively)
- `npm run ios` — Run on iOS simulator
- `npm run android` — Run on Android emulator
- `npm run web` — Run web version

### Setup
1. Ensure Node.js 18+ is installed
2. Run `npm install` (dependencies are minimal at this stage)
3. Use Expo Go app on physical devices for quick testing

## Patterns & Conventions

### Component Structure
- Currently minimal: root `App` component only
- **Style inline**: Use `StyleSheet.create()` for all styles (React Native standard)
- **No state management**: App is stateless; add Context API or Redux when needed

### Dependencies
- **Core**: `react`, `react-native`, `expo`
- **Status Bar**: `expo-status-bar` (included; not used in App.js yet)
- Minimal dependencies by design—add packages only as features expand

### Build & Distribution
- Expo handles native iOS/Android builds via EAS (Expo Application Services)
- No native code in repo yet (iOS/Android folders generated during build)
- `.gitignore` excludes native builds and sensitive keys (`.jks`, `.p8`, `.p12`, `.key`)

## Critical Developer Notes

### When Adding Features
1. **New Screens**: Add as separate component files; import into `App.js`
2. **Navigation**: Will require `@react-navigation/native` or similar (not yet included)
3. **State**: Use hooks locally (`useState`) or Context API at app level
4. **Styling**: Keep all styles in `StyleSheet.create()` for performance

### Debugging
- Expo Dev Tools available in terminal: press `j` for web, `i` for iOS, `a` for Android
- Use `console.log()` — output appears in terminal
- Rebuild with `npm start` if changes don't reflect (clear Metro cache if needed)

### Web-Specific Considerations
- React Native Web enables web builds; not all RN components have perfect web parity
- Test Web platform early if it's in scope (via `npm run web`)

## Known Limitations & Next Steps
- No routing library yet—add when navigation needed
- No backend API integration scaffolding—establish patterns early (fetch/axios + error handling)
- No testing framework—recommend Jest + React Native Testing Library when quality bar is set
