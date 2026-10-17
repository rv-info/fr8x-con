const { execSync } = require('child_process');
const JAR = 'C:\\Program Files\\Microsoft\\jdk-17.0.20.101-hotspot\\bin\\jar.exe';
const APK = 'D:\\fr8x-con\\fr8x-android-app\\dist\\FR8X-Android-Universal-Release.apk';
const list = execSync(`"${JAR}" tf "${APK}"`).toString().split('\n');
console.log('Resource entries in APK:');
list.filter(x => x.includes('mipmap') || x.includes('launcher') || x.includes('drawable') || x.includes('stat')).forEach(x => console.log(' - ' + x.trim()));
