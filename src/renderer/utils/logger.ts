// 日志工具类 - 用于记录API日志和组件日志

export interface ApiLog {
  id: string
  timestamp: number
  method: string
  url: string
  level: 'info' | 'error'
  message?: string
  error?: string
  requestBody?: string
  responseBody?: string
}

export interface ComponentLog {
  id: string
  timestamp: number
  component: string
  action: string
  data?: any
}

class Logger {
  private apiLogs: ApiLog[] = []
  private componentLogs: ComponentLog[] = []
  private listeners: Set<() => void> = new Set()

  // 添加API日志
  logApi(log: Omit<ApiLog, 'id' | 'timestamp'>) {
    const newLog: ApiLog = {
      ...log,
      id: `api-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    this.apiLogs.unshift(newLog)
    this.notifyListeners()
  }

  // 添加组件日志
  logComponent(log: Omit<ComponentLog, 'id' | 'timestamp'>) {
    const newLog: ComponentLog = {
      ...log,
      id: `comp-${Date.now()}-${Math.random()}`,
      timestamp: Date.now()
    }
    this.componentLogs.unshift(newLog)
    this.notifyListeners()
  }

  // 获取API日志
  getApiLogs(): ApiLog[] {
    return this.apiLogs
  }

  // 获取组件日志
  getComponentLogs(): ComponentLog[] {
    return this.componentLogs
  }

  // 清空API日志
  clearApiLogs() {
    this.apiLogs = []
    this.notifyListeners()
  }

  // 清空组件日志
  clearComponentLogs() {
    this.componentLogs = []
    this.notifyListeners()
  }

  // 添加监听器
  addListener(listener: () => void) {
    this.listeners.add(listener)
  }

  // 移除监听器
  removeListener(listener: () => void) {
    this.listeners.delete(listener)
  }

  // 通知所有监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

// 导出单例
export const logger = new Logger()
