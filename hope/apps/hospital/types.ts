export interface Emergency {
    id: string;
    patient_name: string;
    patient_age: number;
    gender: string;
    symptoms: string;
    triage_level: 'critical' | 'moderate' | 'low';
    status: string;
    created_at: string;
    ai_summary: any;
    ambulance_id: string;
    doctor_id?: string;
    ai_triage_agent_output?: any;
    ai_routing_agent_output?: any;
}

export interface Doctor {
    id: string;
    full_name: string;
    specialization: string;
    status: string;
}
