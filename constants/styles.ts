// Predefined style tags for the input form
export const STYLE_TAGS = [
  'Modern',
  'Vintage', 
  'Bold',
  'Minimalist',
  'Colorful',
  'Elegant',
  'Rustic',
  'Professional',
  'Playful',
  'Sophisticated',
  'Clean',
  'Artistic'
] as const;

export type StyleTag = typeof STYLE_TAGS[number];