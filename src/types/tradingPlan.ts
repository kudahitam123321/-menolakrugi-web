export type PlanLevel = 'ok' | 'warn' | 'danger' | 'eye';
export type PlanType = 'basic' | 'advanced';
export type ScenarioKey =
  | 'same_kecil'
  | 'same_besar_pijakan'
  | 'same_besar_nopijakan'
  | 'opp_blocked'
  | 'opp_allowed_pijakan'
  | 'opp_allowed_nopijakan';

export interface PlanStep {
  level: PlanLevel;
  text: string;
}

export interface PlanScenario {
  cls: 'rc-ok' | 'rc-warn' | 'rc-danger';
  icon: 'check' | 'triangle' | 'ban';
  title: string;
  steps: PlanStep[];
}

export interface PlanConfig {
  keyrules: PlanStep[];
  scenarios: Record<ScenarioKey, PlanScenario>;
}

export interface TradingPlanConfigRow {
  id: string;
  plan_type: PlanType;
  config: PlanConfig;
  updated_at: string;
}
