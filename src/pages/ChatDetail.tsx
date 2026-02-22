import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Send, Paperclip, Mic, Image as ImageIcon,
  FileText, Camera, X, MoreVertical, Phone, Plus, Loader2,
  Download, SwitchCamera, Circle, Square, Bot
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

export default function ChatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, allProfiles } = useApp();

  const [chatUser, setChatUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const [audioVolumes, setAudioVolumes] = useState<number[]>(Array(15).fill(10));

  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string; name?: string } | null>(null);
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: ChatMessage['type']; file: File } | null>(null);

  // Camera
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const isKAI = id === 'kai-agent';
  const myId = user?.id || 'me';

  // Build conversation ID (sorted pair of user IDs)
  const conversationId = isKAI
    ? `kai-${myId}`
    : [myId, id].sort().join('_');

  // Load chat partner info
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

  // Load messages from Supabase (non-KAI chats only)
  const loadMessages = useCallback(async () => {
    if (isKAI) {
      // KAI messages are session-only (not persisted, to save costs)
      return;
    }
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) { console.error('Error loading messages:', error); return; }

    const mapped: ChatMessage[] = (data || []).map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.content,
      type: m.type as ChatMessage['type'],
      mediaUrl: m.media_url,
      fileName: m.file_name,
      timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: m.sender_id === myId,
    }));
    setMessages(mapped);
  }, [conversationId, isKAI, myId]);

  useEffect(() => {
    loadMessages();

    if (!isKAI && id) {
      // Realtime subscription for new messages
      const channel = supabase
        .channel(`chat_${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const m = payload.new as any;
            if (m.sender_id === myId) return; // Already added optimistically
            setMessages(prev => [...prev, {
              id: m.id,
              senderId: m.sender_id,
              text: m.content,
              type: m.type,
              mediaUrl: m.media_url,
              fileName: m.file_name,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isMe: false,
            }]);
          }
        )
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [conversationId, isKAI, loadMessages, myId, id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current?.state !== 'closed') audioContextRef.current?.close();
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      stopCamera();
    };
  }, []);

  const handleSendMessage = async (
    text: string = inputValue,
    type: ChatMessage['type'] = 'text',
    mediaUrl?: string,
    fileName?: string
  ) => {
    if ((!text && !mediaUrl) || !chatUser) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: myId,
      text,
      type,
      mediaUrl,
      fileName,
      timestamp,
      isMe: true,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');
    setShowAttachments(false);

    // Persist to Supabase (non-KAI only)
    if (!isKAI && type === 'text') {
      await supabase.from('chat_messages').insert({
        sender_id: myId,
        receiver_id: id,
        conversation_id: conversationId,
        content: text,
        type,
        media_url: mediaUrl || null,
        file_name: fileName || null,
      });
    }

    // KAI Agent response
    if (isKAI && type === 'text' && text) {
      setIsTyping(true);
      const history = messages.map(m => ({
        role: m.isMe ? 'user' : 'assistant' as 'user' | 'assistant',
        content: m.text || '',
      }));

      const responseText = await sendMessageToKai(text, history);
      setIsTyping(false);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        senderId: 'kai-agent',
        text: responseText,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false,
      }]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: ChatMessage['type']) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setShowAttachments(false);
      setMediaPreview({ url, type, file });
      e.target.value = '';
    }
  };

  const confirmSendMedia = () => {
    if (mediaPreview) {
      handleSendMessage(inputValue, mediaPreview.type, mediaPreview.url, mediaPreview.file.name);
      setMediaPreview(null);
    }
  };

  // Camera
  const startCamera = async (facingMode = cameraFacingMode) => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode }, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOpen(true);
    } catch (err) {
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
    if (videoRef.current) {
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
    }
  };

  const startVideoRecording = () => {
    if (!streamRef.current) return;
    videoChunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current);
    videoRecorderRef.current = recorder;
    recorder.ondataavailable = e => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
      setMediaPreview({ url: URL.createObjectURL(file), type: 'video', file });
      stopCamera();
    };
    recorder.start();
    setIsRecordingVideo(true);
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current?.state === 'recording') {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // Audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleSendMessage(undefined, 'audio', URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioContextRef.current?.close();
      };

      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      analyser.fftSize = 64;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const update = () => {
        analyserRef.current?.getByteFrequencyData(data);
        const step = Math.floor(data.length / 15);
        setAudioVolumes(Array.from({ length: 15 }, (_, i) => Math.max(10, (data[i * step] / 255) * 100)));
        animationFrameRef.current = requestAnimationFrame(update);
      };
      update();
      recorder.start();
      setIsRecording(true);
    } catch {
      alert('Não foi possível acessar o microfone.');
    }
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
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        audioContextRef.current?.close();
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioVolumes(Array(15).fill(10));
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!chatUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-gold-500" size={32} />
      </div>
    );
  }

  const initials = chatUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

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
              <p className="text-xs text-text-secondary">
                {isTyping ? 'Digitando...' : chatUser.isAI ? 'IA • Especialista Imobiliário' : (chatUser.role || 'Online')}
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
          <div className="flex flex-col items-center justify-center py-16 text-text-secondary text-center">
            {isKAI ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mb-4 shadow-lg">
                  <Bot className="text-white" size={40} />
                </div>
                <p className="font-semibold text-text-primary">Olá! Sou o KAI 👋</p>
                <p className="text-sm mt-1 max-w-xs opacity-70">Especialista em financiamento imobiliário. Me conte sobre um cliente e vou analisar o perfil.</p>
              </>
            ) : (
              <p className="text-sm opacity-60">Nenhuma mensagem ainda. Diga olá!</p>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${msg.isMe
                ? 'bg-[#D9FDD3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none'
                : 'bg-white dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-none'
              }`}>

              {msg.type === 'image' && msg.mediaUrl && (
                <div className="mb-2 cursor-pointer" onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'image', name: msg.fileName })}>
                  <img src={msg.mediaUrl} alt="Enviada" className="rounded-lg max-h-60 w-full object-cover" />
                </div>
              )}

              {msg.type === 'audio' && (
                <div className="flex items-center gap-2 min-w-[200px] py-1 mb-1">
                  <div className="w-10 h-10 rounded-full bg-gold-500 text-white flex items-center justify-center flex-shrink-0">
                    <Mic size={20} />
                  </div>
                  {msg.mediaUrl ? (
                    <audio src={msg.mediaUrl} controls className="h-10 w-full" />
                  ) : (
                    <div className="h-1 flex-1 bg-gray-300 rounded-full" />
                  )}
                </div>
              )}

              {msg.type === 'document' && msg.mediaUrl && (
                <div
                  className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-3 rounded-lg mb-2 cursor-pointer"
                  onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'document', name: msg.fileName })}
                >
                  <FileText size={24} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm truncate max-w-[150px] font-medium">{msg.fileName || 'Documento'}</span>
                </div>
              )}

              {msg.text && (
                <div className="text-sm leading-relaxed">
                  {msg.senderId === 'kai-agent' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : msg.text}
                </div>
              )}

              <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-right mt-1">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none p-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 150, 300].map(d => (
                  <span key={d} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-card-bg p-2 flex items-end gap-2 sticky bottom-0 z-20 pb-safe relative">
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-4 bg-card-bg rounded-xl shadow-xl p-4 grid grid-cols-2 gap-4 border border-surface-200"
            >
              <button onClick={() => docInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg"><FileText size={20} /></div>
                <span className="text-xs font-medium text-text-secondary">Doc</span>
              </button>
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg"><ImageIcon size={20} /></div>
                <span className="text-xs font-medium text-text-secondary">Galeria</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={e => handleFileUpload(e, 'document')} />
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
            <button onClick={cancelRecording} className="text-red-500 hover:bg-red-100 p-1 rounded-full">
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-surface-50 dark:bg-surface-200 rounded-2xl px-4 py-2 flex items-center">
            <input
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Mensagem"
              className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
            />
            {!isKAI && (
              <button className="text-text-secondary hover:text-text-primary ml-2">
                <Camera size={20} onClick={() => startCamera()} />
              </button>
            )}
          </div>
        )}

        <button
          onClick={inputValue ? () => handleSendMessage() : (isRecording ? stopRecordingAndSend : startRecording)}
          className="p-3 rounded-full shadow-md bg-gold-500 text-white transition-all"
        >
          {inputValue || isRecording ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between z-10 bg-gradient-to-b from-black/50 to-transparent">
              <button onClick={stopCamera} className="text-white p-2 rounded-full hover:bg-white/20"><X size={28} /></button>
              <button onClick={() => { const m = cameraFacingMode === 'user' ? 'environment' : 'user'; setCameraFacingMode(m); startCamera(m); }} className="text-white p-2 rounded-full hover:bg-white/20"><SwitchCamera size={28} /></button>
            </div>
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {isRecordingVideo && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" /> Gravando
                </div>
              )}
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-gradient-to-t from-black/80 to-transparent">
              <button onClick={takePhoto} disabled={isRecordingVideo} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center disabled:opacity-50">
                <div className="w-12 h-12 bg-white rounded-full" />
              </button>
              <button onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center">
                {isRecordingVideo ? <Square size={24} className="text-red-500 fill-red-500" /> : <Circle size={24} className="text-red-500 fill-red-500" />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setMediaPreview(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <span className="text-sm font-medium">Pré-visualização</span>
              <div className="w-10" />
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {mediaPreview.type === 'image' && <img src={mediaPreview.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />}
              {mediaPreview.type === 'video' && <video src={mediaPreview.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />}
              {mediaPreview.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium text-center">{mediaPreview.file.name}</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-black/50 flex items-center gap-2">
              <input value={inputValue} onChange={e => setInputValue(e.target.value)} placeholder="Adicionar legenda..."
                className="flex-1 bg-white/10 text-white placeholder:text-white/50 border-none outline-none rounded-full px-4 py-3" />
              <button onClick={confirmSendMedia} className="bg-gold-500 text-white p-3 rounded-full">
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
            className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setFullscreenMedia(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              <span className="text-sm font-medium truncate max-w-[200px]">{fullscreenMedia.name || 'Mídia'}</span>
              <button onClick={() => handleDownload(fullscreenMedia.url, fullscreenMedia.name || 'download')} className="p-2 hover:bg-white/10 rounded-full">
                <Download size={24} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-4">
              {fullscreenMedia.type === 'image' && <img src={fullscreenMedia.url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />}
              {fullscreenMedia.type === 'video' && <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />}
              {fullscreenMedia.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium text-center">{fullscreenMedia.name}</p>
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
