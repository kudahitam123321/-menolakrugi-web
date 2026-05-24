export type PlanLevel = 'ok' | 'warn' | 'danger' | 'eye';
export type PlanType  = string; // dynamic — admin can create any named plan

export interface PlanStep {
  level: PlanLevel;
  text: string;
}

// ─── Tree node types ──────────────────────────────────────────────────────────

export interface TreeChoice {
  id: string;
  label: string;
  nextId: string; // ID of next question or result; empty string = unconnected
}

export interface TreeQuestion {
  id: string;
  type: 'question';
  text: string;
  choices: TreeChoice[];
}

export interface TreeResult {
  id: string;
  type: 'result';
  cls: 'rc-ok' | 'rc-warn' | 'rc-danger';
  title: string;
  steps: PlanStep[];
}

export type TreeNode = TreeQuestion | TreeResult;

export interface TreePlanConfig {
  rootId: string;                  // ID of the starting question
  nodes: Record<string, TreeNode>; // all nodes keyed by ID
  keyrules: PlanStep[];            // always shown after any result
}

export interface TradingPlanConfigRow {
  id: string;
  plan_type: PlanType;
  config: TreePlanConfig;
  updated_at: string;
}
