import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Send, Mic, Image as ImageIcon,
  FileText, Camera, X, MoreVertical, Phone, Plus, Loader2,
  Download, SwitchCamera, Circle, Square, Bot, Play, Pause,
  Maximize, Volume2, VolumeX, PictureInPicture
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessageToKai } from '@/services/kaiAgent';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';

interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  mediaUrl?: string;
  fileName?: string;
  timestamp: string;
  isMe: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isAI?: boolean;
}

// Detect best supported video MIME type for this device/browser
function getSupportedVideoMimeType(): string {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1,mp4a.40.2', // iOS specific
    'video/mp4', // Base iOS fallback
  ];
  for (const type of types) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch { /* ignore */ }
  }
  return ''; // let browser decide
}

// ─── Custom Audio Player with Waveform ──────────────────────────────────────
const AudioMessage = ({ url, isMe }: { url: string; isMe: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const initialized = useRef(false);

  // Initialize canvas static
  useEffect(() => {
    if (!isPlaying) {
      drawStatic();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const drawStatic = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barCount = 30;
    const barWidth = (canvas.width / barCount) - 2;
    ctx.fillStyle = isMe ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)';
    for (let i = 0; i < barCount; i++) {
      const barHeight = 4 + (i % 3 === 0 ? 4 : 0);
      const x = i * (barWidth + 2);
      const y = canvas.height / 2 - barHeight / 2;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (!initialized.current) {
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          ctxRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaElementSource(audioRef.current);
          source.connect(analyser);
          analyser.connect(audioCtx.destination);
          analyserRef.current = analyser;
          initialized.current = true;
        } catch (e) {
          console.warn('AudioContext not supported or failed cross-origin.', e);
        }
      }
      if (ctxRef.current?.state === 'suspended') {
        ctxRef.current.resume();
      }
      audioRef.current.play().catch(console.error);
    }
  };

  const drawVisualizer = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const drawFrame = () => {
      if (!isPlaying) return;
      animationRef.current = requestAnimationFrame(drawFrame);
      analyserRef.current!.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 30;
      const barWidth = (canvas.width / barCount) - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step] || 0;
        const percent = value / 255;
        const barHeight = Math.max(4, percent * canvas.height * 0.8);

        ctx.fillStyle = isMe ? '#ffffff' : '#128C7E';
        ctx.beginPath();
        const x = i * (barWidth + 2);
        const y = canvas.height / 2 - barHeight / 2;
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
    };
    drawFrame();
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  return (
    <div className={`flex items-center gap-3 min-w-[220px] w-full max-w-[280px] py-1`}>
      <button
        onClick={togglePlay}
        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gold-500 text-white hover:bg-gold-600'}`}
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
      </button>

      <div className="flex-1 flex flex-col justify-center relative min-h-[40px]">
        {/* Visualizer Canvas */}
        <canvas
          ref={canvasRef}
          width={150}
          height={24}
          className="w-full h-[24px] pointer-events-none mt-2"
        />

        {/* Seek Input Overlay */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Progress Line (when paused or over visualizer) */}
        {!isPlaying && duration > 0 && (
          <div className="absolute top-1/2 left-0 w-full h-1 -mt-0.5 bg-black/10 rounded-full overflow-hidden pointer-events-none">
            <div
              className={`h-full ${isMe ? 'bg-white' : 'bg-gold-500'}`}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        )}

        <div className="flex justify-between items-center mt-1">
          <span className={`text-[10px] ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
            {isPlaying ? formatTime(currentTime) : formatTime(duration)}
          </span>
          <button
            onClick={toggleSpeed}
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full z-20 relative ${isMe ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={url}
        crossOrigin="anonymous"
        onPlay={() => {
          setIsPlaying(true);
          drawVisualizer();
        }}
        onPause={() => {
          setIsPlaying(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />
    </div>
  );
};


export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, allProfiles, profile } = useApp();

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [isKaiTyping, setIsKaiTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number>(0);
  const [audioVolumes, setAudioVolumes] = useState<number[]>(Array(15).fill(10));

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string; name?: string } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: ChatMessage['type']; file: File } | null>(null);

  const isKAI = id === 'kai-agent';
  const myId = user?.id ?? '';
  const myName = profile?.name || 'Usuário';
  const conversationId = isKAI ? `kai-${myId}` : [myId, id].sort().join('_');

  // ─── Load chat partner ────────────────────────────────────────────────────
  useEffect(() => {
    if (isKAI) {
      setChatUser({ id: 'kai-agent', name: 'KAI — Assistente IA', isAI: true });
      return;
    }
    const found = allProfiles.find(p => p.id === id);
    if (found) {
      setChatUser({
        id: found.id,
        name: found.name,
        avatar: (found as any).avatar_url,
        role: found.role,
      });
    }
  }, [id, allProfiles, isKAI]);

  // ─── Upload to Supabase Storage ───────────────────────────────────────────
  const uploadMedia = async (file: File, type: ChatMessage['type']): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${conversationId}/${Date.now()}_${type}.${ext}`;
    const { error } = await supabase.storage.from('chat-media').upload(path, file);
    if (error) { console.error('Upload error:', error); return null; }
    return supabase.storage.from('chat-media').getPublicUrl(path).data.publicUrl;
  };

  // ─── Load history ─────────────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (isKAI || !myId) return;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*').eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) return;
    setMessages((data ?? []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.content,
      type: m.type as ChatMessage['type'],
      mediaUrl: m.media_url,
      fileName: m.file_name,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: m.sender_id === myId,
    })));
  }, [conversationId, isKAI, myId]);

  // ─── Realtime: postgres_changes (messages) + presence (typing) ────────────
  useEffect(() => {
    if (isKAI || !myId || !id) return;
    loadMessages();

    // Single channel handles BOTH postgres_changes AND presence
    const channel = supabase.channel(`chat:${conversationId}`);

    // Listen for NEW rows in chat_messages for this conversation
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const m = payload.new as any;
        setMessages(prev => {
          // Skip if this is our own optimistically-added message (same content + type within 3s)
          if (m.sender_id === myId) return prev;
          if (prev.find(x => x.id === m.id)) return prev;
          return [...prev, {
            id: m.id,
            senderId: m.sender_id,
            text: m.content,
            type: m.type,
            mediaUrl: m.media_url,
            fileName: m.file_name,
            timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isMe: false,
          }];
        });
      }
    );

    // Presence for typing indicator
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ name: string; isTyping: boolean }>();
      const others = Object.values(state)
        .flat()
        .filter((p: any) => p.userId !== myId);
      const typing = others.find((p: any) => p.isTyping);
      setTypingUser(typing ? (typing as any).name : null);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track our presence
        await channel.track({ userId: myId, name: myName, isTyping: false });
      }
    });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId, isKAI, myId, id, loadMessages, myName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isKaiTyping, typingUser]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      audioContextRef.current?.close();
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      stopCamera();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  // ─── Typing presence broadcast ────────────────────────────────────────────
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (isKAI) return;

    // Update presence with isTyping = true
    const allChannels = supabase.getChannels();
    const ch = allChannels.find(c => c.topic === `realtime:chat:${conversationId}`);
    ch?.track({ userId: myId, name: myName, isTyping: true });

    // Reset typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      ch?.track({ userId: myId, name: myName, isTyping: false });
    }, 2000);
  };

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSendMessage = async (
    text: string = inputValue,
    type: ChatMessage['type'] = 'text',
    file?: File,
    fileName?: string,
    existingUrl?: string,
  ) => {
    if (!text && !file && !existingUrl) return;

    // Prevent sending empty or corrupted files (0 bytes)
    if (file && file.size === 0) {
      alert('Ocorreu um erro ao processar o arquivo (tamanho 0 bytes). Tente novamente.');
      return;
    }

    if (!chatUser) return;
    setInputValue('');
    setShowAttachments(false);

    // Upload media to storage
    let mediaUrl = existingUrl;
    if (file) {
      setIsUploading(true);
      mediaUrl = (await uploadMedia(file, type)) ?? undefined;
      setIsUploading(false);
      if (!mediaUrl && !isKAI) {
        alert('Falha ao enviar o arquivo. Tente novamente.');
        return;
      }
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = `temp_${Date.now()}`;

    // Optimistic local update
    setMessages(prev => [...prev, {
      id: tempId,
      senderId: myId,
      text: text || undefined,
      type,
      mediaUrl,
      fileName: fileName || file?.name,
      timestamp,
      isMe: true,
    }]);

    // KAI Agent (not persisted)
    if (isKAI && type === 'text' && text) {
      setIsKaiTyping(true);
      const history = messages.map(m => ({
        role: m.isMe ? 'user' : 'assistant' as 'user' | 'assistant',
        content: m.text || '',
      }));
      const responseText = await sendMessageToKai(text, history);
      setIsKaiTyping(false);
      setMessages(prev => [...prev, {
        id: `kai_${Date.now()}`, senderId: 'kai-agent',
        text: responseText, type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      }]);
      return;
    }
    if (isKAI) return;

    // Persist to Supabase (postgres_changes will notify receiver)
    const { error } = await supabase.from('chat_messages').insert({
      sender_id: myId,
      receiver_id: id,
      conversation_id: conversationId,
      content: text || null,
      type,
      media_url: mediaUrl || null,
      file_name: fileName || file?.name || null,
    });

    if (error) console.error('Insert error:', error);

    // Stop typing indicator
    const allChannels = supabase.getChannels();
    const ch = allChannels.find(c => c.topic === `realtime:chat:${conversationId}`);
    ch?.track({ userId: myId, name: myName, isTyping: false });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: ChatMessage['type']) => {
    const file = e.target.files?.[0];
    if (file) {
      setShowAttachments(false);
      setMediaPreview({ url: URL.createObjectURL(file), type, file });
      e.target.value = '';
    }
  };

  const confirmSendMedia = () => {
    if (!mediaPreview) return;
    handleSendMessage(inputValue || '', mediaPreview.type, mediaPreview.file, mediaPreview.file.name);
    setMediaPreview(null);
  };

  // ─── Camera ───────────────────────────────────────────────────────────────
  const startCamera = async (facingMode = cameraFacingMode) => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch {
      alert('Não foi possível acessar a câmera. Verifique as permissões.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setIsCameraOpen(false);
    setIsRecordingVideo(false);
  };

  const takePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setMediaPreview({ url: URL.createObjectURL(file), type: 'image', file });
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    videoChunksRef.current = [];
    const mimeType = getSupportedVideoMimeType();
    let recorder: MediaRecorder;

    try {
      // iOS Safari is very strict: if we pass an unsupported MIME type it throws.
      // If we pass NO MIME type, it defaults to a proprietary mp4 format.
      recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);
    } catch (err) {
      console.warn('Failed to start MediaRecorder with mimeType, falling back:', err);
      try {
        recorder = new MediaRecorder(streamRef.current);
      } catch (fallbackErr) {
        alert('Gravação de vídeo não suportada neste dispositivo (' + (fallbackErr as Error).message + ').');
        return;
      }
    }

    videoRecorderRef.current = recorder;
    recorder.ondataavailable = e => {
      if (e.data && e.data.size > 0) {
        videoChunksRef.current.push(e.data);
      }
    };
    recorder.onstop = () => {
      if (videoChunksRef.current.length === 0) {
        alert('Erro ao gravar vídeo: nenhum dado capturado pelo dispositivo.');
        stopCamera();
        return;
      }

      // On iOS Safari, the resulting blob is often video/mp4 even if we didn't specify it
      const actualMimeType = videoChunksRef.current[0]?.type || mimeType || 'video/mp4';
      const cleanMimeType = actualMimeType.split(';')[0];
      const blob = new Blob(videoChunksRef.current, { type: cleanMimeType });

      const ext = cleanMimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `video_${Date.now()}.${ext}`, { type: cleanMimeType });
      setMediaPreview({ url: URL.createObjectURL(file), type: 'video', file });
      stopCamera();
    };

    // Start recording, collecting 1000ms chunks (better for mobile memory than 100ms)
    recorder.start(1000);
    setIsRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current?.state === 'recording') {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // ─── Audio ────────────────────────────────────────────────────────────────
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = (() => {
        try {
          if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4';
        } catch { /* ignore */ }
        try {
          if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm';
        } catch { /* ignore */ }
        return '';
      })();

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const actualMimeType = audioChunksRef.current[0]?.type || mimeType || 'audio/mp4';
        const cleanMimeType = actualMimeType.split(';')[0];
        const ext = cleanMimeType.includes('mp4') || cleanMimeType.includes('aac') ? 'm4a' : 'webm';
        const blob = new Blob(audioChunksRef.current, { type: cleanMimeType });
        const file = new File([blob], `audio_${Date.now()}.${ext}`, { type: cleanMimeType });
        stream.getTracks().forEach(t => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
        await handleSendMessage('', 'audio', file, file.name);
      };
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyser.fftSize = 64;
      const arr = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyserRef.current?.getByteFrequencyData(arr);
        const step = Math.floor(arr.length / 15);
        setAudioVolumes(Array.from({ length: 15 }, (_, i) => Math.max(10, (arr[i * step] / 255) * 100)));
        animFrameRef.current = requestAnimationFrame(update);
      };
      update();
      recorder.start();
      setIsRecording(true);
    } catch { alert('Não foi possível acessar o microfone.'); }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        audioContextRef.current?.close();
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioVolumes(Array(15).fill(10));
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (!chatUser) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="animate-spin text-gold-500" size={32} />
    </div>
  );

  const initials = chatUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const isTypingVisible = typingUser || isKaiTyping;
  const typingLabel = isKaiTyping ? 'KAI está digitando...' : typingUser ? `${typingUser} está digitando...` : '';

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#0b141a]">
      {/* Header */}
      <div className="bg-card-bg px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              {chatUser.isAI ? (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                  <Bot className="text-white" size={20} />
                </div>
              ) : chatUser.avatar ? (
                <img src={chatUser.avatar} alt={chatUser.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {initials}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-bg bg-green-500" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">{chatUser.name}</h3>
              <p className="text-xs min-h-[16px]">
                {isTypingVisible ? (
                  <span className="text-green-500 font-medium animate-pulse">{typingLabel}</span>
                ) : (
                  <span className="text-text-secondary">
                    {chatUser.isAI ? 'IA • Especialista Imobiliário' : chatUser.role || 'Online'}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-gold-600 dark:text-gold-400">
          {!isKAI && <Phone size={20} />}
          <MoreVertical size={20} />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#ECE5DD] dark:bg-[#0b141a]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            {isKAI ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-4 shadow-lg">
                  <Bot className="text-white" size={40} />
                </div>
                <p className="font-semibold text-text-primary">Olá! Sou o KAI 👋</p>
                <p className="text-sm mt-1 max-w-xs text-text-secondary opacity-70">Me conte sobre um cliente e vou analisar o perfil de financiamento.</p>
              </>
            ) : (
              <p className="text-sm text-text-secondary opacity-60">Nenhuma mensagem. Diga olá! 👋</p>
            )}
          </div>
        )}

        {messages.map(msg => {
          const isMediaOnly = ['image', 'video'].includes(msg.type) && !msg.text;
          return (
            <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] relative shadow-sm ${msg.isMe
                ? 'bg-[#D9FDD3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-2xl rounded-tr-none'
                : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-2xl rounded-tl-none'
                } ${isMediaOnly ? 'p-1 pb-6' : 'p-3'}`}>

                {msg.type === 'image' && msg.mediaUrl && (
                  <div className={`${!isMediaOnly ? 'mb-2' : ''} cursor-pointer`} onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'image', name: msg.fileName })}>
                    <img src={msg.mediaUrl} alt="" className={`${isMediaOnly ? 'rounded-xl' : 'rounded-lg'} max-h-72 w-full object-cover`} />
                  </div>
                )}
                {msg.type === 'video' && msg.mediaUrl && (
                  <div className={`${!isMediaOnly ? 'mb-2' : ''}`}>
                    <video src={msg.mediaUrl} controls className={`${isMediaOnly ? 'rounded-xl' : 'rounded-lg'} max-h-72 w-full`} playsInline />
                  </div>
                )}
                {msg.type === 'audio' && msg.mediaUrl && (
                  <AudioMessage url={msg.mediaUrl} isMe={msg.isMe} />
                )}
                {msg.type === 'document' && msg.mediaUrl && (
                  <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-3 rounded-xl mb-2 cursor-pointer"
                    onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'document', name: msg.fileName })}>
                    <FileText size={24} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm truncate max-w-[150px] font-medium">{msg.fileName || 'Documento'}</span>
                  </div>
                )}
                {msg.text && (
                  <div className={`text-sm leading-relaxed ${['image', 'video'].includes(msg.type) ? 'px-1 pt-1' : ''}`}>
                    {msg.senderId === 'kai-agent'
                      ? <ReactMarkdown>{msg.text}</ReactMarkdown>
                      : msg.text}
                  </div>
                )}
                <span className={`text-[10px] block text-right mt-1 ${isMediaOnly
                  ? 'absolute bottom-1.5 right-2 text-white/95 drop-shadow-md bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm'
                  : msg.isMe ? 'text-green-800/80 dark:text-white/60' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          )
        })}

        {isTypingVisible && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
              <span className="text-xs text-text-secondary ml-1">{typingLabel}</span>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="flex justify-end">
            <div className="bg-[#D9FDD3] rounded-lg p-3 flex items-center gap-2 text-sm text-gray-600">
              <Loader2 size={16} className="animate-spin" /> Enviando arquivo...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card-bg p-2 flex items-end gap-2 sticky bottom-0 z-20 pb-safe relative">
        <AnimatePresence>
          {showAttachments && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-4 bg-card-bg rounded-xl shadow-xl p-4 grid grid-cols-2 gap-4 border border-surface-200 z-30">
              <button onClick={() => docInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg"><FileText size={20} /></div>
                <span className="text-xs font-medium text-text-secondary">Arquivo</span>
              </button>
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg"><ImageIcon size={20} /></div>
                <span className="text-xs font-medium text-text-secondary">Galeria</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={e => handleFileUpload(e, 'document')} />
        <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={e => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(e, file.type.startsWith('video/') ? 'video' : 'image');
        }} />

        <button onClick={() => setShowAttachments(!showAttachments)} className="p-3 text-text-secondary hover:text-text-primary">
          {showAttachments ? <X size={24} /> : <Plus size={24} />}
        </button>

        {isRecording ? (
          <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
              <Mic size={18} /><span className="text-sm font-medium">Gravando...</span>
            </div>
            <div className="flex items-center gap-[2px] h-6 flex-1 justify-center px-4">
              {audioVolumes.map((vol, i) => (
                <div key={i} className="w-1 bg-red-400 rounded-full transition-all duration-75" style={{ height: `${vol}%` }} />
              ))}
            </div>
            <button onClick={cancelRecording} className="text-red-500 p-1 rounded-full"><X size={18} /></button>
          </div>
        ) : (
          <div className="flex-1 bg-surface-50 dark:bg-surface-200 rounded-2xl px-4 py-2 flex items-center">
            <input
              value={inputValue}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Mensagem"
              className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
            />
            {!isKAI && (
              <button className="text-text-secondary hover:text-text-primary ml-2" onClick={() => startCamera()}>
                <Camera size={20} />
              </button>
            )}
          </div>
        )}

        <button
          onClick={inputValue ? () => handleSendMessage() : (isRecording ? stopRecordingAndSend : startRecording)}
          className="p-3 rounded-full shadow-md bg-gold-500 text-white"
        >
          {inputValue || isRecording ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
              <button onClick={stopCamera} className="text-white p-2 rounded-full hover:bg-white/20"><X size={28} /></button>
              <button onClick={() => { const m = cameraFacingMode === 'user' ? 'environment' : 'user'; setCameraFacingMode(m); startCamera(m); }}
                className="text-white p-2 rounded-full hover:bg-white/20"><SwitchCamera size={28} /></button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted={!isRecordingVideo} className="w-full h-full object-cover" />
              {isRecordingVideo && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" /> Gravando
                </div>
              )}
            </div>
            {/* Buttons - pushed up well above tab bar */}
            <div className="absolute bottom-0 left-0 right-0 pt-12 pb-28 flex justify-center gap-16 bg-gradient-to-t from-black/90 to-transparent">
              <div className="flex flex-col items-center gap-2">
                <button onClick={takePhoto} disabled={isRecordingVideo}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50">
                  <div className="w-12 h-12 bg-white rounded-full" />
                </button>
                <span className="text-white text-xs font-medium">Foto</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                  className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                  {isRecordingVideo
                    ? <Square size={28} className="text-red-500 fill-red-500" />
                    : <Circle size={28} className="text-red-500 fill-red-500" />}
                </button>
                <span className="text-white text-xs font-medium">{isRecordingVideo ? 'Parar' : 'Vídeo'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[250] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setMediaPreview(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <span className="text-sm font-medium">Pré-visualização</span>
              <div className="w-10" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {mediaPreview.type === 'image' && (
                <img src={mediaPreview.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              {mediaPreview.type === 'video' && (
                <video src={mediaPreview.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-lg" />
              )}
              {mediaPreview.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium text-center">{mediaPreview.file.name}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-black/60 flex items-center gap-2">
              <input value={inputValue} onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmSendMedia()}
                placeholder="Adicionar legenda..."
                className="flex-1 bg-white/10 text-white placeholder:text-white/50 border-none outline-none rounded-full px-4 py-3" />
              <button onClick={confirmSendMedia}
                className="bg-gold-500 text-white p-3 rounded-full flex items-center justify-center">
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Media */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setFullscreenMedia(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <span className="text-sm font-medium truncate max-w-[200px]">{fullscreenMedia.name || 'Mídia'}</span>
              <button onClick={() => handleDownload(fullscreenMedia.url, fullscreenMedia.name || 'download')}
                className="p-2 hover:bg-white/10 rounded-full"><Download size={24} /></button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {fullscreenMedia.type === 'image' && <img src={fullscreenMedia.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />}
              {fullscreenMedia.type === 'video' && <video src={fullscreenMedia.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-lg" />}
              {fullscreenMedia.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium">{fullscreenMedia.name}</p>
                  <button onClick={() => handleDownload(fullscreenMedia.url, fullscreenMedia.name || 'doc.pdf')}
                    className="px-6 py-3 bg-gold-500 text-white rounded-full font-medium flex items-center gap-2">
                    <Download size={20} /> Baixar
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
