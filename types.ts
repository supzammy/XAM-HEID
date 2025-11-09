export enum Disease {
  HeartDisease = 'Heart Disease',
  Diabetes = 'Diabetes',
  Cancer = 'Cancer',
}

export enum Demographic {
  AgeGroup = 'Age',
  Race = 'Race',
  Income = 'Income Level',
}

export interface StateData {
  stateCode: string;
  stateName: string;
  value: number | null; // Null if data is suppressed due to Rule of 11
}

// Represents raw, nested data structure
export interface RawStateData {
    stateCode: string;
    stateName: string;
    diseases: {
        [key in Disease]?: { // Optional to handle cases where a disease might not have data
            demographics: {
                [key in Demographic]: {
                    [key:string]: number | null;
                }
            }
        }
    }
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AnalysisResponse {
    summary: string;
    patterns: { title: string; description: string; }[];
    questions: string[];
}

export interface DashboardStats {
    disparityIndex: string;
    highest: string;
    lowest: string;
    trend: 'up' | 'down' | 'neutral';
}