'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Mic, Square, Loader2, AlertCircle, Volume2, Pause, Play } from 'lucide-react';

interface MobileVoiceRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
  maxDuration?: number;
}

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing' | 'preview' | 'error';

export function MobileVoiceRecorder({
  onRecordingComplete,
  maxDuration = 600,
}: MobileVoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);
  const maxDurationReachedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  // Revoke audio URL on change
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Compute waveform heights based on state and audio level
  const waveformHeights = useMemo(() => {
    if (state === 'recording') {
      return Array.from({ length: 20 }, (_, i) => 
        Math.max(4, Math.sin((i / 20) * Math.PI) * audioLevel * 40 + (i % 3) * 2)
      );
    }
    return Array(20).fill(4);
  }, [state, audioLevel]);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      maxDurationReachedRef.current = false;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setState('preview');
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);

      setState('recording');
      setDuration(0);

      // Timer with max duration check
      timerRef.current = setInterval(() => {
        setDuration((d) => {
          const newDuration = d + 1;
          if (newDuration >= maxDuration && !maxDurationReachedRef.current) {
            maxDurationReachedRef.current = true;
            // Stop recording via setTimeout to avoid state update during render
            setTimeout(() => {
              if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
                setState('processing');
                cleanup();
                setAudioLevel(0);
              }
            }, 0);
          }
          return newDuration;
        });
      }, 1000);

      updateAudioLevel();
    } catch (err) {
      console.error('Error starting recording:', err);
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.');
      } else {
        setError('No se pudo acceder al micrófono. Verifica los permisos.');
      }
      setState('error');
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    setAudioLevel(average / 255);

    if (mediaRecorderRef.current?.state === 'recording') {
      requestAnimationFrame(updateAudioLevel);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (state === 'recording' || state === 'paused')) {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
    cleanup();
    setAudioLevel(0);
  };

  const confirmRecording = () => {
    if (audioBlobRef.current) {
      onRecordingComplete(audioBlobRef.current);
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    audioBlobRef.current = null;
    setDuration(0);
    setState('idle');
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMainAction = () => {
    if (state === 'idle' || state === 'error') {
      startRecording();
    } else if (state === 'recording') {
      stopRecording();
    }
  };

  return (
    <div className="flex flex-col items-center">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {state !== 'preview' ? (
        <div className="w-full max-w-sm">
          {/* Waveform Visualization */}
          <div className="flex items-center justify-center gap-1 h-16 mb-6">
            {waveformHeights.map((height, i) => (
              <div
                key={i}
                className={`w-1.5 rounded-full transition-all duration-75 ${
                  state === 'recording' ? 'bg-red-500' : 'bg-gray-300'
                }`}
                style={{ height: `${height}px` }}
              />
            ))}
          </div>

          {/* Timer */}
          <div className="text-center mb-6">
            <span className={`text-4xl font-mono font-bold ${
              state === 'recording' ? 'text-red-600' : 'text-gray-400'
            }`}>
              {formatDuration(duration)}
            </span>
            {state === 'recording' && (
              <p className="text-sm text-gray-500 mt-1">
                Máximo: {formatDuration(maxDuration)}
              </p>
            )}
          </div>

          {/* Main Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleMainAction}
              disabled={state === 'processing'}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                state === 'idle' || state === 'error'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : state === 'recording'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'bg-gray-300 text-gray-500'
              }`}
            >
              {state === 'recording' && (
                <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-25" />
              )}
              
              {state === 'idle' && <Mic className="h-10 w-10" />}
              {state === 'recording' && <Square className="h-8 w-8" />}
              {state === 'processing' && <Loader2 className="h-10 w-10 animate-spin" />}
              {state === 'error' && <AlertCircle className="h-10 w-10" />}
            </button>
          </div>

          {/* Status Text */}
          <div className="text-center">
            {state === 'idle' && (
              <p className="text-gray-600">Toca para comenzar a grabar</p>
            )}
            {state === 'recording' && (
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-red-600 font-medium">Grabando...</p>
              </div>
            )}
            {state === 'processing' && (
              <p className="text-gray-600">Procesando audio...</p>
            )}
            {state === 'error' && error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}
          </div>

          {/* Tips */}
          {state === 'recording' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                <Volume2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Consejos para mejor calidad:</p>
                  <ul className="space-y-1 text-blue-700">
                    <li>• Habla claro y a ritmo normal</li>
                    <li>• Mantén el dispositivo cerca</li>
                    <li>• Evita ruido de fondo</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Preview Interface */
        <div className="w-full max-w-sm">
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">Vista previa</span>
              <span className="text-sm text-gray-500">{formatDuration(duration)}</span>
            </div>

            <div className="flex justify-center mb-4">
              <button
                onClick={togglePlayback}
                className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6 ml-1" />
                )}
              </button>
            </div>

            <p className="text-center text-sm text-gray-500">
              {isPlaying ? 'Reproduciendo...' : 'Toca para escuchar'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={discardRecording}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Descartar
            </button>
            <button
              onClick={confirmRecording}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Usar grabación
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
