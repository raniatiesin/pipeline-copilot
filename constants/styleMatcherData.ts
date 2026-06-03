/**
 * ============================================
 * STYLE MATCHER QUESTION DATA
 * ============================================
 *
 * Pure data: the 12 style-matcher questions and their
 * option trees (no business logic — see `lib/styleMatcher.ts`).
 *
 * Types are local to this file because they mirror the
 * exact shape of the hardcoded data and differ slightly
 * from the abstract domain types in `types/style-matcher.ts`.
 *
 * @module constants/styleMatcherData
 */

// ============================================
// LOCAL DATA-SHAPE TYPES
// ============================================

interface Option {
  label: string;
  subQuestion?: Question;
}

interface Question {
  question: string;
  options: Option[];
}

interface ParentQuestion {
  id: string;
  order: number;
  title: string;
  parentQuestion: string;
  options: Array<{
    label: string;
    subQuestion?: Question;
  }>;
}

// ============================================
// QUESTION DATA
// ============================================

/** All style-matcher questions in display order. */
export const styleMatcherData: ParentQuestion[] = [
  // QUESTION 1: PRIMARY VIBE
  {
    id: "vibe",
    order: 1,
    title: "Primary Vibe",
    parentQuestion: "What's the primary VIBE you want to communicate?",
    options: [
      {
        label: "Dreamlike & Surreal",
        subQuestion: {
          question: "Reality level?",
          options: [
            {
              label: "Slightly Surreal",
              subQuestion: {
                question: "Subtle dreamlike or obvious fantasy?",
                options: [
                  { label: "Subtle dreamlike" },
                  { label: "Obvious fantasy" }
                ]
              }
            },
            {
              label: "Fully Abstract",
              subQuestion: {
                question: "Chaotic abstract or structured abstract?",
                options: [
                  { label: "Chaotic abstract" },
                  { label: "Structured abstract" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Bold & Striking",
        subQuestion: {
          question: "Impact method?",
          options: [
            {
              label: "Color Impact",
              subQuestion: {
                question: "Neon vibrant or high-contrast?",
                options: [
                  { label: "Neon vibrant" },
                  { label: "High-contrast" }
                ]
              }
            },
            {
              label: "Scale Impact",
              subQuestion: {
                question: "Macro details or vast expansive?",
                options: [
                  { label: "Macro details" },
                  { label: "Vast expansive" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Calm & Serene",
        subQuestion: {
          question: "Tranquility type?",
          options: [
            {
              label: "Meditative Quiet",
              subQuestion: {
                question: "Empty space or soft filled?",
                options: [
                  { label: "Empty space" },
                  { label: "Soft filled" }
                ]
              }
            },
            {
              label: "Nature Inspired",
              subQuestion: {
                question: "Organic flowing or geometric zen?",
                options: [
                  { label: "Organic flowing" },
                  { label: "Geometric zen" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Playful & Whimsical",
        subQuestion: {
          question: "Playfulness approach?",
          options: [
            {
              label: "Cartoon Fun",
              subQuestion: {
                question: "Flat 2D or 3D rendered cute?",
                options: [
                  { label: "Flat 2D" },
                  { label: "3D rendered cute" }
                ]
              }
            },
            {
              label: "Quirky Oddball",
              subQuestion: {
                question: "Weird charming or absurdist humor?",
                options: [
                  { label: "Weird charming" },
                  { label: "Absurdist humor" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Mysterious & Moody",
        subQuestion: {
          question: "Mystery style?",
          options: [
            {
              label: "Dark Atmospheric",
              subQuestion: {
                question: "Gothic shadows or noir minimal?",
                options: [
                  { label: "Gothic shadows" },
                  { label: "Noir minimal" }
                ]
              }
            },
            {
              label: "Mystical Magical",
              subQuestion: {
                question: "Folklore symbols or cosmic ethereal?",
                options: [
                  { label: "Folklore symbols" },
                  { label: "Cosmic ethereal" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Energetic & Dynamic",
        subQuestion: {
          question: "Energy expression?",
          options: [
            {
              label: "Explosive Chaos",
              subQuestion: {
                question: "Splatter energy or geometric kinetic?",
                options: [
                  { label: "Splatter energy" },
                  { label: "Geometric kinetic" }
                ]
              }
            },
            {
              label: "Vibrant Lively",
              subQuestion: {
                question: "Pop art bright or tropical saturated?",
                options: [
                  { label: "Pop art bright" },
                  { label: "Tropical saturated" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Elegant & Refined",
        subQuestion: {
          question: "Sophistication level?",
          options: [
            {
              label: "Luxurious Premium",
              subQuestion: {
                question: "Gold accents or minimalist expensive?",
                options: [
                  { label: "Gold accents" },
                  { label: "Minimalist expensive" }
                ]
              }
            },
            {
              label: "Classic Timeless",
              subQuestion: {
                question: "Renaissance inspired or modern classic?",
                options: [
                  { label: "Renaissance inspired" },
                  { label: "Modern classic" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Raw & Authentic",
        subQuestion: {
          question: "Authenticity tone?",
          options: [
            {
              label: "Gritty Textured",
              subQuestion: {
                question: "Urban rough or organic earthy?",
                options: [
                  { label: "Urban rough" },
                  { label: "Organic earthy" }
                ]
              }
            },
            {
              label: "Candid Human",
              subQuestion: {
                question: "Portrait intimate or documentary real?",
                options: [
                  { label: "Portrait intimate" },
                  { label: "Documentary real" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 2: REALISM LEVEL
  {
    id: "realism",
    order: 2,
    title: "Realism Level",
    parentQuestion: "How REALISTIC should the image feel?",
    options: [
      {
        label: "Photorealistic",
        subQuestion: {
          question: "Perfect realism or stylized realism?",
          options: [
            {
              label: "Perfect Realism",
              subQuestion: {
                question: "Studio photography or natural environment?",
                options: [
                  { label: "Studio photography" },
                  { label: "Natural environment" }
                ]
              }
            },
            {
              label: "Stylized Realism",
              subQuestion: {
                question: "Enhanced beauty or artistic interpretation?",
                options: [
                  { label: "Enhanced beauty" },
                  { label: "Artistic interpretation" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Illustrated/Painted",
        subQuestion: {
          question: "Digital painting or traditional media feel?",
          options: [
            {
              label: "Digital Painting",
              subQuestion: {
                question: "Smooth blended or visible brushstrokes?",
                options: [
                  { label: "Smooth blended" },
                  { label: "Visible brushstrokes" }
                ]
              }
            },
            {
              label: "Traditional Media",
              subQuestion: {
                question: "Watercolor soft or oil painting rich?",
                options: [
                  { label: "Watercolor soft" },
                  { label: "Oil painting rich" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "3D Rendered",
        subQuestion: {
          question: "Hyperreal 3D or stylized 3D?",
          options: [
            {
              label: "Hyperreal 3D",
              subQuestion: {
                question: "Product render perfect or architectural precise?",
                options: [
                  { label: "Product render perfect" },
                  { label: "Architectural precise" }
                ]
              }
            },
            {
              label: "Stylized 3D",
              subQuestion: {
                question: "Cartoon render or clay/toy aesthetic?",
                options: [
                  { label: "Cartoon render" },
                  { label: "Clay/toy aesthetic" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Flat Graphic",
        subQuestion: {
          question: "Vector clean or poster art?",
          options: [
            {
              label: "Vector Clean",
              subQuestion: {
                question: "Corporate minimal or playful shapes?",
                options: [
                  { label: "Corporate minimal" },
                  { label: "Playful shapes" }
                ]
              }
            },
            {
              label: "Poster Art",
              subQuestion: {
                question: "Vintage propaganda or modern graphic?",
                options: [
                  { label: "Vintage propaganda" },
                  { label: "Modern graphic" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Mixed Media",
        subQuestion: {
          question: "Collage layered or photo manipulation?",
          options: [
            {
              label: "Collage Layered",
              subQuestion: {
                question: "Cut paper analog or digital composite?",
                options: [
                  { label: "Cut paper analog" },
                  { label: "Digital composite" }
                ]
              }
            },
            {
              label: "Photo Manipulation",
              subQuestion: {
                question: "Seamless blend or obvious surreal?",
                options: [
                  { label: "Seamless blend" },
                  { label: "Obvious surreal" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Abstract Forms",
        subQuestion: {
          question: "Geometric abstract or organic abstract?",
          options: [
            {
              label: "Geometric Abstract",
              subQuestion: {
                question: "Hard edge precise or flowing shapes?",
                options: [
                  { label: "Hard edge precise" },
                  { label: "Flowing shapes" }
                ]
              }
            },
            {
              label: "Organic Abstract",
              subQuestion: {
                question: "Natural forms or chaotic expressive?",
                options: [
                  { label: "Natural forms" },
                  { label: "Chaotic expressive" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Sketch/Line Art",
        subQuestion: {
          question: "Detailed line work or loose gestural?",
          options: [
            {
              label: "Detailed Line Work",
              subQuestion: {
                question: "Technical pen or cross-hatched?",
                options: [
                  { label: "Technical pen" },
                  { label: "Cross-hatched" }
                ]
              }
            },
            {
              label: "Loose Gestural",
              subQuestion: {
                question: "Quick sketch or expressive scribble?",
                options: [
                  { label: "Quick sketch" },
                  { label: "Expressive scribble" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Pixel Art",
        subQuestion: {
          question: "Retro 8-bit or modern high-res pixel?",
          options: [
            {
              label: "Retro 8-bit",
              subQuestion: {
                question: "NES/GameBoy style or C64 limited palette?",
                options: [
                  { label: "NES/GameBoy style" },
                  { label: "C64 limited palette" }
                ]
              }
            },
            {
              label: "Modern High-res Pixel",
              subQuestion: {
                question: "Detailed sprites or pixel painting?",
                options: [
                  { label: "Detailed sprites" },
                  { label: "Pixel painting" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 3: TEXTURE QUALITY
  {
    id: "texture",
    order: 3,
    title: "Texture Style",
    parentQuestion: "What TEXTURE quality do you prefer?",
    options: [
      {
        label: "Ultra Smooth/Clean",
        subQuestion: {
          question: "Glossy perfect or matte smooth?",
          options: [
            {
              label: "Glossy Perfect",
              subQuestion: {
                question: "Mirror shine or wet reflective?",
                options: [
                  { label: "Mirror shine" },
                  { label: "Wet reflective" }
                ]
              }
            },
            {
              label: "Matte Smooth",
              subQuestion: {
                question: "Powder soft or porcelain finish?",
                options: [
                  { label: "Powder soft" },
                  { label: "Porcelain finish" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Grainy/Noisy",
        subQuestion: {
          question: "Film grain subtle or heavy noise texture?",
          options: [
            {
              label: "Film Grain Subtle",
              subQuestion: {
                question: "35mm texture or analog warmth?",
                options: [
                  { label: "35mm texture" },
                  { label: "Analog warmth" }
                ]
              }
            },
            {
              label: "Heavy Noise Texture",
              subQuestion: {
                question: "High ISO grit or distressed vintage?",
                options: [
                  { label: "High ISO grit" },
                  { label: "Distressed vintage" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Painterly/Brushed",
        subQuestion: {
          question: "Visible strokes or blended soft?",
          options: [
            {
              label: "Visible Strokes",
              subQuestion: {
                question: "Impasto thick or expressive marks?",
                options: [
                  { label: "Impasto thick" },
                  { label: "Expressive marks" }
                ]
              }
            },
            {
              label: "Blended Soft",
              subQuestion: {
                question: "Airbrushed smooth or sfumato subtle?",
                options: [
                  { label: "Airbrushed smooth" },
                  { label: "Sfumato subtle" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Pointillistic/Dotted",
        subQuestion: {
          question: "Fine dots or chunky stippled?",
          options: [
            {
              label: "Fine Dots",
              subQuestion: {
                question: "Delicate stipple or halftone screen?",
                options: [
                  { label: "Delicate stipple" },
                  { label: "Halftone screen" }
                ]
              }
            },
            {
              label: "Chunky Stippled",
              subQuestion: {
                question: "Bold pointillism or spray paint dots?",
                options: [
                  { label: "Bold pointillism" },
                  { label: "Spray paint dots" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Geometric/Patterned",
        subQuestion: {
          question: "Repeating patterns or tessellated shapes?",
          options: [
            {
              label: "Repeating Patterns",
              subQuestion: {
                question: "Wallpaper regular or decorative motifs?",
                options: [
                  { label: "Wallpaper regular" },
                  { label: "Decorative motifs" }
                ]
              }
            },
            {
              label: "Tessellated Shapes",
              subQuestion: {
                question: "Islamic geometric or mosaic tiles?",
                options: [
                  { label: "Islamic geometric" },
                  { label: "Mosaic tiles" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Organic/Natural",
        subQuestion: {
          question: "Fabric weave or paper texture?",
          options: [
            {
              label: "Fabric Weave",
              subQuestion: {
                question: "Canvas texture or linen threads?",
                options: [
                  { label: "Canvas texture" },
                  { label: "Linen threads" }
                ]
              }
            },
            {
              label: "Paper Texture",
              subQuestion: {
                question: "Rough handmade or subtle grain?",
                options: [
                  { label: "Rough handmade" },
                  { label: "Subtle grain" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Glitch/Digital Artifacts",
        subQuestion: {
          question: "Subtle glitch or heavy corruption?",
          options: [
            {
              label: "Subtle Glitch",
              subQuestion: {
                question: "Slight distortion or digital artifacts?",
                options: [
                  { label: "Slight distortion" },
                  { label: "Digital artifacts" }
                ]
              }
            },
            {
              label: "Heavy Corruption",
              subQuestion: {
                question: "Datamosh chaos or pixel sorting?",
                options: [
                  { label: "Datamosh chaos" },
                  { label: "Pixel sorting" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Layered/Dimensional",
        subQuestion: {
          question: "Subtle depth or obvious layers?",
          options: [
            {
              label: "Subtle Depth",
              subQuestion: {
                question: "Slight emboss or soft shadows?",
                options: [
                  { label: "Slight emboss" },
                  { label: "Soft shadows" }
                ]
              }
            },
            {
              label: "Obvious Layers",
              subQuestion: {
                question: "Clear separation or 3D paper craft?",
                options: [
                  { label: "Clear separation" },
                  { label: "3D paper craft" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 4: COLOR PHILOSOPHY
  {
    id: "color",
    order: 4,
    title: "Color Palette",
    parentQuestion: "What's your COLOR philosophy?",
    options: [
      {
        label: "Vibrant & Saturated",
        subQuestion: {
          question: "Primary bold or full rainbow spectrum?",
          options: [
            {
              label: "Primary Bold",
              subQuestion: {
                question: "Red/yellow/blue focus or secondary colors too?",
                options: [
                  { label: "Red/yellow/blue focus" },
                  { label: "Secondary colors too" }
                ]
              }
            },
            {
              label: "Rainbow Spectrum",
              subQuestion: {
                question: "Even distribution or gradient flow?",
                options: [
                  { label: "Even distribution" },
                  { label: "Gradient flow" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Pastel & Soft",
        subQuestion: {
          question: "Cool pastels or warm peachy tones?",
          options: [
            {
              label: "Cool Pastels",
              subQuestion: {
                question: "Lavender/mint/sky or full cool range?",
                options: [
                  { label: "Lavender/mint/sky" },
                  { label: "Full cool range" }
                ]
              }
            },
            {
              label: "Warm Peachy",
              subQuestion: {
                question: "Coral/cream/blush or sunset warmth?",
                options: [
                  { label: "Coral/cream/blush" },
                  { label: "Sunset warmth" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Muted & Desaturated",
        subQuestion: {
          question: "Earth tones or washed vintage?",
          options: [
            {
              label: "Earth Tones",
              subQuestion: {
                question: "Brown/beige/olive or terracotta/rust?",
                options: [
                  { label: "Brown/beige/olive" },
                  { label: "Terracotta/rust" }
                ]
              }
            },
            {
              label: "Washed Vintage",
              subQuestion: {
                question: "Faded 70s or sepia nostalgic?",
                options: [
                  { label: "Faded 70s" },
                  { label: "Sepia nostalgic" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Monochromatic",
        subQuestion: {
          question: "Single color variations or black & white only?",
          options: [
            {
              label: "Single Color",
              subQuestion: {
                question: "Blue variations or warm tone variations?",
                options: [
                  { label: "Blue variations" },
                  { label: "Warm tone variations" }
                ]
              }
            },
            {
              label: "Black & White",
              subQuestion: {
                question: "Pure grayscale or tinted monochrome?",
                options: [
                  { label: "Pure grayscale" },
                  { label: "Tinted monochrome" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "High Contrast",
        subQuestion: {
          question: "Complementary clash or light vs dark drama?",
          options: [
            {
              label: "Complementary Clash",
              subQuestion: {
                question: "Orange/blue or red/green tension?",
                options: [
                  { label: "Orange/blue" },
                  { label: "Red/green tension" }
                ]
              }
            },
            {
              label: "Light vs Dark",
              subQuestion: {
                question: "Stark contrast or chiaroscuro drama?",
                options: [
                  { label: "Stark contrast" },
                  { label: "Chiaroscuro drama" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Neon & Fluorescent",
        subQuestion: {
          question: "Cyberpunk neon or 80s bright?",
          options: [
            {
              label: "Cyberpunk Neon",
              subQuestion: {
                question: "Pink/cyan/purple or green/orange accent?",
                options: [
                  { label: "Pink/cyan/purple" },
                  { label: "Green/orange accent" }
                ]
              }
            },
            {
              label: "80s Bright",
              subQuestion: {
                question: "Hot pink/electric blue or full neon palette?",
                options: [
                  { label: "Hot pink/electric blue" },
                  { label: "Full neon palette" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Natural & Organic",
        subQuestion: {
          question: "Forest greens or ocean blues?",
          options: [
            {
              label: "Forest Greens",
              subQuestion: {
                question: "Deep emerald or sage/moss variety?",
                options: [
                  { label: "Deep emerald" },
                  { label: "Sage/moss variety" }
                ]
              }
            },
            {
              label: "Ocean Blues",
              subQuestion: {
                question: "Teal/turquoise or navy/azure depth?",
                options: [
                  { label: "Teal/turquoise" },
                  { label: "Navy/azure depth" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Metallic & Iridescent",
        subQuestion: {
          question: "Gold/silver luxe or holographic rainbow?",
          options: [
            {
              label: "Gold/Silver Luxe",
              subQuestion: {
                question: "Warm gold or cool silver chrome?",
                options: [
                  { label: "Warm gold" },
                  { label: "Cool silver chrome" }
                ]
              }
            },
            {
              label: "Holographic",
              subQuestion: {
                question: "Subtle shimmer or full prismatic?",
                options: [
                  { label: "Subtle shimmer" },
                  { label: "Full prismatic" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 5: LIGHT BEHAVIOR
  {
    id: "light",
    order: 5,
    title: "Lighting",
    parentQuestion: "How should LIGHT behave in the image?",
    options: [
      {
        label: "Soft Diffused Glow",
        subQuestion: {
          question: "Even all over or directional soft?",
          options: [
            {
              label: "Even All Over",
              subQuestion: {
                question: "Studio flat or ambient uniform?",
                options: [
                  { label: "Studio flat" },
                  { label: "Ambient uniform" }
                ]
              }
            },
            {
              label: "Directional Soft",
              subQuestion: {
                question: "Window light or side angle gentle?",
                options: [
                  { label: "Window light" },
                  { label: "Side angle gentle" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Dramatic High Contrast",
        subQuestion: {
          question: "Single source harsh or multiple shadows?",
          options: [
            {
              label: "Single Source Harsh",
              subQuestion: {
                question: "Spotlight dramatic or sun direct?",
                options: [
                  { label: "Spotlight dramatic" },
                  { label: "Sun direct" }
                ]
              }
            },
            {
              label: "Multiple Shadows",
              subQuestion: {
                question: "Cross lighting or complex shadows?",
                options: [
                  { label: "Cross lighting" },
                  { label: "Complex shadows" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Ethereal/Magical Glow",
        subQuestion: {
          question: "Inner luminescence or external halo?",
          options: [
            {
              label: "Inner Luminescence",
              subQuestion: {
                question: "Glowing from within or bioluminescent?",
                options: [
                  { label: "Glowing from within" },
                  { label: "Bioluminescent" }
                ]
              }
            },
            {
              label: "External Halo",
              subQuestion: {
                question: "Aura surrounding or backlit glow?",
                options: [
                  { label: "Aura surrounding" },
                  { label: "Backlit glow" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Flat/Even Graphic",
        subQuestion: {
          question: "No shadows or minimal depth?",
          options: [
            {
              label: "No Shadows",
              subQuestion: {
                question: "Pure flat or cartoon simple?",
                options: [
                  { label: "Pure flat" },
                  { label: "Cartoon simple" }
                ]
              }
            },
            {
              label: "Minimal Depth",
              subQuestion: {
                question: "Slight dimension or subtle modeling?",
                options: [
                  { label: "Slight dimension" },
                  { label: "Subtle modeling" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Natural/Realistic",
        subQuestion: {
          question: "Golden hour warm or overcast neutral?",
          options: [
            {
              label: "Golden Hour Warm",
              subQuestion: {
                question: "Sunset glow or sunrise soft?",
                options: [
                  { label: "Sunset glow" },
                  { label: "Sunrise soft" }
                ]
              }
            },
            {
              label: "Overcast Neutral",
              subQuestion: {
                question: "Cloudy diffused or shade even?",
                options: [
                  { label: "Cloudy diffused" },
                  { label: "Shade even" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Neon/Artificial",
        subQuestion: {
          question: "Sign glow or screen light?",
          options: [
            {
              label: "Sign Glow",
              subQuestion: {
                question: "Neon tubing or LED strips?",
                options: [
                  { label: "Neon tubing" },
                  { label: "LED strips" }
                ]
              }
            },
            {
              label: "Screen Light",
              subQuestion: {
                question: "Monitor blue or projected colors?",
                options: [
                  { label: "Monitor blue" },
                  { label: "Projected colors" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Backlit/Rim Light",
        subQuestion: {
          question: "Silhouette or edge highlight?",
          options: [
            {
              label: "Silhouette",
              subQuestion: {
                question: "Complete black or partial detail?",
                options: [
                  { label: "Complete black" },
                  { label: "Partial detail" }
                ]
              }
            },
            {
              label: "Edge Highlight",
              subQuestion: {
                question: "Rim light accent or halo outline?",
                options: [
                  { label: "Rim light accent" },
                  { label: "Halo outline" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Volumetric/Atmospheric",
        subQuestion: {
          question: "God rays or fog penetration?",
          options: [
            {
              label: "God Rays",
              subQuestion: {
                question: "Through clouds or through trees?",
                options: [
                  { label: "Through clouds" },
                  { label: "Through trees" }
                ]
              }
            },
            {
              label: "Fog Penetration",
              subQuestion: {
                question: "Misty atmosphere or dust particles?",
                options: [
                  { label: "Misty atmosphere" },
                  { label: "Dust particles" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 6: FORMS
  {
    id: "form",
    order: 6,
    title: "Form & Shape",
    parentQuestion: "What FORMS should dominate the composition?",
    options: [
      {
        label: "Organic/Flowing",
        subQuestion: {
          question: "Natural curves or liquid movement?",
          options: [
            {
              label: "Natural Curves",
              subQuestion: {
                question: "Soft rounded or spiral flowing?",
                options: [
                  { label: "Soft rounded" },
                  { label: "Spiral flowing" }
                ]
              }
            },
            {
              label: "Liquid Movement",
              subQuestion: {
                question: "Water ripples or melting drips?",
                options: [
                  { label: "Water ripples" },
                  { label: "Melting drips" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Geometric/Angular",
        subQuestion: {
          question: "Sharp edges or tessellated patterns?",
          options: [
            {
              label: "Sharp Edges",
              subQuestion: {
                question: "Crystalline faceted or cut paper angular?",
                options: [
                  { label: "Crystalline faceted" },
                  { label: "Cut paper angular" }
                ]
              }
            },
            {
              label: "Tessellated Patterns",
              subQuestion: {
                question: "Islamic patterns or modern geometric grid?",
                options: [
                  { label: "Islamic patterns" },
                  { label: "Modern geometric grid" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Simplified/Minimalist",
        subQuestion: {
          question: "Essential shapes only or reduced detail?",
          options: [
            {
              label: "Essential Shapes Only",
              subQuestion: {
                question: "Circle/square/triangle or silhouette only?",
                options: [
                  { label: "Circle/square/triangle" },
                  { label: "Silhouette only" }
                ]
              }
            },
            {
              label: "Reduced Detail",
              subQuestion: {
                question: "Flat color blocks or line art minimal?",
                options: [
                  { label: "Flat color blocks" },
                  { label: "Line art minimal" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Detailed/Intricate",
        subQuestion: {
          question: "Ornate decorative or technical precise?",
          options: [
            {
              label: "Ornate Decorative",
              subQuestion: {
                question: "Art nouveau or baroque elaborate?",
                options: [
                  { label: "Art nouveau" },
                  { label: "Baroque elaborate" }
                ]
              }
            },
            {
              label: "Technical Precise",
              subQuestion: {
                question: "Blueprint detail or scientific diagram?",
                options: [
                  { label: "Blueprint detail" },
                  { label: "Scientific diagram" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Anthropomorphic/Character",
        subQuestion: {
          question: "Human-like or creature hybrid?",
          options: [
            {
              label: "Human-like",
              subQuestion: {
                question: "Idealized beauty or expressive stylized?",
                options: [
                  { label: "Idealized beauty" },
                  { label: "Expressive stylized" }
                ]
              }
            },
            {
              label: "Creature Hybrid",
              subQuestion: {
                question: "Mythical beings or animal mashup?",
                options: [
                  { label: "Mythical beings" },
                  { label: "Animal mashup" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Architectural/Structural",
        subQuestion: {
          question: "Building forms or constructed elements?",
          options: [
            {
              label: "Building Forms",
              subQuestion: {
                question: "Modern architecture or ancient structures?",
                options: [
                  { label: "Modern architecture" },
                  { label: "Ancient structures" }
                ]
              }
            },
            {
              label: "Constructed Elements",
              subQuestion: {
                question: "Scaffolding industrial or modular blocks?",
                options: [
                  { label: "Scaffolding industrial" },
                  { label: "Modular blocks" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Nature-Inspired",
        subQuestion: {
          question: "Floral botanical or landscape elements?",
          options: [
            {
              label: "Floral Botanical",
              subQuestion: {
                question: "Realistic flowers or stylized plants?",
                options: [
                  { label: "Realistic flowers" },
                  { label: "Stylized plants" }
                ]
              }
            },
            {
              label: "Landscape Elements",
              subQuestion: {
                question: "Mountains/water or sky/clouds?",
                options: [
                  { label: "Mountains/water" },
                  { label: "Sky/clouds" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Abstract/Non-Objective",
        subQuestion: {
          question: "Pure shape play or conceptual forms?",
          options: [
            {
              label: "Pure Shape Play",
              subQuestion: {
                question: "Geometric exploration or organic blobs?",
                options: [
                  { label: "Geometric exploration" },
                  { label: "Organic blobs" }
                ]
              }
            },
            {
              label: "Conceptual Forms",
              subQuestion: {
                question: "Symbolic abstract or emotion shapes?",
                options: [
                  { label: "Symbolic abstract" },
                  { label: "Emotion shapes" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 7: COMPOSITION STYLE
  {
    id: "composition",
    order: 7,
    title: "Composition",
    parentQuestion: "What COMPOSITION style feels right?",
    options: [
      {
        label: "Centered/Symmetrical",
        subQuestion: {
          question: "Perfect mirror or radial symmetry?",
          options: [
            {
              label: "Perfect Mirror",
              subQuestion: {
                question: "Vertical axis or horizontal reflection?",
                options: [
                  { label: "Vertical axis" },
                  { label: "Horizontal reflection" }
                ]
              }
            },
            {
              label: "Radial Symmetry",
              subQuestion: {
                question: "4-way cross or circular mandala?",
                options: [
                  { label: "4-way cross" },
                  { label: "Circular mandala" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Balanced Asymmetrical",
        subQuestion: {
          question: "Rule of thirds or dynamic diagonal?",
          options: [
            {
              label: "Rule of Thirds",
              subQuestion: {
                question: "Classic placement or multiple focal points?",
                options: [
                  { label: "Classic placement" },
                  { label: "Multiple focal points" }
                ]
              }
            },
            {
              label: "Dynamic Diagonal",
              subQuestion: {
                question: "Ascending line or descending energy?",
                options: [
                  { label: "Ascending line" },
                  { label: "Descending energy" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Minimal Negative Space",
        subQuestion: {
          question: "Breathing room or isolated subject?",
          options: [
            {
              label: "Breathing Room",
              subQuestion: {
                question: "Generous margins or minimalist sparse?",
                options: [
                  { label: "Generous margins" },
                  { label: "Minimalist sparse" }
                ]
              }
            },
            {
              label: "Isolated Subject",
              subQuestion: {
                question: "Center void or corner emphasis?",
                options: [
                  { label: "Center void" },
                  { label: "Corner emphasis" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Busy/Maximalist",
        subQuestion: {
          question: "Horror vacui or organized chaos?",
          options: [
            {
              label: "Horror Vacui",
              subQuestion: {
                question: "Every space filled or dense packing?",
                options: [
                  { label: "Every space filled" },
                  { label: "Dense packing" }
                ]
              }
            },
            {
              label: "Organized Chaos",
              subQuestion: {
                question: "Structured variety or controlled clutter?",
                options: [
                  { label: "Structured variety" },
                  { label: "Controlled clutter" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Layered Depth",
        subQuestion: {
          question: "Foreground/mid/background or flat overlapping?",
          options: [
            {
              label: "Foreground/Mid/Background",
              subQuestion: {
                question: "Clear separation or atmospheric perspective?",
                options: [
                  { label: "Clear separation" },
                  { label: "Atmospheric perspective" }
                ]
              }
            },
            {
              label: "Flat Overlapping",
              subQuestion: {
                question: "Paper cutout layers or graphic stacking?",
                options: [
                  { label: "Paper cutout layers" },
                  { label: "Graphic stacking" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Grid/Pattern Based",
        subQuestion: {
          question: "Strict grid or loose pattern?",
          options: [
            {
              label: "Strict Grid",
              subQuestion: {
                question: "Perfect alignment or modular system?",
                options: [
                  { label: "Perfect alignment" },
                  { label: "Modular system" }
                ]
              }
            },
            {
              label: "Loose Pattern",
              subQuestion: {
                question: "Organic repetition or varied rhythm?",
                options: [
                  { label: "Organic repetition" },
                  { label: "Varied rhythm" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Chaotic/Random",
        subQuestion: {
          question: "Intentional chaos or scattered elements?",
          options: [
            {
              label: "Intentional Chaos",
              subQuestion: {
                question: "Controlled randomness or artistic disorder?",
                options: [
                  { label: "Controlled randomness" },
                  { label: "Artistic disorder" }
                ]
              }
            },
            {
              label: "Scattered Elements",
              subQuestion: {
                question: "Explosive spread or floating objects?",
                options: [
                  { label: "Explosive spread" },
                  { label: "Floating objects" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Frame Within Frame",
        subQuestion: {
          question: "Window/portal or vignette focus?",
          options: [
            {
              label: "Window/Portal",
              subQuestion: {
                question: "Looking through or framed view?",
                options: [
                  { label: "Looking through" },
                  { label: "Framed view" }
                ]
              }
            },
            {
              label: "Vignette Focus",
              subQuestion: {
                question: "Darkened edges or faded borders?",
                options: [
                  { label: "Darkened edges" },
                  { label: "Faded borders" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 8: EMOTIONAL MOOD
  {
    id: "mood",
    order: 8,
    title: "Mood & Tone",
    parentQuestion: "What EMOTIONAL MOOD should viewers feel?",
    options: [
      {
        label: "Joyful/Uplifting",
        subQuestion: {
          question: "Pure happiness or gentle contentment?",
          options: [
            {
              label: "Pure Happiness",
              subQuestion: {
                question: "Bright celebration or warm smile?",
                options: [
                  { label: "Bright celebration" },
                  { label: "Warm smile" }
                ]
              }
            },
            {
              label: "Gentle Contentment",
              subQuestion: {
                question: "Peaceful satisfaction or quiet joy?",
                options: [
                  { label: "Peaceful satisfaction" },
                  { label: "Quiet joy" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Melancholic/Nostalgic",
        subQuestion: {
          question: "Bittersweet or deep sadness?",
          options: [
            {
              label: "Bittersweet",
              subQuestion: {
                question: "Nostalgic longing or beautiful sadness?",
                options: [
                  { label: "Nostalgic longing" },
                  { label: "Beautiful sadness" }
                ]
              }
            },
            {
              label: "Deep Sadness",
              subQuestion: {
                question: "Melancholic blues or somber grief?",
                options: [
                  { label: "Melancholic blues" },
                  { label: "Somber grief" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Contemplative/Introspective",
        subQuestion: {
          question: "Peaceful reflection or existential questioning?",
          options: [
            {
              label: "Peaceful Reflection",
              subQuestion: {
                question: "Meditative calm or thoughtful pause?",
                options: [
                  { label: "Meditative calm" },
                  { label: "Thoughtful pause" }
                ]
              }
            },
            {
              label: "Existential Questioning",
              subQuestion: {
                question: "Philosophical depth or cosmic wonder?",
                options: [
                  { label: "Philosophical depth" },
                  { label: "Cosmic wonder" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Energetic/Exciting",
        subQuestion: {
          question: "Adrenaline rush or playful enthusiasm?",
          options: [
            {
              label: "Adrenaline Rush",
              subQuestion: {
                question: "Action-packed or thrilling intensity?",
                options: [
                  { label: "Action-packed" },
                  { label: "Thrilling intensity" }
                ]
              }
            },
            {
              label: "Playful Enthusiasm",
              subQuestion: {
                question: "Bouncy energy or cheerful excitement?",
                options: [
                  { label: "Bouncy energy" },
                  { label: "Cheerful excitement" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Mysterious/Enigmatic",
        subQuestion: {
          question: "Curious intrigue or unsettling unknown?",
          options: [
            {
              label: "Curious Intrigue",
              subQuestion: {
                question: "Compelling mystery or fascinating puzzle?",
                options: [
                  { label: "Compelling mystery" },
                  { label: "Fascinating puzzle" }
                ]
              }
            },
            {
              label: "Unsettling Unknown",
              subQuestion: {
                question: "Eerie tension or dark mystery?",
                options: [
                  { label: "Eerie tension" },
                  { label: "Dark mystery" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Serene/Peaceful",
        subQuestion: {
          question: "Zen calm or sleepy tranquil?",
          options: [
            {
              label: "Zen Calm",
              subQuestion: {
                question: "Deep peace or spiritual stillness?",
                options: [
                  { label: "Deep peace" },
                  { label: "Spiritual stillness" }
                ]
              }
            },
            {
              label: "Sleepy Tranquil",
              subQuestion: {
                question: "Drowsy comfort or gentle rest?",
                options: [
                  { label: "Drowsy comfort" },
                  { label: "Gentle rest" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Dramatic/Intense",
        subQuestion: {
          question: "Epic grandeur or emotional tension?",
          options: [
            {
              label: "Epic Grandeur",
              subQuestion: {
                question: "Heroic scale or sublime vastness?",
                options: [
                  { label: "Heroic scale" },
                  { label: "Sublime vastness" }
                ]
              }
            },
            {
              label: "Emotional Tension",
              subQuestion: {
                question: "Dramatic conflict or passionate intensity?",
                options: [
                  { label: "Dramatic conflict" },
                  { label: "Passionate intensity" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Whimsical/Fantastical",
        subQuestion: {
          question: "Magical wonder or playful imagination?",
          options: [
            {
              label: "Magical Wonder",
              subQuestion: {
                question: "Enchanted dreams or fairy tale magic?",
                options: [
                  { label: "Enchanted dreams" },
                  { label: "Fairy tale magic" }
                ]
              }
            },
            {
              label: "Playful Imagination",
              subQuestion: {
                question: "Whimsical fun or creative fantasy?",
                options: [
                  { label: "Whimsical fun" },
                  { label: "Creative fantasy" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 9: MOVEMENT OR STILLNESS
  {
    id: "movement",
    order: 9,
    title: "Movement",
    parentQuestion: "Should there be implied MOVEMENT or STILLNESS?",
    options: [
      {
        label: "Dynamic Motion",
        subQuestion: {
          question: "Frozen action or blur movement?",
          options: [
            {
              label: "Frozen Action",
              subQuestion: {
                question: "Peak moment or suspended time?",
                options: [
                  { label: "Peak moment" },
                  { label: "Suspended time" }
                ]
              }
            },
            {
              label: "Blur Movement",
              subQuestion: {
                question: "Motion trails or speed lines?",
                options: [
                  { label: "Motion trails" },
                  { label: "Speed lines" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Flowing/Drifting",
        subQuestion: {
          question: "Wind blown or water current?",
          options: [
            {
              label: "Wind Blown",
              subQuestion: {
                question: "Gentle breeze or strong gust?",
                options: [
                  { label: "Gentle breeze" },
                  { label: "Strong gust" }
                ]
              }
            },
            {
              label: "Water Current",
              subQuestion: {
                question: "Flowing stream or ocean waves?",
                options: [
                  { label: "Flowing stream" },
                  { label: "Ocean waves" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Completely Still",
        subQuestion: {
          question: "Frozen time or static composition?",
          options: [
            {
              label: "Frozen Time",
              subQuestion: {
                question: "Crystallized moment or time stopped?",
                options: [
                  { label: "Crystallized moment" },
                  { label: "Time stopped" }
                ]
              }
            },
            {
              label: "Static Composition",
              subQuestion: {
                question: "Perfectly still or solid stability?",
                options: [
                  { label: "Perfectly still" },
                  { label: "Solid stability" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Subtle Animation Hint",
        subQuestion: {
          question: "Almost moving or living still?",
          options: [
            {
              label: "Almost Moving",
              subQuestion: {
                question: "Barely perceptible or about to shift?",
                options: [
                  { label: "Barely perceptible" },
                  { label: "About to shift" }
                ]
              }
            },
            {
              label: "Living Still",
              subQuestion: {
                question: "Breathing presence or quiet animation?",
                options: [
                  { label: "Breathing presence" },
                  { label: "Quiet animation" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Spiraling/Circular",
        subQuestion: {
          question: "Vortex energy or gentle rotation?",
          options: [
            {
              label: "Vortex Energy",
              subQuestion: {
                question: "Swirling chaos or whirlpool pull?",
                options: [
                  { label: "Swirling chaos" },
                  { label: "Whirlpool pull" }
                ]
              }
            },
            {
              label: "Gentle Rotation",
              subQuestion: {
                question: "Slow spin or orbiting elements?",
                options: [
                  { label: "Slow spin" },
                  { label: "Orbiting elements" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Explosive/Expanding",
        subQuestion: {
          question: "Outward burst or radiating energy?",
          options: [
            {
              label: "Outward Burst",
              subQuestion: {
                question: "Explosive force or star burst?",
                options: [
                  { label: "Explosive force" },
                  { label: "Star burst" }
                ]
              }
            },
            {
              label: "Radiating Energy",
              subQuestion: {
                question: "Emanating light or expanding rings?",
                options: [
                  { label: "Emanating light" },
                  { label: "Expanding rings" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Collapsing/Contracting",
        subQuestion: {
          question: "Imploding center or gravitational pull?",
          options: [
            {
              label: "Imploding Center",
              subQuestion: {
                question: "Collapsing inward or vacuum pull?",
                options: [
                  { label: "Collapsing inward" },
                  { label: "Vacuum pull" }
                ]
              }
            },
            {
              label: "Gravitational Pull",
              subQuestion: {
                question: "Heavy weight or sinking down?",
                options: [
                  { label: "Heavy weight" },
                  { label: "Sinking down" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Oscillating/Rhythmic",
        subQuestion: {
          question: "Wave patterns or pendulum swing?",
          options: [
            {
              label: "Wave Patterns",
              subQuestion: {
                question: "Undulating motion or ripple effect?",
                options: [
                  { label: "Undulating motion" },
                  { label: "Ripple effect" }
                ]
              }
            },
            {
              label: "Pendulum Swing",
              subQuestion: {
                question: "Back and forth or rhythmic pulse?",
                options: [
                  { label: "Back and forth" },
                  { label: "Rhythmic pulse" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 10: ARTISTIC MOVEMENT
  {
    id: "artMovement",
    order: 10,
    title: "Art Movement",
    parentQuestion: "Any ARTISTIC MOVEMENT or style inspiration?",
    options: [
      {
        label: "Vaporwave/Synthwave",
        subQuestion: {
          question: "Classic vaporwave or outrun aesthetic?",
          options: [
            {
              label: "Classic Vaporwave",
              subQuestion: {
                question: "Roman bust nostalgia or Japanese text aesthetic?",
                options: [
                  { label: "Roman bust nostalgia" },
                  { label: "Japanese text aesthetic" }
                ]
              }
            },
            {
              label: "Outrun Aesthetic",
              subQuestion: {
                question: "Sunset grid horizon or sports car speed?",
                options: [
                  { label: "Sunset grid horizon" },
                  { label: "Sports car speed" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Surrealism",
        subQuestion: {
          question: "Dali dreamscape or Magritte conceptual?",
          options: [
            {
              label: "Dali Dreamscape",
              subQuestion: {
                question: "Melting clocks or impossible landscapes?",
                options: [
                  { label: "Melting clocks" },
                  { label: "Impossible landscapes" }
                ]
              }
            },
            {
              label: "Magritte Conceptual",
              subQuestion: {
                question: "Floating objects or visual paradox?",
                options: [
                  { label: "Floating objects" },
                  { label: "Visual paradox" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Pop Art",
        subQuestion: {
          question: "Warhol repetition or Lichtenstein comic?",
          options: [
            {
              label: "Warhol Repetition",
              subQuestion: {
                question: "Screen print grid or color variations?",
                options: [
                  { label: "Screen print grid" },
                  { label: "Color variations" }
                ]
              }
            },
            {
              label: "Lichtenstein Comic",
              subQuestion: {
                question: "Ben-day dots or speech bubbles?",
                options: [
                  { label: "Ben-day dots" },
                  { label: "Speech bubbles" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Art Nouveau",
        subQuestion: {
          question: "Mucha organic or Klimt decorative?",
          options: [
            {
              label: "Mucha Organic",
              subQuestion: {
                question: "Flowing hair or natural curves?",
                options: [
                  { label: "Flowing hair" },
                  { label: "Natural curves" }
                ]
              }
            },
            {
              label: "Klimt Decorative",
              subQuestion: {
                question: "Gold patterns or ornate details?",
                options: [
                  { label: "Gold patterns" },
                  { label: "Ornate details" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Bauhaus/Modernist",
        subQuestion: {
          question: "Geometric rational or primary colors bold?",
          options: [
            {
              label: "Geometric Rational",
              subQuestion: {
                question: "Clean lines or functional forms?",
                options: [
                  { label: "Clean lines" },
                  { label: "Functional forms" }
                ]
              }
            },
            {
              label: "Primary Colors Bold",
              subQuestion: {
                question: "Red/yellow/blue or strong contrast?",
                options: [
                  { label: "Red/yellow/blue" },
                  { label: "Strong contrast" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Impressionist",
        subQuestion: {
          question: "Monet light or Van Gogh expressive?",
          options: [
            {
              label: "Monet Light",
              subQuestion: {
                question: "Soft impressions or water reflections?",
                options: [
                  { label: "Soft impressions" },
                  { label: "Water reflections" }
                ]
              }
            },
            {
              label: "Van Gogh Expressive",
              subQuestion: {
                question: "Swirling strokes or emotional color?",
                options: [
                  { label: "Swirling strokes" },
                  { label: "Emotional color" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Psychedelic",
        subQuestion: {
          question: "60s trippy or modern neon psychedelic?",
          options: [
            {
              label: "60s Trippy",
              subQuestion: {
                question: "Paisley patterns or kaleidoscope effects?",
                options: [
                  { label: "Paisley patterns" },
                  { label: "Kaleidoscope effects" }
                ]
              }
            },
            {
              label: "Modern Neon Psychedelic",
              subQuestion: {
                question: "Digital fractals or glowing colors?",
                options: [
                  { label: "Digital fractals" },
                  { label: "Glowing colors" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Minimalism",
        subQuestion: {
          question: "Brutalist stark or refined simplicity?",
          options: [
            {
              label: "Brutalist Stark",
              subQuestion: {
                question: "Concrete harsh or geometric severe?",
                options: [
                  { label: "Concrete harsh" },
                  { label: "Geometric severe" }
                ]
              }
            },
            {
              label: "Refined Simplicity",
              subQuestion: {
                question: "Japanese zen or elegant reduction?",
                options: [
                  { label: "Japanese zen" },
                  { label: "Elegant reduction" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 11: LEVEL OF DETAIL
  {
    id: "detail",
    order: 11,
    title: "Detail Level",
    parentQuestion: "What LEVEL OF DETAIL is appropriate?",
    options: [
      {
        label: "Hyperdetailed",
        subQuestion: {
          question: "Every texture visible or intricate patterns?",
          options: [
            {
              label: "Every Texture Visible",
              subQuestion: {
                question: "Macro photography close or surface detail zoom?",
                options: [
                  { label: "Macro photography close" },
                  { label: "Surface detail zoom" }
                ]
              }
            },
            {
              label: "Intricate Patterns",
              subQuestion: {
                question: "Lace-like complexity or ornamental precision?",
                options: [
                  { label: "Lace-like complexity" },
                  { label: "Ornamental precision" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "High Detail",
        subQuestion: {
          question: "Rich complexity or focused precision?",
          options: [
            {
              label: "Rich Complexity",
              subQuestion: {
                question: "Layered depth or varied elements?",
                options: [
                  { label: "Layered depth" },
                  { label: "Varied elements" }
                ]
              }
            },
            {
              label: "Focused Precision",
              subQuestion: {
                question: "Sharp clarity or technical accuracy?",
                options: [
                  { label: "Sharp clarity" },
                  { label: "Technical accuracy" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Moderate Detail",
        subQuestion: {
          question: "Balanced focus or selective detail?",
          options: [
            {
              label: "Balanced Focus",
              subQuestion: {
                question: "Even attention or distributed detail?",
                options: [
                  { label: "Even attention" },
                  { label: "Distributed detail" }
                ]
              }
            },
            {
              label: "Selective Detail",
              subQuestion: {
                question: "Hero focus or depth of field blur?",
                options: [
                  { label: "Hero focus" },
                  { label: "Depth of field blur" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Low Detail",
        subQuestion: {
          question: "Simplified forms or essential elements?",
          options: [
            {
              label: "Simplified Forms",
              subQuestion: {
                question: "Basic shapes or clean reduction?",
                options: [
                  { label: "Basic shapes" },
                  { label: "Clean reduction" }
                ]
              }
            },
            {
              label: "Essential Elements",
              subQuestion: {
                question: "Core components or key features only?",
                options: [
                  { label: "Core components" },
                  { label: "Key features only" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Minimal Detail",
        subQuestion: {
          question: "Bare essentials or iconic reduction?",
          options: [
            {
              label: "Bare Essentials",
              subQuestion: {
                question: "Absolute minimum or stripped down?",
                options: [
                  { label: "Absolute minimum" },
                  { label: "Stripped down" }
                ]
              }
            },
            {
              label: "Iconic Reduction",
              subQuestion: {
                question: "Symbol simple or logo-like?",
                options: [
                  { label: "Symbol simple" },
                  { label: "Logo-like" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Abstract/Suggestive",
        subQuestion: {
          question: "Implied forms or viewer interpretation?",
          options: [
            {
              label: "Implied Forms",
              subQuestion: {
                question: "Suggested shapes or partial rendering?",
                options: [
                  { label: "Suggested shapes" },
                  { label: "Partial rendering" }
                ]
              }
            },
            {
              label: "Viewer Interpretation",
              subQuestion: {
                question: "Open ended or imagination required?",
                options: [
                  { label: "Open ended" },
                  { label: "Imagination required" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Textural Detail",
        subQuestion: {
          question: "Surface emphasis or material focus?",
          options: [
            {
              label: "Surface Emphasis",
              subQuestion: {
                question: "Material quality or tactile focus?",
                options: [
                  { label: "Material quality" },
                  { label: "Tactile focus" }
                ]
              }
            },
            {
              label: "Material Focus",
              subQuestion: {
                question: "Physical properties or substance highlight?",
                options: [
                  { label: "Physical properties" },
                  { label: "Substance highlight" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Atmospheric Detail",
        subQuestion: {
          question: "Environmental mood or spatial depth?",
          options: [
            {
              label: "Environmental Mood",
              subQuestion: {
                question: "Atmosphere heavy or ambient quality?",
                options: [
                  { label: "Atmosphere heavy" },
                  { label: "Ambient quality" }
                ]
              }
            },
            {
              label: "Spatial Depth",
              subQuestion: {
                question: "Distance layers or perspective emphasis?",
                options: [
                  { label: "Distance layers" },
                  { label: "Perspective emphasis" }
                ]
              }
            }
          ]
        }
      }
    ]
  },

  // QUESTION 12: PRIMARY SUBJECT FOCUS
  {
    id: "subject",
    order: 12,
    title: "Subject Focus",
    parentQuestion: "What's the PRIMARY SUBJECT FOCUS?",
    options: [
      {
        label: "Portraits/Figures",
        subQuestion: {
          question: "Close-up face or full body character?",
          options: [
            {
              label: "Close-up Face",
              subQuestion: {
                question: "Eyes centered or profile angle?",
                options: [
                  { label: "Eyes centered" },
                  { label: "Profile angle" }
                ]
              }
            },
            {
              label: "Full Body Character",
              subQuestion: {
                question: "Standing pose or action position?",
                options: [
                  { label: "Standing pose" },
                  { label: "Action position" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Objects/Still Life",
        subQuestion: {
          question: "Single object or arranged collection?",
          options: [
            {
              label: "Single Object",
              subQuestion: {
                question: "Product spotlight or artifact focus?",
                options: [
                  { label: "Product spotlight" },
                  { label: "Artifact focus" }
                ]
              }
            },
            {
              label: "Arranged Collection",
              subQuestion: {
                question: "Organized display or scattered grouping?",
                options: [
                  { label: "Organized display" },
                  { label: "Scattered grouping" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Landscapes/Environments",
        subQuestion: {
          question: "Vast expansive or intimate scene?",
          options: [
            {
              label: "Vast Expansive",
              subQuestion: {
                question: "Horizon wide or infinite space?",
                options: [
                  { label: "Horizon wide" },
                  { label: "Infinite space" }
                ]
              }
            },
            {
              label: "Intimate Scene",
              subQuestion: {
                question: "Cozy corner or personal moment?",
                options: [
                  { label: "Cozy corner" },
                  { label: "Personal moment" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Abstract Concepts",
        subQuestion: {
          question: "Pure visual or symbolic narrative?",
          options: [
            {
              label: "Pure Visual",
              subQuestion: {
                question: "Color/form exploration or aesthetic experience?",
                options: [
                  { label: "Color/form exploration" },
                  { label: "Aesthetic experience" }
                ]
              }
            },
            {
              label: "Symbolic Narrative",
              subQuestion: {
                question: "Metaphorical meaning or story suggestion?",
                options: [
                  { label: "Metaphorical meaning" },
                  { label: "Story suggestion" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Typography/Text",
        subQuestion: {
          question: "Text as art or text with imagery?",
          options: [
            {
              label: "Text as Art",
              subQuestion: {
                question: "Typography design or lettering craft?",
                options: [
                  { label: "Typography design" },
                  { label: "Lettering craft" }
                ]
              }
            },
            {
              label: "Text with Imagery",
              subQuestion: {
                question: "Words integrated or message + visual?",
                options: [
                  { label: "Words integrated" },
                  { label: "Message + visual" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Creatures/Animals",
        subQuestion: {
          question: "Realistic or fantastical hybrid?",
          options: [
            {
              label: "Realistic",
              subQuestion: {
                question: "Natural accurate or wildlife authentic?",
                options: [
                  { label: "Natural accurate" },
                  { label: "Wildlife authentic" }
                ]
              }
            },
            {
              label: "Fantastical Hybrid",
              subQuestion: {
                question: "Mythical creature or imaginary being?",
                options: [
                  { label: "Mythical creature" },
                  { label: "Imaginary being" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Architecture/Spaces",
        subQuestion: {
          question: "Exterior structures or interior spaces?",
          options: [
            {
              label: "Exterior Structures",
              subQuestion: {
                question: "Building facades or outdoor architecture?",
                options: [
                  { label: "Building facades" },
                  { label: "Outdoor architecture" }
                ]
              }
            },
            {
              label: "Interior Spaces",
              subQuestion: {
                question: "Room design or inside environment?",
                options: [
                  { label: "Room design" },
                  { label: "Inside environment" }
                ]
              }
            }
          ]
        }
      },
      {
        label: "Patterns/Textures",
        subQuestion: {
          question: "Repeating motifs or material surfaces?",
          options: [
            {
              label: "Repeating Motifs",
              subQuestion: {
                question: "Pattern tiling or decorative repeat?",
                options: [
                  { label: "Pattern tiling" },
                  { label: "Decorative repeat" }
                ]
              }
            },
            {
              label: "Material Surfaces",
              subQuestion: {
                question: "Texture showcase or substance detail?",
                options: [
                  { label: "Texture showcase" },
                  { label: "Substance detail" }
                ]
              }
            }
          ]
        }
      }
    ]
  }
];
