// Location hook (To be implemented in Prompt 17)
export function useLocation() {
  return {
    division: 'সারা বাংলাদেশ',
    district: null,
    setDivision: (_division: string) => {},
    setDistrict: (_district: string | null) => {},
  };
}
