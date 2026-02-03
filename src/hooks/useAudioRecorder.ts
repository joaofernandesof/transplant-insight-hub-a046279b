/**
 * useAudioRecorder - Hook para gravação de áudio
 * Usa MediaRecorder API para capturar áudio do microfone
 */

import { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingTime: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  cancelRecording: () => void;
  clearRecording: () => void;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  }, [audioUrl]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Limpar gravação anterior
      clearRecording();

      // Solicitar permissão do microfone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      // Criar MediaRecorder com formato compatível
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stopTimer();
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast.error('Erro na gravação de áudio');
        cancelRecording();
      };

      // Iniciar gravação
      mediaRecorder.start(100); // Coletar dados a cada 100ms
      setIsRecording(true);
      startTimer();

      toast.success('Gravação iniciada', { duration: 1500 });
    } catch (error) {
      console.error('Error starting recording:', error);
      
      if ((error as Error).name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada', {
          description: 'Permita o acesso ao microfone nas configurações do navegador.',
        });
      } else if ((error as Error).name === 'NotFoundError') {
        toast.error('Microfone não encontrado', {
          description: 'Conecte um microfone ao seu dispositivo.',
        });
      } else {
        toast.error('Erro ao acessar microfone');
      }
    }
  }, [clearRecording, startTimer, stopTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      // Parar todas as tracks do stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    // Parar gravação sem salvar
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    // Parar stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Limpar estado
    setIsRecording(false);
    stopTimer();
    chunksRef.current = [];
    
    // Limpar blob e URL
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);

    toast.info('Gravação cancelada');
  }, [isRecording, audioUrl, stopTimer]);

  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  };
}

// Função auxiliar para formatar tempo
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
