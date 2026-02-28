import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    ArrowLeft, ArrowRight, BookOpen, Brain, FileText,
    Telescope, CheckCircle2, Loader2, AlertTriangle,
    Volume2, Zap
} from 'lucide-react'
import { vtuSyllabus } from '@/shared/data/vtuSyllabus'
import { useAIStore } from '@/mcps/ai-engine/store/useAIStore'
import { usePersonaStore } from '@/mcps/persona/store/usePersonaStore'
import { useProgressStore } from '@/mcps/progress/store/useProgressStore'
import ExplanationRenderer from '@/mcps/ai-engine/components/ExplanationRenderer'
import PlannerRenderer from '@/mcps/ai-engine/components/PlannerRenderer'
import VoiceTeacher from '@/mcps/ai-engine/components/VoiceTeacher'
import PersonaSelector from '@/mcps/persona/components/PersonaSelector'
import { FEATURE_FLAGS } from '@/shared/config/featureFlags'
import type { LearningMode } from '@/mcps/ai-engine/types/ai.types'

// ─── Tab Configuration ───

const newModeOptions: { mode: LearningMode; label: string; icon: typeof BookOpen }[] = [
    { mode: 'planner', label: 'Planner', icon: BookOpen },
    { mode: 'explain_v2', label: 'Explanation', icon: BookOpen },
    { mode: 'exam_answer', label: 'Exam Answer', icon: FileText },
    { mode: 'rapid_revision', label: 'Rapid Revision', icon: Zap },
    { mode: 'voice_teacher', label: 'Voice Teacher', icon: Volume2 },
]

const legacyModeOptions: { mode: LearningMode; label: string; icon: typeof BookOpen }[] = [
    { mode: 'deep-dive', label: 'Deep Dive', icon: Telescope },
    { mode: 'quiz', label: 'Quiz', icon: Brain },
    { mode: 'summary', label: 'Summary', icon: FileText },
]

