// UI Store (To be implemented with Zustand in Prompt 2)
export type ThemeMode = 'system' | 'light' | 'dark';

export interface UiState {
  themeMode: ThemeMode;
  selectedDivision: string;
}

export const useUiStore = {
  getState: (): UiState => ({
    themeMode: 'system',
    selectedDivision: 'সারা বাংলাদেশ',
  }),
};
