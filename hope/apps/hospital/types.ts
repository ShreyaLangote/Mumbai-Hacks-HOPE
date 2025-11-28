export interface Emergency {
    id: string;
    patient_name: string;
    patient_age: number;
    gender: string;
    symptoms: string;
    triage_level: 'critical' | 'high' | 'medium' | 'low';
    status: string;
    created_at: string;
    ai_summary: any;
    ambulance_id: string;
    doctor_id?: string;
}

export interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    status: string;
}
