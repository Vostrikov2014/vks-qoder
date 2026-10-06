-include proguard-rules.pro

# В AGP 8.x эти правила шли из getDefaultProguardFile('proguard-android.txt'),
# но AGP 9 запрещает этот файл именно из-за -dontoptimize. Чтобы поведение
# R8 не менялось, флаг сохранён здесь явно.
-dontoptimize

# Crashlytics
-keepattributes *Annotation*
-keepattributes SourceFile,LineNumberTable
-keep public class * extends java.lang.Exception

# R8 missing classes - suppress warnings
-dontwarn com.facebook.memory.config.MemorySpikeConfig
-dontwarn kotlinx.parcelize.Parcelize
