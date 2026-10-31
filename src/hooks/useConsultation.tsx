'use client';

// ============================================================
// Gathbandhan — Consultation Context & State Management
// Manages the entire wizard state with React Context + useReducer
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { WeddingSelections, WizardStepId } from '@/types/wedding';
import { WIZARD_STEPS, getVisibleSteps, getStepProgress } from '@/lib/wizard-steps';

// === Default Selections ===
export const defaultSelections: WeddingSelections = {
  regionalTraditions: [],
  selectedCeremonies: [],
  customCeremonies: [],
  decorPreferences: [],
  cuisines: [],
  dietaryRestrictions: [],
  liveFoodCounters: false,
  dessertCounter: false,
  beverageCounter: false,
  photography: [],
  entertainment: [],
  transportation: [],
  additionalServices: [],
  budgetInclusions: [],
  colorPalette: [],
};

// === State ===
interface ConsultationState {
  consultationId: string | null;
  currentStepIndex: number;
  selections: WeddingSelections;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

const initialState: ConsultationState = {
  consultationId: null,
  currentStepIndex: 0,
  selections: defaultSelections,
  isLoading: false,
  error: null,
  isSaving: false,
};

// === Actions ===
type ConsultationAction =
  | { type: 'SET_STEP'; stepIndex: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepId: WizardStepId }
  | { type: 'UPDATE_SELECTIONS'; updates: Partial<WeddingSelections> }
  | { type: 'SET_CONSULTATION_ID'; id: string }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_SAVING'; isSaving: boolean }
  | { type: 'RESTORE_STATE'; state: Partial<ConsultationState> }
  | { type: 'RESET' };

// === Reducer ===
function consultationReducer(
  state: ConsultationState,
  action: ConsultationAction
): ConsultationState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStepIndex: action.stepIndex, error: null };

    case 'NEXT_STEP': {
      const visibleSteps = getVisibleSteps(state.selections);
      const maxIndex = visibleSteps.length - 1;
      const nextIndex = Math.min(state.currentStepIndex + 1, maxIndex);
      return { ...state, currentStepIndex: nextIndex, error: null };
    }

    case 'PREV_STEP': {
      const prevIndex = Math.max(state.currentStepIndex - 1, 0);
      return { ...state, currentStepIndex: prevIndex, error: null };
    }

    case 'GO_TO_STEP': {
      const visibleSteps = getVisibleSteps(state.selections);
      const targetIndex = visibleSteps.findIndex((s) => s.id === action.stepId);
      if (targetIndex >= 0) {
        return { ...state, currentStepIndex: targetIndex, error: null };
      }
      return state;
    }

    case 'UPDATE_SELECTIONS':
      return {
        ...state,
        selections: { ...state.selections, ...action.updates },
        error: null,
      };

    case 'SET_CONSULTATION_ID':
      return { ...state, consultationId: action.id };

    case 'SET_LOADING':
      return { ...state, isLoading: action.isLoading };

    case 'SET_ERROR':
      return { ...state, error: action.error };

    case 'SET_SAVING':
      return { ...state, isSaving: action.isSaving };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.state,
        selections: {
          ...defaultSelections,
          ...(action.state.selections || {}),
        },
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// === Context ===
interface ConsultationContextType {
  state: ConsultationState;
  currentStep: (typeof WIZARD_STEPS)[number] | undefined;
  visibleSteps: typeof WIZARD_STEPS;
  progress: { current: number; total: number; percentage: number };
  canGoNext: boolean;
  canGoPrev: boolean;

  // Actions
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (stepIndexOrId: number | WizardStepId) => void;
  updateSelections: (updates: Partial<WeddingSelections>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const ConsultationContext = createContext<ConsultationContextType | null>(null);

// === Provider ===
interface ConsultationProviderProps {
  children: ReactNode;
}

export function ConsultationProvider({ children }: ConsultationProviderProps) {
  const [state, dispatch] = useReducer(consultationReducer, initialState);

  const visibleSteps = getVisibleSteps(state.selections);
  const currentStep = visibleSteps[state.currentStepIndex];
  const progress = getStepProgress(state.currentStepIndex, state.selections);
  const canGoNext = state.currentStepIndex < visibleSteps.length - 1;
  const canGoPrev = state.currentStepIndex > 0;

  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const prevStep = useCallback(() => dispatch({ type: 'PREV_STEP' }), []);
  const goToStep = useCallback((target: number | WizardStepId) => {
    if (typeof target === 'number') {
      dispatch({ type: 'SET_STEP', stepIndex: target });
    } else {
      dispatch({ type: 'GO_TO_STEP', stepId: target });
    }
  }, []);
  const updateSelections = useCallback(
    (updates: Partial<WeddingSelections>) =>
      dispatch({ type: 'UPDATE_SELECTIONS', updates }),
    []
  );
  const setLoading = useCallback(
    (isLoading: boolean) => dispatch({ type: 'SET_LOADING', isLoading }),
    []
  );
  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_ERROR', error }),
    []
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const value: ConsultationContextType = {
    state,
    currentStep,
    visibleSteps,
    progress,
    canGoNext,
    canGoPrev,
    nextStep,
    prevStep,
    goToStep,
    updateSelections,
    setLoading,
    setError,
    reset,
  };

  return (
    <ConsultationContext.Provider value={value}>
      {children}
    </ConsultationContext.Provider>
  );
}

// === Hook ===
export function useConsultation(): ConsultationContextType {
  const context = useContext(ConsultationContext);
  if (!context) {
    throw new Error('useConsultation must be used within a ConsultationProvider');
  }
  return context;
}
