/**
 * 跨平台文件下载服务
 * Web/Electron: 使用 <a> 标签触发浏览器下载
 * Capacitor: 使用 Filesystem API 写入原生存储
 */

import { isCapacitor } from '../renderer/bridge/platform'

/**
 * 下载文件到本地
 * @param url 文件 URL
 * @param filename 保存的文件名
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  if (isCapacitor()) {
    // Capacitor 路径：使用 Filesystem API
    const { Filesystem, Directory } = await import('@capacitor/filesystem')

    // 下载文件内容
    const response = await fetch(url)
    const blob = await response.blob()

    // 转换为 base64
    const reader = new FileReader()
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string
        // 移除 data:image/jpeg;base64, 前缀
        const base64 = result.split(',')[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })

    // 写入 Documents 目录
    await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents
    })
  } else {
    // Web/Electron 路径：使用 <a> 标签下载
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
  }
}
