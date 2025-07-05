// src/types.ts
export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: string;
  memoryUsage?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface OptimizationConstraints {
  timeComplexity?: string;
  spaceComplexity?: string;
  memoryLimit?: string;
}

export interface TestResult {
  testNumber: number;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  executionTime?: string;
}

export interface CodeAnalysis {
  hasNestedLoops: boolean;
  usesRecursion: boolean;
  usesSTL: boolean;
  hasIO: boolean;
  memoryIntensive: boolean;
}

// Extend Window interface for Ace editor
declare global {
  interface Window {
    ace?: {
      edit: (elementId: string) => any;
    };
  }
}