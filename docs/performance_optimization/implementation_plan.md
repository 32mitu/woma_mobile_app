# Performance Optimization Plan

## Goal Description
Improve the loading speed of profile images and general app responsiveness. Currently, the app uses standard React Native `Image` components which lack advanced caching and performance optimization. The timeline also uses standard `FlatList` which can be sluggish with complex items like social posts.

## User Review Required
> [!IMPORTANT]
> This plan involves installing two new native dependencies: `expo-image` and `@shopify/flash-list`.
> You will need to rebuild your development client (if you are using one) or restart your Expo Go server.

## Proposed Changes

### Dependency Installation
- Install `expo-image`: Optimized image component with caching, blurhash, and preloading support.
- Install `@shopify/flash-list`: A drop-in replacement for `FlatList` that is up to 10x faster.

### Image Component Refactor
Replace `Image` from `react-native` with `Image` from `expo-image` in key areas:

#### [MODIFY] [ProfileHeader.tsx](file:///c:/dev/woma-mobile/woma_ios/src/features/profile/components/ProfileHeader.tsx)
- Use `expo-image` for the user avatar.
- Enable `contentFit="cover"` and `transition={1000}` for smooth loading.
- Set caching policy to `memory-disk` (default) to ensure instant subsequent loads.

#### [MODIFY] [Post.tsx](file:///c:/dev/woma-mobile/woma_ios/src/features/timeline/components/Post.tsx)
- Use `expo-image` for post images and author avatars.
- Implement aggressive caching for timeline images.

### List Rendering Optimization
#### [MODIFY] [Timeline.tsx](file:///c:/dev/woma-mobile/woma_ios/src/features/timeline/components/Timeline.tsx)
- Replace `FlatList` with `FlashList`.
- Set `estimatedItemSize` to improve layout measurement performance.

## Verification Plan

### Automated Tests
- Run the build command to ensure new dependencies link correctly (managed by Expo).

### Manual Verification
1.  **Profile Load Speed**: Open profile and verify image loads almost instantly on second visit.
2.  **Timeline Scroll**: Scroll rapidly through the timeline and observe smoother frames and less blank space.
3.  **Memory Usage**: Check that cached images don't cause memory spikes (expo-image handles this well).
