# Typography System

The typography system is defined in `app/styles/fonts.css` and uses CSS custom properties throughout the application.

## Base Font Size

```css
--font-size: 16px;
```

The root font size is **16px**. This is used as the base for the `rem` unit and for UI elements (buttons, labels, navigation). Editorial content (articles, descriptions) uses `--font-size-lg` to achieve a larger, more comfortable reading size — similar to how Medium or Substack approach body typography.

## Type Scale

Font sizes use a modular scale with two ratios:

| Variable | Ratio |
|---|---|
| `--scale-ratio-major-second` | 1.125 |
| `--scale-ratio-major-third` | 1.25 |

- **Mobile** (`< 768px`): major second (1.125) — more compact
- **Desktop** (`≥ 768px`): major third (1.25) — more expressive

The active ratio is `--type-scale-ratio`, which switches automatically via a media query.

## Font Size Variables

Fixed sizes (not part of the fluid scale):

| Variable | Value | Usage |
|---|---|---|
| `--font-size-xs` | `0.75rem` | Captions, footnotes, badges |
| `--font-size-sm` | `0.875rem` | Metadata, secondary UI text |
| `--font-size-md` | `1rem` | UI body text, buttons, inputs |

Fluid sizes (scale with the type scale ratio):

| Variable | Formula | Mobile (~) | Desktop (~) |
|---|---|---|---|
| `--font-size-lg` | `1rem × ratio¹` | 18px | 20px |
| `--font-size-xl` | `1rem × ratio²` | 20px | 25px |
| `--font-size-2xl` | `1rem × ratio³` | 23px | 31px |
| `--font-size-3xl` | `1rem × ratio⁴` | 26px | 39px |
| `--font-size-4xl` | `1rem × ratio⁵` | 29px | 49px |
| `--font-size-5xl` | `1rem × ratio⁶` | 33px | 61px |

## Line Height Variables

Line heights are paired with font sizes. The scale follows the principle: **smaller text needs more leading, larger text needs less**.

| Variable | Value | Zone |
|---|---|---|
| `--line-height-xs` | `1.6` | Captions — extra air because the text is very small |
| `--line-height-sm` | `1.5` | Reading zone — comfortable for longer text |
| `--line-height-md` | `1.5` | Reading zone — UI body text |
| `--line-height-lg` | `1.5` | Reading zone — editorial content, articles |
| `--line-height-xl` | `1.4` | Heading zone — starts to tighten |
| `--line-height-2xl` | `1.35` | Heading zone |
| `--line-height-3xl` | `1.3` | Heading zone |
| `--line-height-4xl` | `1.25` | Heading zone |
| `--line-height-5xl` | `1.2` | Display — tightest |

### Reading Zone (`sm → lg`, LH 1.5)

Sizes `sm`, `md`, and `lg` intentionally share the same line height of **1.5**. These cover all text where readability matters — UI labels, body copy, and editorial paragraphs. The `lg` size is used for article and description text to match the editorial approach of platforms like Medium.

## Font Weight Variables

| Variable | Value |
|---|---|
| `--font-weight-regular` | `400` |
| `--font-weight-medium` | `500` |
| `--font-weight-semibold` | `600` |
| `--font-weight-bold` | `700` |

## Letter Spacing Variables

| Variable | Value |
|---|---|
| `--letter-spacing-tight` | `-0.025em` |
| `--letter-spacing-normal` | `0` |
| `--letter-spacing-wide` | `0.025em` |

## Two-Layer Typography Strategy

The system follows a deliberate two-layer approach:

| Layer | Size | Examples |
|---|---|---|
| **UI typography** | `md` (16px) | Buttons, inputs, navigation, admin panels, labels |
| **Editorial typography** | `lg` (~18–20px) | Articles, descriptions, blockquotes, paragraph component |

This keeps the interface compact and functional while giving reading content the space it needs for long-form comfort.