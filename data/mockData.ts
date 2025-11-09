import { RawStateData, Disease, Demographic } from '../types';
import { DISEASES, DEMOGRAPHICS } from '../constants';

const usStates = [
    { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', 'code': 'SD' }, { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' }
];

export const demographicCategories: { [key in Demographic]: string[] } = {
    [Demographic.Race]: ['White', 'Black', 'Hispanic', 'Asian', 'Other'],
    [Demographic.Income]: ['Low', 'Medium', 'High'],
    [Demographic.AgeGroup]: ['0-17', '18-44', '45-64', '65+'],
};

export const availableYears = [2022, 2023, 2024];

const applyRuleOf11 = (value: number): number | null => value < 11 ? null : value;

// A simple pseudo-random generator for deterministic results based on seed
const seededRandom = (seed: number) => {
    let s = seed;
    return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
    };
};

// --- START: More Realistic Data Generation Logic ---

// 1. Define base rates for diseases (arbitrary starting points representing cases per 10k)
const diseaseBaseRates = {
    [Disease.Diabetes]: 60,
    [Disease.HeartDisease]: 75,
    [Disease.Cancer]: 50,
};

// 2. Define regional patterns (e.g., "Sun Belt" for higher chronic disease rates)
const sunBeltStates = ['AL', 'AR', 'FL', 'GA', 'LA', 'MS', 'NC', 'SC', 'TN', 'TX', 'OK', 'WV', 'KY'];
const regionalMultiplier = {
    [Disease.Diabetes]: 1.4,
    [Disease.HeartDisease]: 1.35,
    [Disease.Cancer]: 1.1,
};

// 3. Define state-specific multipliers for anomalies/known trends
const stateMultipliers: { [key: string]: number } = {
    'WV': 1.3, 'KY': 1.25, 'MS': 1.4, 'LA': 1.2, // Higher overall rates
    'CO': 0.7, 'UT': 0.75, 'MN': 0.8, 'CT': 0.85, // Lower overall rates
};

// 4. Define realistic demographic multipliers to simulate disparities
const ageMultipliers = { '0-17': 0.1, '18-44': 0.4, '45-64': 1.3, '65+': 2.5 };
const incomeMultipliers = { 'Low': 1.6, 'Medium': 1.0, 'High': 0.6 };
const raceMultipliers = {
    [Disease.Diabetes]: { 'White': 0.85, 'Black': 1.5, 'Hispanic': 1.4, 'Asian': 1.1, 'Other': 1.0 },
    [Disease.HeartDisease]: { 'White': 0.9, 'Black': 1.6, 'Hispanic': 1.1, 'Asian': 0.8, 'Other': 1.0 },
    [Disease.Cancer]: { 'White': 1.0, 'Black': 1.2, 'Hispanic': 0.9, 'Asian': 0.85, 'Other': 1.0 },
};

// --- END: More Realistic Data Generation Logic ---

export const generateMockData = (): Record<number, RawStateData[]> => {
    const yearlyData: Record<number, RawStateData[]> = {};

    for (const year of availableYears) {
        yearlyData[year] = usStates.map(state => {
            const stateData: RawStateData = {
                stateCode: state.code,
                stateName: state.name,
                diseases: {} as any,
            };

            for (const disease of DISEASES) {
                stateData.diseases[disease] = { demographics: {} as any };
                
                for (const demographic of DEMOGRAPHICS) {
                    stateData.diseases[disease].demographics[demographic] = {};
                    
                    for (const category of demographicCategories[demographic]) {
                        const seed = year + state.code.charCodeAt(0) + disease.length + demographic.length + category.length;
                        const random = seededRandom(seed);
                        
                        let value = diseaseBaseRates[disease];

                        // Apply layers of multipliers to create a realistic value
                        if (sunBeltStates.includes(state.code)) {
                            value *= regionalMultiplier[disease];
                        }
                        if (stateMultipliers[state.code]) {
                            value *= stateMultipliers[state.code];
                        }

                        switch (demographic) {
                            case Demographic.AgeGroup:
                                value *= ageMultipliers[category as keyof typeof ageMultipliers];
                                break;
                            case Demographic.Income:
                                value *= incomeMultipliers[category as keyof typeof incomeMultipliers];
                                break;
                            case Demographic.Race:
                                value *= raceMultipliers[disease][category as keyof typeof raceMultipliers[typeof disease]];
                                break;
                        }

                        // Add a smaller random variation for realism
                        value *= (1 + (random() - 0.5) * 0.15); // +/- 7.5% variation
                        
                        // Introduce a slight trend over years
                        const trend = (year - availableYears[0]) * (random() * 2 - 0.8); // small, mostly positive trend
                        
                        const rawValue = Math.max(5, Math.floor(value + trend));
                        
                        stateData.diseases[disease].demographics[demographic][category] = applyRuleOf11(rawValue);
                    }
                }
            }
            return stateData;
        });
    }
    return yearlyData;
};