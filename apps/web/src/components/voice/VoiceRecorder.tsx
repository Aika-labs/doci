'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VoiceRecorderProps {
  onTranscription?: (text: string) => void;
  onRecordingComplete?: (blob: Blob) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  patientId?: string;
  className?: string;
  disabled?: boolean;
  autoProcess?: boolean; // If true, automatically sends to API for transcription
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'error';

export function VoiceRecorder({
  onTranscription,
  onRecordingComplete,
  onRecordingStart,
  onRecordingStop,
  patientId,
  className,
  disabled = false,
  autoProcess = false,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Store callbacks in refs to avoid dependency issues
  const onTranscriptionRef = useRef(onTranscription);
  const onRecordingCompleteRef = useRef(onRecordingComplete);
  const onRecordingStartRef = useRef(onRecordingStart);
  const onRecordingStopRef = useRef(onRecordingStop);
  const patientIdRef = useRef(patientId);
  const autoProcessRef = useRef(autoProcess);

  useEffect(() => {
    onTranscriptionRef.current = onTranscription;
    onRecordingCompleteRef.current = onRecordingComplete;
    onRecordingStartRef.current = onRecordingStart;
    onRecordingStopRef.current = onRecordingStop;
    patientIdRef.current = patientId;
    autoProcessRef.current = autoProcess;
  }, [
    onTranscription,
    onRecordingComplete,
    onRecordingStart,
    onRecordingStop,
    patientId,
    autoProcess,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Audio level visualization effect
  useEffect(() => {
    if (state !== 'recording' || !analyserRef.current) {
      setAudioLevel(0);
      return;
    }

    let frameId: number;

    const updateLevel = () => {
      if (!analyserRef.current) return;

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(average / 255);

      frameId = requestAnimationFrame(updateLevel);
      animationFrameRef.current = frameId;
    };

    updateLevel();

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [state]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Setup audio analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        // Call onRecordingComplete callback with the blob
        onRecordingCompleteRef.current?.(audioBlob);

        // Only auto-process if autoProcess is true
        if (autoProcessRef.current) {
          processAudio(audioBlob);
        } else {
          setState('idle');
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setState('recording');
      setDuration(0);
      onRecordingStartRef.current?.();

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('No se pudo acceder al micrófono. Verifica los permisos.');
      setState('error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'recording') {
      mediaRecorderRef.current.stop();
      setState('processing');
      onRecordingStopRef.current?.();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setAudioLevel(0);
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', 'es');
      if (patientIdRef.current) {
        formData.append('patientId', patientIdRef.current);
      }

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error en la transcripción');
      }

      const data = await response.json();
      onTranscriptionRef.current?.(data.text);
      setState('idle');
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Error al procesar el audio. Intenta de nuevo.');
      setState('error');
    }
  };

  const handleClick = () => {
    if (disabled) return;

    if (state === 'idle' || state === 'error') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Main button */}
      <button
        onClick={handleClick}
        disabled={disabled || state === 'processing'}
        className={cn(
          'relative flex h-16 w-16 items-center justify-center rounded-full transition-all',
          state === 'idle' && 'bg-blue-600 text-white hover:bg-blue-700',
          state === 'recording' && 'bg-red-500 text-white hover:bg-red-600',
          state === 'processing' && 'cursor-wait bg-slate-300 text-slate-500',
          state === 'error' && 'bg-red-100 text-red-600 hover:bg-red-200',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        aria-label={state === 'recording' ? 'Detener grabación' : 'Iniciar grabación'}
      >
        {/* Audio level ring */}
        {state === 'recording' && (
          <div
            className="absolute inset-0 rounded-full border-4 border-red-300 transition-transform"
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              opacity: 0.5 + audioLevel * 0.5,
            }}
          />
        )}

        {/* Icon */}
        {state === 'idle' && <Mic className="h-6 w-6" />}
        {state === 'recording' && <Square className="h-5 w-5" />}
        {state === 'processing' && <Loader2 className="h-6 w-6 animate-spin" />}
        {state === 'error' && <AlertCircle className="h-6 w-6" />}
      </button>

      {/* Status text */}
      <div className="text-center">
        {state === 'idle' && <p className="text-sm text-slate-500">Toca para grabar</p>}
        {state === 'recording' && (
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium text-red-600">Grabando...</p>
            <p className="text-xs text-slate-500">{formatDuration(duration)}</p>
          </div>
        )}
        {state === 'processing' && <p className="text-sm text-slate-500">Procesando audio...</p>}
        {state === 'error' && error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      {/* Recording indicator */}
      {state === 'recording' && (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs text-slate-500">Habla claramente cerca del micrófono</span>
        </div>
      )}
    </div>
  );
}
