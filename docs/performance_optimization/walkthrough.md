# Performance Optimization Walkthrough

## Improvements Made

### Image Loading Speed
- **Library**: Switched from `react-native` Image to `expo-image`.
- **Benefits**:
    - **Caching**: Images are now cached on disk and memory (`cachePolicy="memory-disk"`), making subsequent loads instant.
    - **Visuals**: Added a smooth fade-in transition (`transition={1000}`) to prevent popping.
    - **Format**: `contentFit="cover"` ensures images render correctly without expensive resizing calculations.
- **Affected Components**:
    - `ProfileHeader.tsx`: User avatar.
    - `Post.tsx`: Author avatars and post attachment images.

### List Rendering Performance
- **Library**: Switched from `FlatList` to `@shopify/flash-list`.
- **Benefits**:
    - **Frame Rate**: FlashList runs on the UI thread and recycles views more efficiently, capable of maintaining 60fps even with complex items.
    - **Memory**: Drastically reduced memory usage for long lists.
- **Affected Components**:
    - `Timeline.tsx`: The main feed list.

## Testing Verification

### How to Verify
1.  **Rebuild/Restart**: Since new native libraries were added, you **MUST** rebuild your development client or restart Expo Go.
2.  **Profile Test**:
    - Go to the Profile tab.
    - Verify the avatar loads.
    - Switch tabs and come back. The image should appear instantly without reloading.
3.  **Timeline Test**:
    - Scroll through the timeline.
    - Observe if the scrolling feels smoother compared to before.
    - Verify images in posts load gracefully.

### Troubleshooting
If you see errors like `FlashList` not found or `Image` module missing:
- Stop the server (`Ctrl+C`).
- Run `npx expo install` to ensure everything is linked.
- Restart with `npx expo start --clear`.
