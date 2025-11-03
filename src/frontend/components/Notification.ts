export class Notification {
    static show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration: number = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠' : 'ℹ';
        const bgColor = type === 'success' 
            ? 'linear-gradient(135deg, var(--neon-green), var(--neon-cyan))'
            : type === 'error'
            ? 'linear-gradient(135deg, #ff0066, #ff416c)'
            : type === 'warning'
            ? 'linear-gradient(135deg, var(--neon-yellow), #ff6b35)'
            : 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))';
        
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 2rem;
            background: ${bgColor};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 240, 255, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            min-width: 300px;
            max-width: 500px;
            animation: slideInRight 0.3s ease-out;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            font-size: 0.9375rem;
            font-weight: 500;
            word-wrap: break-word;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 1.5rem; font-weight: bold; flex-shrink: 0;">${icon}</span>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; cursor: pointer; font-size: 1.25rem; padding: 0; margin-left: 0.5rem; opacity: 0.8; transition: opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">×</button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
        
        (window as any).notificationClose = (element: HTMLElement) => {
            element.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (element.parentElement) {
                    element.remove();
                }
            }, 300);
        };
    }
    
    static success(message: string, duration?: number) {
        Notification.show(message, 'success', duration);
    }
    
    static error(message: string, duration?: number) {
        Notification.show(message, 'error', duration);
    }
    
    static info(message: string, duration?: number) {
        Notification.show(message, 'info', duration);
    }
    
    static warning(message: string, duration?: number) {
        Notification.show(message, 'warning', duration);
    }
}

