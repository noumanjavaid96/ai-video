
export interface TranscriptEntry {
  id: number;
  speaker: string;
  text: string;
  timestamp: string;
}

export interface Insights {
  summary: string;
  actionItems: string[];
  talkingPoints: string[];
}
