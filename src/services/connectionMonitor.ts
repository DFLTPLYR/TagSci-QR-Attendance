class ConnectionMonitor {
  private listeners: ((online: boolean) => void)[] = [];
  private isOnlineState = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnlineState = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnlineState = true;
        this.notifyListeners(true);
      });
      
      window.addEventListener('offline', () => {
        this.isOnlineState = false;
        this.notifyListeners(false);
      });
    }
  }

  getStatus(): boolean {
    return this.isOnlineState;
  }

  addListener(callback: (online: boolean) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (online: boolean) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  private notifyListeners(online: boolean): void {
    this.listeners.forEach(listener => listener(online));
  }
}

export const connectionMonitor = new ConnectionMonitor();
