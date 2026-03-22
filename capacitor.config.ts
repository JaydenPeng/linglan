import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.linglan.app',
  appName: '灵览',
  webDir: 'dist/renderer',
  server: {
    androidScheme: 'https'
  }
}

export default config
