# Implementation Plan - Fix Errors

## Problem
The app is crashing with `FlashList v2 is only supported on new architecture` and `Cannot find native module 'ExpoImage'`. There are also warnings about missing default exports.

## Cause
1. `@shopify/flash-list` v2 requires New Architecture, but the app is on Legacy Architecture.
2. `expo-image` is a native module that likely requires a rebuild of the native ios/android folders.
3. Missing default exports warnings might be side effects of the module crashing during load (especially `search.tsx` which uses FlashList).

## Proposed Changes

### Configuration
#### [MODIFY] [package.json](file:///c:/dev/woma-mobile/woma_ios/package.json)
- Downgrade `@shopify/flash-list` from `^2.0.2` to `1.7.1`.

### Verification Plan
1. Downgrade package.
2. User needs to run `npm install`.
3. User needs to run `npx expo run:ios` to rebuild native app (for `expo-image` and clean build).
4. Verify if warnings about "missing default export" disappear.

## Notes
- `FlashList` crash is likely blocking the module evaluation of `search.tsx`, appearing as "missing default export".
