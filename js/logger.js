// Logger 工具：统一管理控制台输出
const Logger = (() => {
  const isDevelopment = window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1' ||
                       window.location.protocol === 'file:'

  return {
    log: (...args) => {
      if (isDevelopment) console.log('[Binbim]', ...args)
    },
    warn: (...args) => {
      if (isDevelopment) console.warn('[Binbim]', ...args)
      else console.warn(...args) // 始终显示警告
    },
    error: (...args) => {
      console.error('[Binbim]', ...args) // 始终显示错误
    }
  }
})()
