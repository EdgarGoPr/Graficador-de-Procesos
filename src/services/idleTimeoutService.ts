/**
 * Servicio de Detección de Inactividad y Bloqueo de Sesión (Idle Session Timeout)
 * Diseñado para proteger puestos de trabajo y terminales compartidas.
 */

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutos
const WARNING_TIMEOUT_MS = 28 * 60 * 1000; // 28 minutos (aviso 2 min antes)

export class IdleTimeoutService {
  private static warningTimer: any = null;
  private static lockTimer: any = null;
  private static onWarningCb: ((remainingSeconds: number) => void) | null = null;
  private static onTimeoutCb: (() => void) | null = null;
  private static isInitialized = false;

  public static init(
    onWarning: (remainingSeconds: number) => void,
    onTimeout: () => void
  ): void {
    this.onWarningCb = onWarning;
    this.onTimeoutCb = onTimeout;

    if (!this.isInitialized && typeof window !== 'undefined') {
      const handleActivity = () => this.resetTimers();

      window.addEventListener('mousemove', handleActivity, { passive: true });
      window.addEventListener('keydown', handleActivity, { passive: true });
      window.addEventListener('pointerdown', handleActivity, { passive: true });
      window.addEventListener('scroll', handleActivity, { passive: true });
      window.addEventListener('touchstart', handleActivity, { passive: true });

      this.isInitialized = true;
    }

    this.resetTimers();
  }

  public static resetTimers(): void {
    this.clearTimers();

    // 1. Temporizador de advertencia (a los 28 minutos)
    this.warningTimer = setTimeout(() => {
      if (this.onWarningCb) {
        this.onWarningCb(120); // 120 segundos restantes
      }
    }, WARNING_TIMEOUT_MS);

    // 2. Temporizador de bloqueo final (a los 30 minutos)
    this.lockTimer = setTimeout(() => {
      if (this.onTimeoutCb) {
        this.onTimeoutCb();
      }
    }, IDLE_TIMEOUT_MS);
  }

  public static clearTimers(): void {
    if (this.warningTimer) clearTimeout(this.warningTimer);
    if (this.lockTimer) clearTimeout(this.lockTimer);
  }
}
