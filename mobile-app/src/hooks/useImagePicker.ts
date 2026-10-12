// Image picker hook (To be implemented in Prompt 20)
export function useImagePicker() {
  return {
    pickImage: async () => null,
    takePhoto: async () => null,
    images: [] as string[],
    removeImage: (_index: number) => {},
  };
}
