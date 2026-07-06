import { execSync } from 'child_process';
import { existsSync, copyFileSync, mkdirSync, writeFileSync, readFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const ANDROID_DIR = join(ROOT, 'android');
const ASSETS_DIR = join(ANDROID_DIR, 'app', 'src', 'main', 'assets');
const HTML_SRC = join(DIST, 'index.html');
const HTML_DST = join(ASSETS_DIR, 'finanzas.html');

const ANDROID_HOME = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || '';
const SDK_DIR = ANDROID_HOME || join(process.env.HOME || '/tmp', '.android', 'sdk');

function log(msg) {
  console.log(`[build-apk] ${msg}`);
}

function run(cmd, opts = {}) {
  console.log(`> ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', cwd: ANDROID_DIR, ...opts });
}

// Step 1: Build
log('Building HTML...');
if (!existsSync(HTML_SRC)) {
  run('npm run build', { cwd: ROOT, shell: true });
} else {
  log('dist/index.html already exists, skipping build (delete dist/ to force rebuild)');
}

// Step 2: Copy HTML to assets
log('Copying HTML to Android assets...');
mkdirSync(ASSETS_DIR, { recursive: true });
copyFileSync(HTML_SRC, HTML_DST);
log(`Copied to ${HTML_DST}`);

// Step 3: Generate app icon (resize public/icon.png to multiple densities)
log('Generating app icons...');

const iconSrc = join(ROOT, 'public', 'icon.png');

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

for (const [dir, size] of Object.entries(iconSizes)) {
  const outDir = join(ANDROID_DIR, 'app', 'src', 'main', 'res', dir);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'ic_launcher.png');
  execSync(`convert "${iconSrc}" -resize ${size}x${size} "${outPath}"`);
}
log('Icons generated.');

// Step 4: Setup Gradle wrapper
log('Setting up Gradle wrapper...');
const gradlewPath = join(ANDROID_DIR, 'gradlew');
const wrapperJarPath = join(ANDROID_DIR, 'gradle', 'wrapper', 'gradle-wrapper.jar');

if (!existsSync(gradlewPath)) {
  log('Downloading Gradle wrapper...');
  const wrapperUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.7.0/gradlew';
  const wrapperBatUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.7.0/gradlew.bat';
  const jarUrl = 'https://raw.githubusercontent.com/gradle/gradle/v8.7.0/gradle/wrapper/gradle-wrapper.jar';

  run(`curl -sSL "${jarUrl}" -o "${wrapperJarPath}"`, { cwd: ROOT });
  run(`curl -sSL "${wrapperUrl}" -o "${gradlewPath}"`, { cwd: ROOT });
  run(`curl -sSL "${wrapperBatUrl}" -o "${join(ANDROID_DIR, 'gradlew.bat')}"`, { cwd: ROOT });
  chmodSync(gradlewPath, 0o755);

  const props = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
  writeFileSync(join(ANDROID_DIR, 'gradle', 'wrapper', 'gradle-wrapper.properties'), props);
  log('Gradle wrapper downloaded.');
} else {
  log('Gradle wrapper already exists.');
}

// Always update wrapper properties to ensure correct version
const props = `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`;
writeFileSync(join(ANDROID_DIR, 'gradle', 'wrapper', 'gradle-wrapper.properties'), props);

// Step 5: Setup Android SDK
log('Setting up Android SDK...');
const localPropsPath = join(ANDROID_DIR, 'local.properties');

if (!existsSync(localPropsPath)) {
  const props = `sdk.dir=${SDK_DIR.replace(/\\/g, '\\\\')}\n`;
  writeFileSync(localPropsPath, props);
  log(`local.properties created: sdk.dir=${SDK_DIR}`);
}

if (!existsSync(join(SDK_DIR, 'platforms', 'android-34'))) {
  log('Android SDK platform 34 not found. Attempting to install via sdkmanager...');
  const cmdlineToolsDir = join(SDK_DIR, 'cmdline-tools', 'latest', 'bin');
  const sdkManagerPath = join(cmdlineToolsDir, 'sdkmanager');

  if (!existsSync(sdkManagerPath)) {
    log('Downloading Android command line tools...');
    const zipPath = join('/tmp', 'cmdline-tools.zip');
    run(`curl -sSL "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip" -o "${zipPath}"`, { cwd: ROOT });
    run(`rm -rf /tmp/cmdline-tools-tmp && mkdir -p /tmp/cmdline-tools-tmp`, { cwd: ROOT });
    run(`unzip -qo "${zipPath}" -d "/tmp/cmdline-tools-tmp"`, { cwd: ROOT });
    run(`mkdir -p "${SDK_DIR}/cmdline-tools/latest"`, { cwd: ROOT });
    run(`mv /tmp/cmdline-tools-tmp/cmdline-tools/* "${SDK_DIR}/cmdline-tools/latest/"`, { cwd: ROOT });
    run(`rm -rf /tmp/cmdline-tools-tmp "${zipPath}"`, { cwd: ROOT });
    chmodSync(sdkManagerPath, 0o755);
  }

  log('Accepting SDK licenses...');
  run(`yes | "${sdkManagerPath}" --licenses --sdk_root="${SDK_DIR}"`, { cwd: ROOT, shell: true });
  log('Installing Android SDK platform 34 and build tools...');
  run(`yes | "${sdkManagerPath}" --install "platforms;android-34" "build-tools;34.0.0" --sdk_root="${SDK_DIR}"`, { cwd: ROOT, shell: true });
  log('Android SDK installed.');
} else {
  log('Android SDK platform 34 already installed.');
}

// Step 6: Build APK
log('Building APK...');
run(`${gradlewPath} assembleDebug --no-daemon`, { cwd: ANDROID_DIR });

// Step 7: Copy APK to dist
const apkSrc = join(ANDROID_DIR, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const apkDst = join(ROOT, 'dist', 'finanzas.apk');
if (existsSync(apkSrc)) {
  copyFileSync(apkSrc, apkDst);
  const size = (readFileSync(apkDst).length / 1024 / 1024).toFixed(2);
  log(`APK created: ${apkDst} (${size} MB)`);
  log('Done!');
} else {
  console.error('ERROR: APK not found at expected path:', apkSrc);
  process.exit(1);
}
