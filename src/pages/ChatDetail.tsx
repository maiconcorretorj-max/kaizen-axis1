import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Paperclip, Mic, Image as ImageIcon, Video, FileText, Camera, X, MoreVertical, Phone, Plus, Loader2, Download, SwitchCamera, Circle, Square } from 'lucide-react';
import { MOCK_USERS, MOCK_MESSAGES, Message, User } from '@/data/chat';
import { motion, AnimatePresence } from 'motion/react';
import { sendMessageToKai } from '@/services/kaiAgent';
import ReactMarkdown from 'react-markdown';

export default function ChatDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fullscreen Media State
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string, type: string, name?: string } | null>(null);

  // Media Preview State (before sending)
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: Message['type'], file: File } | null>(null);

  // Audio Recording State
  const [audioVolumes, setAudioVolumes] = useState<number[]>(Array(15).fill(10));
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Camera State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  // File inputs refs
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const foundUser = MOCK_USERS.find(u => u.id === id);
    if (foundUser) {
      setUser(foundUser);
      setMessages(MOCK_MESSAGES[foundUser.id] || []);
    }
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    return () => {
      // Cleanup audio context on unmount
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      stopCamera();
    };
  }, []);

  const handleSendMessage = async (text: string = inputValue, type: Message['type'] = 'text', mediaUrl?: string, fileName?: string) => {
    if ((!text && !mediaUrl) || !user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'me',
      text,
      type,
      mediaUrl,
      fileName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setShowAttachments(false);

    // KAI Agent Logic
    if (user.id === 'kai-agent' && type === 'text' && text) {
      setIsTyping(true);

      // Prepare history for AI
      const history = messages.map(m => ({
        role: m.isMe ? 'user' : 'assistant' as 'user' | 'assistant',
        content: m.text || ''
      }));

      try {
        const responseText = await sendMessageToKai(text, history);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          senderId: 'kai-agent',
          text: responseText,
          type: 'text',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false
        };

        setMessages(prev => [...prev, aiMessage]);
      } catch (error) {
        console.error("Error getting AI response", error);
      } finally {
        setIsTyping(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: Message['type']) => {
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
      setIsTyping(true);
      setTimeout(() => {
        handleSendMessage(inputValue, mediaPreview.type, mediaPreview.url, mediaPreview.file.name);
        setMediaPreview(null);
        setIsTyping(false);
      }, 1000);
    }
  };

  const cancelMediaPreview = () => {
    setMediaPreview(null);
  };

  // --- Camera Logic ---
  const startCamera = async (facingMode = cameraFacingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true // Request audio for video recording
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera. Verifique as permissões.");
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setIsRecordingVideo(false);
  };

  const toggleCameraFacingMode = () => {
    const newMode = cameraFacingMode === 'user' ? 'environment' : 'user';
    setCameraFacingMode(newMode);
    startCamera(newMode);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const url = URL.createObjectURL(file);
            setMediaPreview({ url, type: 'image', file });
            stopCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const startVideoRecording = () => {
    if (streamRef.current) {
      videoChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(streamRef.current);
      videoRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const file = new File([blob], `video_${Date.now()}.webm`, { type: 'video/webm' });
        const url = URL.createObjectURL(file);
        setMediaPreview({ url, type: 'video', file });
        stopCamera();
      };

      mediaRecorder.start();
      setIsRecordingVideo(true);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  // --- Audio Logic ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        handleSendMessage(undefined, 'audio', audioUrl);

        stream.getTracks().forEach(track => track.stop());

        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 64;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaves = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        const step = Math.floor(bufferLength / 15);
        const newVolumes = [];
        for (let i = 0; i < 15; i++) {
          const value = dataArray[i * step];
          const height = Math.max(10, (value / 255) * 100);
          newVolumes.push(height);
        }

        setAudioVolumes(newVolumes);
        animationFrameRef.current = requestAnimationFrame(updateWaves);
      };

      updateWaves();
      mediaRecorder.start();
      setIsRecording(true);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Não foi possível acessar o microfone. Verifique as permissões.");
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.onstop = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioVolumes(Array(15).fill(10));
    }
  };

  const handleDownload = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!user) return <div className="p-6">Carregando...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] dark:bg-[#0b141a]">
      {/* Header */}
      <div className="bg-card-bg px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-text-secondary hover:text-text-primary">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card-bg ${user.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-sm">{user.name}</h3>
              <p className="text-xs text-text-secondary">
                {isTyping ? 'Digitando...' : (user.status === 'online' ? 'Online' : 'Visto por último hoje às 10:00')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-gold-600 dark:text-gold-400">
          <Phone size={20} />
          <MoreVertical size={20} />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-[#0b141a]">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] rounded-lg p-3 shadow-sm relative ${msg.isMe
                ? 'bg-[#D9FDD3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none'
                : 'bg-surface-100 dark:bg-[#202c33] text-gray-900 dark:text-white rounded-tl-none'
              }`}>

              {msg.type === 'image' && msg.mediaUrl && (
                <div className="mb-2 cursor-pointer" onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'image', name: msg.fileName })}>
                  <img src={msg.mediaUrl} alt="Enviada" className="rounded-lg max-h-60 w-full object-cover" />
                </div>
              )}

              {msg.type === 'video' && msg.mediaUrl && (
                <div className="mb-2 cursor-pointer" onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'video', name: msg.fileName })}>
                  <video src={msg.mediaUrl} className="rounded-lg max-h-60 w-full" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center text-white">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                </div>
              )}

              {msg.type === 'audio' && (
                <div className="flex items-center gap-2 min-w-[200px] py-1 mb-1">
                  <div className="w-10 h-10 rounded-full bg-gold-500 text-white flex items-center justify-center flex-shrink-0">
                    <Mic size={20} />
                  </div>
                  {msg.mediaUrl && msg.mediaUrl !== 'mock-audio-url' ? (
                    <audio src={msg.mediaUrl} controls className="h-10 w-full" />
                  ) : (
                    <div className="h-1 flex-1 bg-gray-300 dark:bg-gray-500 rounded-full" />
                  )}
                </div>
              )}

              {msg.type === 'document' && msg.mediaUrl && (
                <div
                  className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-3 rounded-lg mb-2 cursor-pointer hover:bg-black/10 transition-colors"
                  onClick={() => setFullscreenMedia({ url: msg.mediaUrl!, type: 'document', name: msg.fileName })}
                >
                  <FileText size={24} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm truncate max-w-[150px] font-medium">{msg.fileName || 'Documento'}</span>
                </div>
              )}

              {msg.text && (
                <div className="text-sm leading-relaxed markdown-body">
                  {msg.senderId === 'kai-agent' ? (
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
              )}

              <span className="text-[10px] text-gray-500 dark:text-gray-400 block text-right mt-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none p-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-card-bg p-2 flex items-end gap-2 sticky bottom-0 z-20 pb-safe">
        <AnimatePresence>
          {showAttachments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-16 left-4 bg-card-bg rounded-xl shadow-xl p-4 grid grid-cols-2 gap-4 border border-surface-200 mb-2"
            >
              <button onClick={() => docInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center text-white shadow-lg">
                  <FileText size={20} />
                </div>
                <span className="text-xs font-medium text-text-secondary">Doc</span>
              </button>
              <button onClick={() => imageInputRef.current?.click()} className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg">
                  <ImageIcon size={20} />
                </div>
                <span className="text-xs font-medium text-text-secondary">Galeria</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hidden Inputs */}
        <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => handleFileUpload(e, 'document')} />
        <input type="file" ref={imageInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            handleFileUpload(e, type);
          }
        }} />

        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className="p-3 text-text-secondary hover:text-text-primary transition-colors"
        >
          {showAttachments ? <X size={24} /> : <Plus size={24} />}
        </button>

        {isRecording ? (
          <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-2xl px-4 py-2 flex items-center justify-between overflow-hidden relative">
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
              <Mic size={18} />
              <span className="text-sm font-medium">Gravando...</span>
            </div>

            {/* Real Audio Waves */}
            <div className="flex items-center gap-[2px] h-6 flex-1 justify-center px-4">
              {audioVolumes.map((vol, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-400 rounded-full transition-all duration-75"
                  style={{ height: `${vol}%` }}
                />
              ))}
            </div>

            <button
              onClick={cancelRecording}
              className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 p-1 rounded-full transition-colors z-10"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex-1 bg-surface-50 dark:bg-surface-200 rounded-2xl px-4 py-2 flex items-center">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Mensagem"
              className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
            />
            <button className="text-text-secondary hover:text-text-primary ml-2">
              <Camera size={20} onClick={() => startCamera()} />
            </button>
          </div>
        )}

        <button
          onClick={inputValue ? () => handleSendMessage() : (isRecording ? stopRecordingAndSend : startRecording)}
          className={`p-3 rounded-full shadow-md transition-all ${inputValue
              ? 'bg-gold-500 text-white'
              : isRecording
                ? 'bg-red-500 text-white'
                : 'bg-gold-500 text-white'
            }`}
        >
          {inputValue || isRecording ? <Send size={20} /> : <Mic size={20} />}
        </button>
      </div>

      {/* Custom Camera Modal */}
      <AnimatePresence>
        {isCameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
              <button onClick={stopCamera} className="text-white p-2 rounded-full hover:bg-white/20">
                <X size={28} />
              </button>
              <button onClick={toggleCameraFacingMode} className="text-white p-2 rounded-full hover:bg-white/20">
                <SwitchCamera size={28} />
              </button>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={!isRecordingVideo} // Mute while previewing to avoid feedback, unmute if we want to hear during recording (though usually not needed for preview)
                className="w-full h-full object-cover"
              />
              {isRecordingVideo && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  <div className="w-2 h-2 bg-white rounded-full" /> Gravando
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-12 bg-gradient-to-t from-black/80 to-transparent">
              {/* Take Photo Button */}
              <button
                onClick={takePhoto}
                disabled={isRecordingVideo}
                className={`w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95 ${isRecordingVideo ? 'opacity-50' : ''}`}
              >
                <div className="w-12 h-12 bg-white rounded-full" />
              </button>

              {/* Record Video Button */}
              <button
                onClick={isRecordingVideo ? stopVideoRecording : startVideoRecording}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95"
              >
                {isRecordingVideo ? (
                  <Square size={24} className="text-red-500 fill-red-500" />
                ) : (
                  <Circle size={24} className="text-red-500 fill-red-500" />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {mediaPreview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-[60] bg-black/95 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={cancelMediaPreview} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
              <span className="text-sm font-medium">Pré-visualização</span>
              <div className="w-10"></div> {/* Spacer for centering */}
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {mediaPreview.type === 'image' && (
                <img src={mediaPreview.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              {mediaPreview.type === 'video' && (
                <video src={mediaPreview.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
              )}
              {mediaPreview.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium text-center">{mediaPreview.file.name}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-black/50 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmSendMedia()}
                placeholder="Adicionar uma legenda..."
                className="flex-1 bg-white/10 text-white placeholder:text-white/50 border-none outline-none rounded-full px-4 py-3"
              />
              <button
                onClick={confirmSendMedia}
                className="bg-gold-500 text-white p-3 rounded-full shadow-lg hover:bg-gold-600 transition-colors flex items-center justify-center flex-shrink-0"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Media Viewer */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 text-white">
              <button onClick={() => setFullscreenMedia(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={24} />
              </button>
              <span className="text-sm font-medium truncate max-w-[200px]">{fullscreenMedia.name || 'Mídia'}</span>
              <button
                onClick={() => handleDownload(fullscreenMedia.url, fullscreenMedia.name || 'download')}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Download size={24} />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
              {fullscreenMedia.type === 'image' && (
                <img src={fullscreenMedia.url} alt="Fullscreen" className="max-w-full max-h-full object-contain rounded-lg" />
              )}
              {fullscreenMedia.type === 'video' && (
                <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full rounded-lg" />
              )}
              {fullscreenMedia.type === 'document' && (
                <div className="flex flex-col items-center gap-4 text-white">
                  <FileText size={64} className="text-red-500" />
                  <p className="text-lg font-medium text-center">{fullscreenMedia.name}</p>
                  <button
                    onClick={() => handleDownload(fullscreenMedia.url, fullscreenMedia.name || 'documento.pdf')}
                    className="mt-4 px-6 py-3 bg-gold-500 text-white rounded-full font-medium flex items-center gap-2 hover:bg-gold-600 transition-colors"
                  >
                    <Download size={20} /> Baixar Documento
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
