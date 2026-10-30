/**
 * Servicio de Grabación de Audio Web Nativo para ProcesStudio
 * Utiliza navigator.mediaDevices.getUserMedia y MediaRecorder API
 */

export interface AudioRecordingResult {
  blob: Blob;
  blobUrl: string;
  base64Audio: string;
  durationSeconds: number;
  mimeType: string;
}

class WebAudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private durationInterval: number | null = null;
  private onDurationTick?: (seconds: number) => void;

  public isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  public async startRecording(onTick?: (seconds: number) => void): Promise<boolean> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('El navegador no soporta la API de grabación de audio (getUserMedia).');
    }

    this.onDurationTick = onTick;
    this.audioChunks = [];

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Determinar el MIME type compatible
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4'
      ];
      const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      this.mediaRecorder = selectedMime
        ? new MediaRecorder(this.stream, { mimeType: selectedMime })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.startTime = Date.now();
      this.mediaRecorder.start(250); // Emitir chunks cada 250ms

      if (this.onDurationTick) {
        this.durationInterval = window.setInterval(() => {
          if (this.isRecording()) {
            const elapsed = Math.round((Date.now() - this.startTime) / 1000);
            this.onDurationTick?.(elapsed);
          }
        }, 1000);
      }

      return true;
    } catch (err) {
      console.error('Error al acceder al micrófono:', err);
      this.cleanup();
      throw err;
    }
  }

  public stopRecording(): Promise<AudioRecordingResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No hay una grabación activa para detener.'));
        return;
      }

      const totalDuration = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
      const mimeType = this.mediaRecorder.mimeType || 'audio/webm';

      this.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(this.audioChunks, { type: mimeType });
          const blobUrl = URL.createObjectURL(audioBlob);
          const base64Audio = await this.blobToBase64(audioBlob);

          resolve({
            blob: audioBlob,
            blobUrl,
            base64Audio,
            durationSeconds: totalDuration,
            mimeType
          });
        } catch (error) {
          reject(error);
        } finally {
          this.cleanup();
        }
      };

      this.mediaRecorder.stop();
    });
  }

  public cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Ignorar
      }
    }
    this.cleanup();
  }

  private cleanup(): void {
    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Quitar el prefijo Data URL si existe para obtener solo el payload Base64
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const webAudioRecorder = new WebAudioRecorder();
