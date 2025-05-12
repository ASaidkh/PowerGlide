# Comprehensive JNA rules
-dontwarn java.awt.**
-dontwarn java.beans.**
-dontwarn java.applet.**
-dontwarn sun.awt.**
-dontwarn com.sun.jna.**
-dontwarn org.apache.commons.logging.**

# Keep all JNA classes and methods
-keep class com.sun.jna.** { *; }
-keepclassmembers class com.sun.jna.** { *; }
-keepclassmembers class * implements com.sun.jna.** { *; }

# Keep JNA callback interfaces
-keep interface com.sun.jna.** { *; }

# Preserve native method names
-keepclasseswithmembernames class * {
    native <methods>;
}

# Preserve callback classes that extend Structure
-keep class * extends com.sun.jna.Structure { *; }

# Keep Structure fields
-keepclassmembers class * extends com.sun.jna.Structure {
    public *;
}

# Preserve all JNA entry points
-keep class com.sun.jna.Native
-keepclassmembers class com.sun.jna.Native {
    public static <methods>;
}

# Preserve JNI classes
-keep class com.sun.jna.JNIEnv { *; }