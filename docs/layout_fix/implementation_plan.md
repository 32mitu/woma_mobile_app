# Layout Fix Implementation Plan

## Goal Description
Fix layout issues on modern iPhones (with notch/Dynamic Island) and Android devices where content may be obscured by the status bar or navigation bar. currently, the app uses React Native's default `SafeAreaView`, which behaves inconsistently across platforms (especially Android). We will switch to `react-native-safe-area-context` which handles these cases correctly.

## User Review Required
> [!IMPORTANT]
> The fixes involve changing how the app handles screen edges. Please verify purely on physical devices, especially:
> - Android Config: Check if the header overlaps with the status bar.
> - iPhone 14/15/16 (Pro): Check if the header is comfortably below the Dynamic Island/Notch.
> - iPhone SE: Ensure no regression (layout should remain correct).

## Proposed Changes

### App Components
Replacing `import { SafeAreaView } from 'react-native'` with `import { SafeAreaView } from 'react-native-safe-area-context'`. We will also configure the `edges` prop to ensure we don't add unnecessary padding where the Tab Bar handles it.

#### [MODIFY] [home.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/home.tsx)
- Switch import to `react-native-safe-area-context`.
- Update `<SafeAreaView>` to use `edges={['top', 'left', 'right']}` (skipping bottom since Tabs handles the bottom safe area).

#### [MODIFY] [profile.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/profile.tsx)
- Switch import to `react-native-safe-area-context`.
- Update `<SafeAreaView>` to use `edges={['top', 'left', 'right']}`.

#### [MODIFY] [record.tsx](file:///c:/dev/woma-mobile/woma_ios/app/(tabs)/record.tsx)
- Switch import to `react-native-safe-area-context`.
- Update `<SafeAreaView>` to use `edges={['top', 'left', 'right']}`.

## Verification Plan

### Manual Verification
Since I cannot run the emulator directly to verify visual layout on specific device models, please run the app on your devices:
1.  **Home Tab**: Verify the "WOMA" header is not covered by the status bar on Android or the Notch on iPhone.
2.  **Profile Tab**: Verify the content starts below the status bar area.
3.  **Record Tab**: Verify the top content is visible.
4.  **Bottom Area**: Ensure there isn't double padding above the Tab Bar.
