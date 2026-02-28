import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Volume2, MessageCircleQuestion, Loader2 } from 'lucide-react'
import type { AIResponse } from '../types/ai.types'
import { useAIStore } from '../store/useAIStore'

interface Props {
    /** The Explain-mode response to read aloud */
    explainResponse: AIResponse | null
    /** Current topic context for doubt resolution */
    topicContext: {
        topicId: string
        topicName: string
        subjectName: string
        moduleName: string
        syllabusContext?: string
    } | null
    personaId: string
    personaModifier?: string
}

type PlaybackState = 'idle' | 'playing' | 'paused'

export default function VoiceTeacher({ explainResponse, topicContext, personaId, personaModifier }: Props) {
    const [playbackState, setPlaybackState] = useState<PlaybackState>('idle')
    const [speed, setSpeed] = useState(1.0)
    const [doubtText, setDoubtText] = useState('')
    const [isAskingDoubt, setIsAskingDoubt] = useState(false)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const { generateExplanation, isLoading, response: doubtResponse } = useAIStore()

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel()
        }
    }, [])

    const getTextToRead = useCallback((): string => {
        if (!explainResponse) return ''
        // Combine explanation sections into readable text, stripping markdown bold markers
        const parts = [
            explainResponse.explanation,
            explainResponse.analogy ? `\nAnalogy: ${explainResponse.analogy}` : '',
            explainResponse.example ? `\nExample: ${explainResponse.example}` : '',
        ]
        return parts
            .join('\n')
            .replace(/\*\*/g, '')     // strip bold markers
            .replace(/#{1,6}\s/g, '') // strip heading markers
            .replace(/```[\s\S]*?```/g, '[code block omitted]') // skip code blocks
            .trim()
    }, [explainResponse])

    const handlePlay = useCallback(() => {
        if (playbackState === 'paused') {
            window.speechSynthesis.resume()
            setPlaybackState('playing')
            return
        }

        const text = getTextToRead()
        if (!text) return

        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = speed
        utterance.onend = () => setPlaybackState('idle')
        utterance.onerror = () => setPlaybackState('idle')
        utteranceRef.current = utterance
        window.speechSynthesis.speak(utterance)
        setPlaybackState('playing')
    }, [playbackState, speed, getTextToRead])

    const handlePause = useCallback(() => {
        window.speechSynthesis.pause()
        setPlaybackState('paused')
    }, [])

    const handleStop = useCallback(() => {
        window.speechSynthesis.cancel()
        setPlaybackState('idle')
    }, [])

    const handleSpeedChange = useCallback((newSpeed: number) => {
        setSpeed(newSpeed)
        // If currently speaking, restart with new speed
        if (playbackState === 'playing') {
            window.speechSynthesis.cancel()
            const text = getTextToRead()
            if (!text) return
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = newSpeed
            utterance.onend = () => setPlaybackState('idle')
            utterance.onerror = () => setPlaybackState('idle')
            utteranceRef.current = utterance
            window.speechSynthesis.speak(utterance)
        }
    }, [playbackState, getTextToRead])

    const handleAskDoubt = useCallback(async () => {
        if (!doubtText.trim() || !topicContext) return
        setIsAskingDoubt(true)
        try {
            await generateExplanation({
                topicId: topicContext.topicId,
                topicName: `${topicContext.topicName} — Quick Doubt: ${doubtText.trim()}`,
                subjectName: topicContext.subjectName,
                moduleName: topicContext.moduleName,
                personaId,
                personaModifier: `${personaModifier || ''}\n\nIMPORTANT: Answer this doubt in 3-5 short sentences maximum. Be direct and concise.`.trim(),
                mode: 'explain',
                syllabusContext: topicContext.syllabusContext,
            })
            setDoubtText('')
        } finally {
            setIsAskingDoubt(false)
        }
    }, [doubtText, topicContext, personaId, personaModifier, generateExplanation])

    const speedOptions = [0.8, 0.9, 1.0, 1.1, 1.25]

    if (!explainResponse) {
        return (
            <div className="glass-card p-8 text-center">
                <Volume2 className="w-12 h-12 text-hils-text-dim mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-hils-text mb-2">Voice Teacher</h3>
                <p className="text-sm text-hils-text-muted mb-4 max-w-md mx-auto">
                    First generate an explanation in the <strong>Explanation</strong> tab, then come back here to listen to it read aloud.
                </p>
            </div>
        )
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-5"
        >
            {/* Playback Controls Card */}
            <div className="glass-card p-6 border border-hils-border">
                <div className="flex items-center gap-2 mb-5">
                    <div className="p-1.5 rounded-lg bg-emerald-400/10">
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">
                        Voice Teacher
                    </h3>
                </div>

                {/* Playback Buttons */}
                <div className="flex items-center gap-3 mb-5">
                    {playbackState === 'playing' ? (
                        <button
                            onClick={handlePause}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all text-sm font-medium"
                        >
                            <Pause className="w-4 h-4" />
                            Pause
                        </button>
                    ) : (
                        <button
                            onClick={handlePlay}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                        >
                            <Play className="w-4 h-4" />
                            {playbackState === 'paused' ? 'Resume' : 'Play'}
                        </button>
                    )}

                    <button
                        onClick={handleStop}
                        disabled={playbackState === 'idle'}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Square className="w-4 h-4" />
                        Stop
                    </button>

                    {/* Status indicator */}
                    {playbackState !== 'idle' && (
                        <span className="text-xs text-hils-text-muted ml-2">
                            {playbackState === 'playing' ? '● Speaking...' : '❚❚ Paused'}
                        </span>
                    )}
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-3">
                    <span className="text-xs text-hils-text-muted font-medium">Speed:</span>
                    <div className="flex items-center gap-1.5">
                        {speedOptions.map((s) => (
                            <button
                                key={s}
                                onClick={() => handleSpeedChange(s)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all
                                    ${speed === s
                                        ? 'bg-white/10 border border-white/20 text-white'
                                        : 'text-hils-text-muted hover:bg-white/[0.04] hover:text-hils-text'
                                    }`}
                            >
                                {s}x
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ask a Doubt Section */}
            <div className="glass-card p-6 border border-hils-border">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 rounded-lg bg-blue-400/10">
                        <MessageCircleQuestion className="w-4 h-4 text-blue-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                        Quick Doubt
                    </h3>
                </div>
                <p className="text-xs text-hils-text-muted mb-3">
                    Ask a short question about this topic. The answer will be brief and to the point.
                </p>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={doubtText}
                        onChange={(e) => setDoubtText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskDoubt()}
                        placeholder="Type your doubt..."
                        className="flex-1 bg-white/[0.04] border border-hils-border rounded-lg px-3 py-2 text-sm text-hils-text placeholder-hils-text-dim focus:outline-none focus:border-white/20"
                    />
                    <button
                        onClick={handleAskDoubt}
                        disabled={!doubtText.trim() || isAskingDoubt || isLoading}
                        className="px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isAskingDoubt ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Thinking...
                            </>
                        ) : (
                            'Ask'
                        )}
                    </button>
                </div>
            </div>

            {/* Show doubt response if it exists and was generated */}
            {doubtResponse && !isAskingDoubt && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card p-5 border border-blue-400/20"
                >
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 rounded-lg bg-blue-400/10">
                            <MessageCircleQuestion className="w-4 h-4 text-blue-400" />
                        </div>
                        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                            Answer
                        </h3>
                    </div>
                    <div className="text-hils-text text-sm leading-relaxed whitespace-pre-wrap">
                        {doubtResponse.explanation}
                    </div>
                </motion.div>
            )}
        </motion.div>
    )
}
