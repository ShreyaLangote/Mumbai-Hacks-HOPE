export type TriageLevel = "critical" | "high" | "moderate" | "medium" | "low";

export interface Emergency {
  id: string;
  patient_name: string | null;
  patient_age: number | null;
  gender: string | null;
  symptoms: string | null;
  triage_level: TriageLevel;
  status: string | null;
  created_at: string;
  ambulance_id: string | null;
  doctor_id: string | null;
  ai_summary?: {
    summary?: string;
  } | null;
  ai_triage_agent_output?: {
    summary?: string;
    triage_level?: TriageLevel;
    suggested_actions?: string[];
  } | null;
  ai_routing_agent_output?: {
    reasoning?: string;
  } | null;
}

export interface Doctor {
  id: string;
  full_name: string;
  specialization: string | null;
  status?: string | null;
}

