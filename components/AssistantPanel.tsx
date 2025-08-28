
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getInsightsFromTranscript } from '../services/geminiService';
import { TranscriptEntry, Insights } from '../types';
import { SummaryIcon, ActionItemIcon, TalkingPointIcon, LoadingSpinner, MicrophoneIcon, RecordIcon } from './icons';

const TabButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors duration-200 ${
            active ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
    >
        {children}
    </button>
);

const InsightsDisplay = ({ insights, isLoading }: { insights: Insights | null, isLoading: boolean }) => {
    const [activeTab, setActiveTab] = useState<'summary' | 'actions' | 'talkingPoints'>('summary');
    
    if (isLoading && !insights) {
        return (
            <div className="flex items-center justify-center h-48 bg-gray-800 rounded-lg">
                <LoadingSpinner />
                <span className="ml-3 text-gray-300">Generating initial insights...</span>
            </div>
        );
    }
    
    if (!insights) {
        return <div className="text-center text-gray-400 py-10 bg-gray-800 rounded-lg">No insights available. Start listening to the conversation.</div>;
    }

    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                    AI Assistant
                    {isLoading && <span className="ml-2"><LoadingSpinner /></span>}
                </h3>
                <div className="flex space-x-1">
                    <TabButton active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>Summary</TabButton>
                    <TabButton active={activeTab === 'actions'} onClick={() => setActiveTab('actions')}>Actions</TabButton>
                    <TabButton active={activeTab === 'talkingPoints'} onClick={() => setActiveTab('talkingPoints')}>Talk</TabButton>
                </div>
            </div>
            
            <div className="mt-4 min-h-[150px] text-gray-200">
                {activeTab === 'summary' && (
                    <div className="space-y-2 animate-fade-in">
                        <h4 className="font-semibold text-white flex items-center"><SummaryIcon />Summary</h4>
                        <p className="text-gray-300">{insights.summary}</p>
                    </div>
                )}
                {activeTab === 'actions' && (
                     <div className="space-y-2 animate-fade-in">
                        <h4 className="font-semibold text-white flex items-center"><ActionItemIcon />Action Items</h4>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                            {insights.actionItems.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                )}
                {activeTab === 'talkingPoints' && (
                    <div className="space-y-2 animate-fade-in">
                        <h4 className="font-semibold text-white flex items-center"><TalkingPointIcon />Talking Points</h4>
                        <ul className="list-disc list-inside text-gray-300 space-y-1 pl-2">
                            {insights.talkingPoints.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

const TranscriptDisplay = ({ transcript, currentUtterance }: { transcript: TranscriptEntry[], currentUtterance: string }) => {
    const endOfTranscriptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfTranscriptRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript, currentUtterance]);
    
    if (transcript.length === 0 && !currentUtterance) {
        return (
            <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                <div>
                    <MicrophoneIcon className="h-12 w-12 mx-auto mb-2" />
                    <p>Click "Start Listening" to begin transcribing.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="overflow-y-auto h-full pr-2 custom-scrollbar">
            {transcript.map(entry => (
                <div key={entry.id} className="mb-3">
                    <p className="font-bold text-blue-400 text-sm">{entry.speaker} <span className="text-gray-500 font-normal text-xs">{entry.timestamp}</span></p>
                    <p className="text-gray-300 leading-snug">{entry.text}</p>
                </div>
            ))}
            {currentUtterance && (
                <div className="mb-3">
                     <p className="font-bold text-blue-400 text-sm">Me <span className="text-gray-500 font-normal text-xs">now</span></p>
                     <p className="text-gray-300 leading-snug opacity-70 italic">{currentUtterance}</p>
                </div>
            )}
            <div ref={endOfTranscriptRef} />
        </div>
    );
};

export const AssistantPanel = () => {
    const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
    const [insights, setInsights] = useState<Insights | null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentUtterance, setCurrentUtterance] = useState('');
    const [transcriptionSupported, setTranscriptionSupported] = useState(true);

    const recognitionRef = useRef<any>(null);
    const transcribingRef = useRef(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setTranscriptionSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            if (!transcribingRef.current) return;

            let interim_transcript = '';
            let final_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            setCurrentUtterance(interim_transcript);

            if (final_transcript) {
                const now = new Date();
                const newEntry: TranscriptEntry = {
                    id: Date.now(),
                    speaker: 'Me',
                    text: final_transcript.trim(),
                    timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                };
                setTranscript(prev => [...prev, newEntry]);
                setCurrentUtterance('');
            }
        };
        
        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            transcribingRef.current = false;
            setIsTranscribing(false);
        };

        recognition.onend = () => {
            if (transcribingRef.current) {
                try {
                     recognition.start();
                } catch(e) {
                    console.error("Error restarting recognition:", e);
                    transcribingRef.current = false;
                    setIsTranscribing(false);
                }
            }
        };
        
        return () => {
            transcribingRef.current = false;
            recognitionRef.current?.stop();
        };
    }, []);

    const handleToggleTranscription = () => {
        if (!transcriptionSupported || !recognitionRef.current) return;

        const shouldBeTranscribing = !isTranscribing;
        transcribingRef.current = shouldBeTranscribing;
        setIsTranscribing(shouldBeTranscribing);

        if (shouldBeTranscribing) {
            setTranscript([]);
            setInsights(null);
            setCurrentUtterance('');
            try {
                recognitionRef.current.start();
            } catch (error) {
                console.error("Could not start speech recognition:", error);
                transcribingRef.current = false;
                setIsTranscribing(false);
            }
        } else {
            recognitionRef.current.stop();
        }
    };

    const fetchInsights = useCallback(async (currentTranscript: TranscriptEntry[]) => {
        if (currentTranscript.length === 0) return;
        
        setIsGenerating(true);
        const transcriptText = currentTranscript.map(e => `${e.speaker}: ${e.text}`).join('\n');
        const newInsights = await getInsightsFromTranscript(transcriptText);
        if (newInsights) {
            setInsights(newInsights);
        }
        setIsGenerating(false);
    }, []);

    useEffect(() => {
        if (transcript.length > 0) {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                fetchInsights(transcript);
            }, 2500);
        }
        return () => {
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
        };
    }, [transcript, fetchInsights]);

    return (
        <div className="bg-gray-900 text-white p-4 h-full flex flex-col space-y-4">
            <InsightsDisplay insights={insights} isLoading={isGenerating} />
            <div className="bg-gray-800 p-4 rounded-lg flex-grow flex flex-col shadow-lg min-h-0">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Live Transcript</h3>
                    {transcriptionSupported ? (
                        <button
                            onClick={handleToggleTranscription}
                            aria-label={isTranscribing ? "Stop listening" : "Start listening"}
                            className={`flex items-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 ${
                                isTranscribing ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {isTranscribing ? <RecordIcon className="h-4 w-4 mr-2 animate-pulse" /> : <MicrophoneIcon className="h-4 w-4 mr-2" />}
                            {isTranscribing ? 'Listening...' : 'Start Listening'}
                        </button>
                    ) : (
                         <span className="text-sm text-yellow-500 bg-yellow-900/50 px-3 py-1.5 rounded-md">
                            Speech recognition not supported
                        </span>
                    )}
                </div>
                <TranscriptDisplay transcript={transcript} currentUtterance={currentUtterance} />
            </div>
        </div>
    );
};
