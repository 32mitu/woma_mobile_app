# Fix Errors Walkthrough

## Changes

### 1. Downgrade `@shopify/flash-list`
- Downgraded from `v2.0.2` to `v1.7.1` in `package.json`.
- This version is compatible with React Native's Legacy Architecture, which the app is currently using.

## Verification Results

### Automated Checks
- [x] `npm install` completed successfully.
- [ ] App compiles without "FlashList v2 is only supported on new architecture" error.
- [ ] "Missing default export" warnings resolved (expected).

### Manual Verification
- User needs to rebuild the native app (`npx expo run:ios`) to ensure native modules are correctly linked.
