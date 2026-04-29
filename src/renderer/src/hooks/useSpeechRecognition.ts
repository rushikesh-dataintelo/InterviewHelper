import { useRef, useCallback, useEffect } from 'react'
import { useSpeechStore } from '../stores/speechStore'
import { useSettingsStore } from '../stores/settingsStore'

export function useSpeechRecognition(onTranscript: (text: string) => void) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const whisperIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const shouldListenRef = useRef(false)
  const onTranscriptRef = useRef(onTranscript)
  onTranscriptRef.current = onTranscript

  // Starts a fresh MediaRecorder session, records for ~4s, stops it to produce
  // a complete WebM file (with headers), sends to Whisper, then loops.
  const streamRef = useRef<MediaStream | null>(null)
  const mimeTypeRef = useRef<string>('audio/webm')

  const recordAndTranscribe = useCallback(() => {
    const stream = streamRef.current
    if (!stream || !shouldListenRef.current) return

    const mimeType = mimeTypeRef.current
    const recorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = recorder
    const chunks: Blob[] = []

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = async () => {
      // Build a complete file from this recording session
      const blob = new Blob(chunks, { type: mimeType })

      // Skip tiny recordings (silence)
      if (blob.size < 2000) {
        // Start next cycle
        if (shouldListenRef.current) recordAndTranscribe()
        return
      }

      const buffer = await blob.arrayBuffer()
      const apiKey = useSettingsStore.getState().apiKey

      if (!apiKey) {
        useSpeechStore.getState().setError('API key required for Whisper')
        return
      }

      try {
        const transcript = await window.electronAPI.whisperTranscribe(buffer, apiKey)
        if (transcript && transcript.trim()) {
          onTranscriptRef.current(transcript.trim())
        }
      } catch (err) {
        console.error('Whisper transcription error:', err)
      }

      // Start next cycle
      if (shouldListenRef.current) recordAndTranscribe()
    }

    recorder.start()

    // Stop after 4 seconds to flush a complete file
    whisperIntervalRef.current = setTimeout(() => {
      if (recorder.state === 'recording') {
        recorder.stop()
      }
    }, 4000)
  }, [])

  const startWhisper = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true
        }
      })

      streamRef.current = stream

      mimeTypeRef.current = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4'

      // Kick off the first record cycle
      recordAndTranscribe()

      return true
    } catch (err) {
      console.error('Microphone access error:', err)
      useSpeechStore.getState().setError('Microphone access denied. Check system permissions.')
      return false
    }
  }, [recordAndTranscribe])

  const startListening = useCallback(async () => {
    shouldListenRef.current = true
    const started = await startWhisper()

    if (started) {
      useSpeechStore.getState().setListening(true)
      useSpeechStore.getState().setError(null)
    }
  }, [startWhisper])

  const stopListening = useCallback(() => {
    shouldListenRef.current = false
    useSpeechStore.getState().setListening(false)
    useSpeechStore.getState().setInterimTranscript('')

    // Stop Whisper recording
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      } catch {}
      mediaRecorderRef.current = null
    }

    // Stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    if (whisperIntervalRef.current) {
      clearInterval(whisperIntervalRef.current)
      whisperIntervalRef.current = null
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false
      stopListening()
    }
  }, [stopListening])

  return { startListening, stopListening }
}
