# Gerar o APK (sem Android Studio)

## Opção A — GitHub Actions (recomendado)
1. Suba esta pasta para um repositório no GitHub (branch main).
2. Aba **Actions** → "Build Android APK" → Run workflow (ou só dê push).
3. Ao terminar, baixe o artefato **aethelgard-debug-apk** → `app-debug.apk`.

## Opção B — Local (precisa de JDK 21 + Android SDK command-line tools)
    npm install
    npm run apk:debug
APK em `android/app/build/outputs/apk/debug/app-debug.apk`.

## Login Google nativo (Firebase)
1. Firebase Console → Configurações do projeto → Adicionar app **Android**, pacote `com.remulu.aethelgard`.
2. Registre o SHA-1 (debug: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android`; para o APK do GitHub Actions, use o SHA-1 do keystore que ele gerar — ou assine com seu próprio keystore).
3. Authentication → Sign-in method → ative **Google**.
4. Baixe o `google-services.json` e coloque em `android/app/google-services.json` (commit no repo).
Sem esse arquivo o app compila e roda normalmente, só o login não funciona.
