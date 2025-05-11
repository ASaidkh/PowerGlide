# React Native Vosk
-keep class org.vosk.** { *; }
-dontwarn org.vosk.**
-keep class com.alphacephei.vosk.** { *; }
-dontwarn com.alphacephei.vosk.**

# React Native BLE PLX
-keep class com.polidea.reactnativeble.** { *; }
-dontwarn com.polidea.reactnativeble.**

# Vision Camera
-keep class com.mrousavy.camera.** { *; }
-dontwarn com.mrousavy.camera.**

# Reanimated 
-keep class com.swmansion.reanimated.** { *; }
-dontwarn com.swmansion.reanimated.**

# React Native General
-keep class com.facebook.react.** { *; }
-dontwarn com.facebook.react.**

# React Native Worklets
-keep class com.swmansion.worklets.** { *; }
-dontwarn com.swmansion.worklets.**

# Keep JavascriptCore which might be used by some libraries
-keep class org.webkit.** { *; }
-dontwarn org.webkit.**
-keep class org.mozilla.javascript.** { *; }
-dontwarn org.mozilla.javascript.**