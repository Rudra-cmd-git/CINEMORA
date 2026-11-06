# NetMirror Streaming Analysis Results

## Source File
- **APK**: `C:\Users\rudra\OneDrive\Desktop\CINEMORA\NetMirror_Updated.apk`
- **SHA256**: `70af4ac2a7ec38b06de4fcb6d18dcbdf7ddc2095bb8129f0f84860dcb995dc0c`
- **Size**: 51.7 MB

## Application Architecture
- **Type**: React Native application with Hermes JavaScript engine
- **Main JS Bundle**: `assets/index.android.bundle` (1,215,512 bytes, Hermes bytecode)
- **Java/Kotlin Bytecode**: `classes.dex` (3,553,444 bytes)
- **Resources**: `resources.arsc` (345,512 bytes)
- **Android Manifest**: `AndroidManifest.xml` (7,272 bytes)

## Native Libraries (3 Architectures: arm64-v8a, armeabi-v7a, x86)
| Library | Purpose |
|---------|---------|
| `libreactnative.so` | React Native core framework |
| `libhermes.so` | Hermes JavaScript engine |
| `libappmodules.so` | App-specific native modules |
| `libfbjni.so` | Facebook JNI bridge |
| `libjsi.so` | JavaScript Interface |
| `libhermestooling.so` | Hermes debugging/tooling |
| `libimagepipeline.so` | Fresco image pipeline |
| `libnative-imagetranscoder.so` | Image transcoding |
| `libnative-filters.so` | Native image filters |
| `libgesturehandler.so` | React Native Gesture Handler |
| `libc++_shared.so` | C++ standard library |

## Key Findings

### Domain Discovered
- **`netmirror.app`** - Found referenced in the JavaScript bundle

### Streaming-Related Keywords Found
The following streaming-related terms appear in the code:
- `hls` - HTTP Live Streaming protocol
- `dash` - MPEG-DASH streaming protocol
- `stream` - Streaming functionality
- `video` - Video playback
- `movie` - Movie content
- `watch` - Watch functionality
- `playback` - Media playback
- `auth` - Authentication
- `token` - Auth tokens
- `headers` - HTTP headers

### Limitations of Static Analysis
1. **Hermes bytecode is obfuscated** - The `index.android.bundle` is compiled Hermes bytecode, not readable JavaScript. Cannot recover readable source code without the Wakaru tool (not installed).
2. **No REA binary analysis providers** - Ghidra, Hopper, IDA, and Kuna are not configured, preventing native library disassembly.
3. **No dynamic capture** - mitmweb requires CA certificate installation on the phone (skipped per user request).

## Files in CINEMORA Folder
| File | Description |
|------|-------------|
| `NetMirror_Updated.apk` | Original APK |
| `NetMirror_index.bundle` | Extracted JS bundle (Hermes bytecode) |
| `libappmodules_arm64.so` | App-specific native library (arm64) |
| `libreactnative_arm64.so` | React Native native library (arm64) |
| `apk_extract/` | Full APK extraction directory |
| `extract_urls.ps1` | URL extraction PowerShell script |
| `search_streaming.ps1` | Streaming pattern search script |

## Recommended Next Steps for Full Analysis

1. **Dynamic network capture** (requires phone setup):
   - Configure phone WiFi proxy to `10.63.143.73:8080`
   - Install mitmproxy CA certificate on phone
   - Play content in NetMirror app
   - Capture all API calls and stream URLs

2. **Alternative: Frida instrumentation** (no CA cert needed):
   - Attach Frida to running NetMirror app
   - Hook HTTP client libraries to capture request URLs

3. **Wakaru installation** (for JS bundle recovery):
   - Install Wakaru ^1.13.0 Linux x64 binary
   - Use REA `recover_javascript_sources` on the bundle

## Conclusion
NetMirror is a React Native streaming app that uses `netmirror.app` as its domain. The app supports streaming protocols (HLS/DASH) and has authentication mechanisms. Specific API endpoints and stream URLs could not be recovered from static analysis due to Hermes bytecode obfuscation.