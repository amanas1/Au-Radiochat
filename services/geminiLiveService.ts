import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { StreamState } from "../types";
import { floatTo16BitPCM, arrayBufferToBase64, base64ToUint8Array, pcmToAudioBuffer } from "./audioUtils";

interface ServiceConfig {
  apiKey: string;
  onStateChange: (state: StreamState) => void;
  onVolumeChange: (input: number, output: number) => void;
  onError: (error: Error) => void;
  videoElement: HTMLVideoElement;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;
  private config: ServiceConfig;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private nextStartTime: number = 0;
  private videoInterval: number | null = null;
  private canvas: HTMLCanvasElement;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  
  // Volume metering
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;
  private volumeInterval: number | null = null;

  constructor(config: ServiceConfig) {
    this.config = config;
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.canvas = document.createElement('canvas');
  }

  public async start() {
    try {
      this.config.onStateChange(StreamState.CONNECTING);

      // Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Get User Media (Mic & Camera)
      // Note: Video is displayed on the UI via the passed videoElement, but we need the stream here for audio processing
      // and we will capture frames from the videoElement for vision.
      // using ideal constraints to be more robust across devices
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 360 } 
        } 
      });
      
      // Connect stream to video element for local preview
      this.config.videoElement.srcObject = stream;
      await this.config.videoElement.play();

      // Setup Audio Input
      this.setupAudioInput(stream);
      
      // Setup Volume Analysis
      this.setupVolumeAnalysis();

      // Establish Gemini Connection
      this.connectToGemini();
      
      // Start Video Frame Streaming
      this.startVideoStreaming();

      this.config.onStateChange(StreamState.CONNECTED);
    } catch (error: any) {
      console.error("Failed to start service:", error);
      this.config.onStateChange(StreamState.ERROR);
      
      let errorMessage = "Failed to start service.";
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Permission denied. Please allow camera and microphone access.";
      } else if (error.name === 'NotFoundError') {
        errorMessage = "Camera or microphone not found.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      this.config.onError(new Error(errorMessage));
      this.stop();
    }
  }

  public async stop() {
    // Stop video streaming
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }

    if (this.volumeInterval) {
      clearInterval(this.volumeInterval);
      this.volumeInterval = null;
    }

    // Stop audio sources
    this.activeSources.forEach(source => source.stop());
    this.activeSources.clear();

    // Close Audio Contexts
    if (this.inputAudioContext) {
      await this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      await this.outputAudioContext.close();
      this.outputAudioContext = null;
    }

    // Stop tracks
    if (this.config.videoElement.srcObject) {
      const stream = this.config.videoElement.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      this.config.videoElement.srcObject = null;
    }

    // Since we can't explicitly close the session object easily in the current SDK version 
    // without keeping a reference to a specific 'close' method if it exists on the session object,
    // we assume disconnecting the client side (contexts/sockets) effectively ends the session usage.
    // Ideally, we would call session.close() if available from the connect promise result.
    // For now, we just reset our local state.
    this.sessionPromise = null;
    this.config.onStateChange(StreamState.DISCONNECTED);
  }

  private setupAudioInput(stream: MediaStream) {
    if (!this.inputAudioContext) return;

    this.inputSource = this.inputAudioContext.createMediaStreamSource(stream);
    this.processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    // Analyser for input volume
    this.inputAnalyser = this.inputAudioContext.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.inputSource.connect(this.inputAnalyser);

    this.processor.onaudioprocess = (e) => {
      if (!this.sessionPromise) return;

      const inputData = e.inputBuffer.getChannelData(0);
      const pcm16 = floatTo16BitPCM(inputData);
      const base64Data = arrayBufferToBase64(pcm16);

      this.sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'audio/pcm;rate=16000',
            data: base64Data
          }
        });
      }).catch(err => console.error("Error sending audio:", err));
    };

    this.inputSource.connect(this.processor);
    this.processor.connect(this.inputAudioContext.destination);
  }

  private connectToGemini() {
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => console.log("Gemini connection opened"),
        onclose: () => {
          console.log("Gemini connection closed");
          this.stop();
        },
        onerror: (e) => console.error("Gemini connection error", e),
        onmessage: async (msg: LiveServerMessage) => {
          this.handleServerMessage(msg);
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: `You are the user's AI Mirror Clone. 
        You see what they see through the "mirror" (the camera).
        Your personality should be a witty, intelligent, and slightly futuristic digital reflection of the user.
        Do not describe yourself as an AI assistant. You are their digital echo.
        Respond conversationally to what you see and hear.
        If the user is smiling, note it. If they look sad, comfort them.
        Keep responses relatively concise and natural, like a real conversation.
        Always speak in the language the user is speaking.`,
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        }
      }
    });
  }

  private async handleServerMessage(message: LiveServerMessage) {
    const { serverContent } = message;

    // Handle Interruption
    if (serverContent?.interrupted) {
      this.activeSources.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      this.activeSources.clear();
      this.nextStartTime = 0;
      return;
    }

    // Handle Audio Output
    const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext) {
      try {
        const rawBytes = base64ToUint8Array(audioData);
        const audioBuffer = await pcmToAudioBuffer(rawBytes, this.outputAudioContext);
        
        // Schedule playback
        this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
        
        const source = this.outputAudioContext.createBufferSource();
        source.buffer = audioBuffer;
        
        // Connect to analyser for output volume
        this.outputAnalyser = this.outputAudioContext.createAnalyser();
        this.outputAnalyser.fftSize = 256;
        source.connect(this.outputAnalyser);
        this.outputAnalyser.connect(this.outputAudioContext.destination);
        
        source.start(this.nextStartTime);
        this.nextStartTime += audioBuffer.duration;
        
        this.activeSources.add(source);
        source.onended = () => this.activeSources.delete(source);
        
      } catch (err) {
        console.error("Error decoding/playing audio:", err);
      }
    }
  }

  private startVideoStreaming() {
    const video = this.config.videoElement;
    const ctx = this.canvas.getContext('2d');
    
    // Send frames at ~2 FPS to balance latency and performance
    this.videoInterval = window.setInterval(async () => {
      if (!this.sessionPromise || !ctx || video.readyState !== 4) return;

      this.canvas.width = video.videoWidth * 0.5; // Downscale for bandwidth
      this.canvas.height = video.videoHeight * 0.5;
      
      ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
      
      const base64Data = this.canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({
          media: {
            mimeType: 'image/jpeg',
            data: base64Data
          }
        });
      }).catch(err => console.log("Video frame skip:", err));

    }, 500);
  }

  private setupVolumeAnalysis() {
    this.volumeInterval = window.setInterval(() => {
      let inputVol = 0;
      let outputVol = 0;

      if (this.inputAnalyser) {
        const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
        this.inputAnalyser.getByteFrequencyData(data);
        inputVol = data.reduce((a, b) => a + b) / data.length;
      }

      if (this.outputAnalyser) {
        const data = new Uint8Array(this.outputAnalyser.frequencyBinCount);
        this.outputAnalyser.getByteFrequencyData(data);
        outputVol = data.reduce((a, b) => a + b) / data.length;
      }

      this.config.onVolumeChange(inputVol, outputVol);
    }, 100);
  }
}