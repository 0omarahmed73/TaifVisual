import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("rust")
}

val tauriProperties = Properties().apply {
    val propFile = file("tauri.properties")
    if (propFile.exists()) {
        propFile.inputStream().use { load(it) }
    }
}

// Release signing: the key lives outside the repository (~/.taif-signing).
val signingProps = Properties().apply {
    val f = File(System.getProperty("user.home"), ".taif-signing/keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    compileSdk = 34
    namespace = "com.taif.app"
    defaultConfig {
        manifestPlaceholders["usesCleartextTraffic"] = "false"
        applicationId = "com.taif.app"
        minSdk = 29
        targetSdk = 34
        versionCode = tauriProperties.getProperty("tauri.android.versionCode", "1").toInt()
        versionName = tauriProperties.getProperty("tauri.android.versionName", "1.0")
    }
    androidResources {
        // Keep the model uncompressed so it can be read quickly.
        noCompress += "onnx"
    }
    packaging {
        // ffmpeg / ffprobe are executables shipped as native libraries; they must
        // be extracted to the native library directory to be launched.
        jniLibs {
            useLegacyPackaging = true
        }
    }
    signingConfigs {
        if (signingProps.containsKey("storeFile")) {
            create("taifRelease") {
                storeFile = file(signingProps.getProperty("storeFile"))
                storePassword = signingProps.getProperty("storePassword")
                keyAlias = signingProps.getProperty("keyAlias")
                keyPassword = signingProps.getProperty("keyPassword")
            }
        }
    }
    buildTypes {
        getByName("debug") {
            manifestPlaceholders["usesCleartextTraffic"] = "true"
            isDebuggable = true
            isJniDebuggable = true
            isMinifyEnabled = false
            packaging {                jniLibs.keepDebugSymbols.add("*/arm64-v8a/*.so")
                jniLibs.keepDebugSymbols.add("*/armeabi-v7a/*.so")
                jniLibs.keepDebugSymbols.add("*/x86/*.so")
                jniLibs.keepDebugSymbols.add("*/x86_64/*.so")
            }
        }
        getByName("release") {
            // No code shrinking: R8 would strip the JavaScript bridge and the
            // reflection-based audio / download libraries.
            isMinifyEnabled = false
            signingConfigs.findByName("taifRelease")?.let { signingConfig = it }
        }
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
    buildFeatures {
        buildConfig = true
    }
}

rust {
    rootDirRel = "../../../"
}

dependencies {
    implementation("androidx.webkit:webkit:1.6.1")
    implementation("androidx.activity:activity-ktx:1.8.2")
    implementation("androidx.core:core-splashscreen:1.0.1")
    implementation("com.microsoft.onnxruntime:onnxruntime-android:1.22.0")
    implementation("io.github.junkfood02.youtubedl-android:library:0.18.1")
    implementation("io.github.junkfood02.youtubedl-android:ffmpeg:0.18.1")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.8.0")
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.4")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.0")
}

apply(from = "tauri.build.gradle.kts")