export default function TopicPage() {
    const { topicId } = useParams<{ topicId: string }>()
    const navigate = useNavigate()

    const { activeMode, setMode, isLoading, error, setTopic, generateExplanation, responseCache } = useAIStore()
    const { activePersona } = usePersonaStore()
    const { isTopicCompleted, markComplete } = useProgressStore()

    // Build mode options based on feature flag
    const modeOptions = useMemo(() => {
        if (FEATURE_FLAGS.showLegacyTabs) {
            return [...newModeOptions, ...legacyModeOptions]
        }
        return newModeOptions
    }, [])

    // Find topic in VTU syllabus tree (branches → semesters → subjects → modules → topics)
    const topicContext = useMemo(() => {
        for (const branch of vtuSyllabus.branches) {
            for (const semester of branch.semesters) {
                for (const subject of semester.subjects) {
                    for (const mod of subject.modules) {
                        const topicIndex = mod.topics.findIndex((t) => t.id === topicId)
                        if (topicIndex !== -1) {
                            const topic = mod.topics[topicIndex]!
                            const prevTopic = mod.topics[topicIndex - 1] ?? null
                            const nextTopic = mod.topics[topicIndex + 1] ?? null
                            return {
                                topic,
                                module: mod,
                                subject,
                                semester,
                                prevTopic,
                                nextTopic,
                                totalInModule: mod.topics.length,
                                positionInModule: topicIndex + 1,
                            }
                        }
                    }
                }
            }
        }
        return null
    }, [topicId])

    useEffect(() => {
        if (topicId) {
            setTopic(topicId)
        }
    }, [topicId, setTopic])

    if (!topicContext) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <AlertTriangle className="w-12 h-12 text-hils-warning mb-4" />
                <h2 className="text-xl font-semibold text-hils-text mb-2">Topic not found</h2>
                <p className="text-hils-text-muted mb-6">The topic you're looking for doesn't exist.</p>
                <button onClick={() => navigate('/dashboard')} className="btn-primary">
                    Back to Dashboard
                </button>
            </div>
        )
    }

    const { topic, module: mod, subject, semester, prevTopic, nextTopic, totalInModule, positionInModule } = topicContext
    const completed = isTopicCompleted(topic.id)

    const handleMarkComplete = () => {
        markComplete(topic.id, activeMode, activePersona.id)
    }

    const handleGenerate = () => {
        if (!topicContext) return
        const { topic, subject, module: mod } = topicContext
        generateExplanation({
            topicId: topic.id,
            topicName: topic.name,
            subjectName: subject.name,
            moduleName: mod.name,
            personaId: activePersona.id,
            personaModifier: activePersona.promptModifier,
            mode: activeMode,
            syllabusContext: topic.description,
        })
    }

    // For Voice Teacher: try to get cached explain response
    const currentCacheKey = `${topic.id}:${activeMode}:${activePersona.id}`
    const currentResponse = responseCache[currentCacheKey] ?? null

    // For Voice Teacher: explanation mode is `explain_v2`.
    // Keep legacy `explain` fallback so previously cached results still work.
    const explainV2CacheKey = `${topic.id}:explain_v2:${activePersona.id}`
    const explainLegacyCacheKey = `${topic.id}:explain:${activePersona.id}`
    const cachedExplainResponse = responseCache[explainV2CacheKey] ?? responseCache[explainLegacyCacheKey] ?? null

    const getButtonText = (): string => {
        switch (activeMode) {
            case 'planner': return 'Generate Plan'
            case 'explain_v2': return 'Generate Explanation'
            case 'quiz': return 'Generate Quiz'
            case 'summary': return 'Generate Summary'
            case 'deep-dive': return 'Generate Deep Dive'
            case 'exam_answer': return 'Generate Exam Answer'
            case 'rapid_revision': return 'Generate Revision Notes'
            case 'voice_teacher': return 'Generate Explanation'
            default: return 'Generate Explanation'
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-6 text-xs text-hils-text-muted overflow-x-auto whitespace-nowrap pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {[
                    { label: vtuSyllabus?.shortName, path: vtuSyllabus?.id ? `/university/${vtuSyllabus.id}` : '' },
                    { label: semester?.number ? `Sem ${semester.number}` : '', path: semester?.number ? `/semester/${semester.number}` : '' },
                    { label: subject?.code, path: subject?.code ? `/subject/${subject.code}` : '' },
                    { label: mod?.name, path: subject?.code && mod?.id ? `/subject/${subject.code}/module/${mod.id}` : '' },
                    { label: topic?.name, path: '', isActive: true }
                ]
                    .filter(seg => seg.label)
                    .map((seg, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-shrink-0">
                            {idx > 0 && <span className="text-hils-text-dim">/</span>}
                            {seg.isActive ? (
                                <span className="font-bold text-hils-accent">
                                    {seg.label}
                                </span>
                            ) : (
                                <button
                                    onClick={() => navigate(seg.path)}
                                    className="hover:text-hils-accent-light transition-colors cursor-pointer"
                                >
                                    {seg.label}
                                </button>
                            )}
                        </div>
                    ))}
            </div>

            {/* Topic Header */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-hils-text mb-2">{topic.name}</h1>
                        {topic.description && (
                            <p className="text-sm text-hils-text-muted">{topic.description}</p>
                        )}
                    </div>
                    {completed && (
                        <span className="flex items-center gap-1.5 text-hils-success text-sm font-medium shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                        </span>
                    )}
                </div>
                {/* Progress within module */}
                <div className="mt-3 flex items-center gap-2 text-xs text-hils-text-dim">
                    <span>Topic {positionInModule} of {totalInModule}</span>
                    <div className="flex-1 max-w-[120px] h-1 bg-hils-border rounded-full overflow-hidden">
                        <div
                            className="h-full bg-hils-accent rounded-full transition-all"
                            style={{ width: `${(positionInModule / totalInModule) * 100}%` }}
                        />
                    </div>
                </div>
            </motion.div>

            {/* Controls Row */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <PersonaSelector />

                {/* Mode Switcher */}
                <div className="flex items-center bg-hils-surface border border-hils-border rounded-lg p-1">
                    {modeOptions.map(({ mode, label, icon: Icon }) => (
                        <button
                            key={mode}
                            onClick={() => setMode(mode)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all duration-150
                ${activeMode === mode
                                    ? 'bg-transparent border border-[#9ca3af] text-white font-semibold'
                                    : 'bg-transparent border border-transparent text-hils-text-muted hover:bg-white/[0.04] hover:text-hils-text font-medium'
                                }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Response Area */}
            <div className="mb-8">
                {activeMode === 'voice_teacher' ? (
                    /* Voice Teacher mode — dedicated component */
                    <VoiceTeacher
                        explainResponse={cachedExplainResponse}
                        topicContext={topicContext ? {
                            topicId: topic.id,
                            topicName: topic.name,
                            subjectName: subject.name,
                            moduleName: mod.name,
                            syllabusContext: topic.description,
                        } : null}
                        personaId={activePersona.id}
                        personaModifier={activePersona.promptModifier}
                    />
                ) : isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 glass-card">
                        <Loader2 className="w-8 h-8 text-hils-accent animate-spin mb-4" />
                        <p className="text-hils-text-muted text-sm">Generating {activeMode === 'exam_answer' ? 'exam answer' : activeMode === 'rapid_revision' ? 'revision notes' : 'explanation'}...</p>
                        <p className="text-hils-text-dim text-xs mt-1">Using {activePersona.name} persona</p>
                    </div>
                ) : error ? (
                    <div className="glass-card p-6 border border-hils-danger/20">
                        <div className="flex items-center gap-2 text-hils-danger mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="font-medium text-sm">Error</span>
                        </div>
                        <p className="text-sm text-hils-text-muted">{error}</p>
                    </div>
                ) : currentResponse ? (
                    activeMode === 'planner' || activeMode === 'explain_v2' || activeMode === 'exam_answer' ? (
                        <PlannerRenderer response={currentResponse} />
                    ) : (
                        <ExplanationRenderer response={currentResponse} />
                    )
                ) : (
                    <div className="glass-card flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                        <Brain className="w-12 h-12 text-hils-text-dim mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-hils-text mb-2">Ready to learn</h3>
                        <p className="text-sm text-hils-text-muted mb-6 max-w-md mx-auto">
                            Select a learning mode and click Generate to get an AI-powered explanation
                            tailored by <strong>{activePersona.name}</strong>.
                        </p>
                        <button
                            className="btn-primary"
                            disabled={isLoading}
                            onClick={handleGenerate}
                        >
                            {getButtonText()}
                        </button>
                    </div>
                )}
            </div>

            {/* Mark Complete + Navigation */}
            <div className="flex items-center justify-between border-t border-hils-border pt-6">
                <div>
                    {prevTopic ? (
                        <button
                            onClick={() => navigate(`/topic/${prevTopic.id}`)}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            {prevTopic.name}
                        </button>
                    ) : (
                        <div />
                    )}
                </div>

                {!completed && (
                    <button onClick={handleMarkComplete} className="btn-primary flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Mark Complete
                    </button>
                )}

                <div>
                    {nextTopic ? (
                        <button
                            onClick={() => navigate(`/topic/${nextTopic.id}`)}
                            className="btn-secondary flex items-center gap-2 text-sm"
                        >
                            {nextTopic.name}
                            <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                    ) : (
                        <div />
                    )}
                </div>
            </div>
        </div>
    )
}
