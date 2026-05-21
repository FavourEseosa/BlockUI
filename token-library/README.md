# Token Library

A design token system powered by [Style Dictionary](https://amzn.github.io/style-dictionary/) that transforms a single Figma-exported `tokens.json` into platform-specific outputs. Supports runtime mode switching for colour themes, typefaces, and responsive layouts across CSS, Tailwind CSS, Flutter, Kotlin (Compose), and SwiftUI.

---

## Repository Structure

```
token-library/
├── source-tokens/
│   └── tokens.json              # Single source of truth (exported from Figma)
├── build-tokens/                  # Generated outputs (gitignored)
│   ├── css/
│   │   └── tokens.css           # CSS custom properties with mode layers
│   ├── tailwind/
│   │   └── tailwind.config.js   # Tailwind theme referencing CSS variables
│   ├── flutter/
│   │   └── app_tokens.dart      # ThemeData with runtime mode switching
│   ├── android/
│   │   └── Tokens.kt            # Material3 Compose theme
│   └── ios/
│       └── Tokens.swift         # SwiftUI EnvironmentValues theme
├── scripts/
│   ├── watch-tokens.js          # File watcher with SHA-256 change detection
│   ├── check-changes.js         # One-off diff check for CI/CD
│   └── hash-tokens.js           # Manual hash inspection utility
├── sd.config.js                   # Style Dictionary configuration + custom formatters
├── package.json                   # Dependencies and npm scripts
└── README.md                      # This file
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Place your tokens

Export your Figma variables to W3C DTCG format and save as:

```
source-tokens/tokens.json
```

### 3. Build all platforms

```bash
npm run build:all
```

Outputs appear in `build-tokens/<platform>/`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build:all` | Build CSS, Tailwind, Flutter, Kotlin, and Swift outputs |
| `npm run build:css` | Generate CSS custom properties with `data-theme` / `data-typeface` layers |
| `npm run build:tailwind` | Generate `tailwind.config.js` referencing CSS variables |
| `npm run build:flutter` | Generate Dart theme with runtime mode maps |
| `npm run build:kotlin` | Generate Kotlin Material3 theme with `CompositionLocal` |
| `npm run build:swift` | Generate SwiftUI theme with `EnvironmentValues` |
| `npm run watch` | Monitor `tokens.json` and auto-rebuild on changes |
| `npm run tokens:diff` | Check if `tokens.json` changed since last build |
| `npm run tokens:diff -- --build` | Check for changes and auto-build if dirty |
| `npm run clean` | Delete all contents of `build-tokens/` |

---

## Mode System Architecture

This library follows the **W3C Design Tokens Community Group** standard: modes are preserved at runtime rather than resolved into build-time permutations.

### Supported Mode Collections

| Collection | Token Examples | Modes | Platforms |
|-----------|----------------|-------|-----------|
| **Colour Theme** | `textColour.neutral`, `bgColour.generic` | `lightMode`, `darkMode` | All |
| **Typeface** | `fontFamilyMode` | `sans`, `serif`, `mono`, `playful`, `script`, `grotesque` | All |
| **Layouts** | `fontSizeMode.heading.h1` | `desktop`, `mobile`, `tablet`, `large` | CSS (media queries), Tailwind (breakpoints) |

### Why Runtime Over Build-Time Permutations?

- **Single source of truth**: One `tokens.json` file drives all platforms
- **No combinatorial explosion**: 2 × 6 × 4 = 48 possible combinations stay as 1 build
- **Dynamic switching**: Apps can toggle modes without rebuilding
- **Figma parity**: Mode switching in Figma maps directly to code

---

## Platform Usage

### CSS

Generated CSS uses `data-*` attributes for mode scoping:

```html
<!DOCTYPE html>
<html data-theme="dark" data-typeface="serif">
  <head>
    <link rel="stylesheet" href="build-tokens/css/tokens.css" />
  </head>
  <body>
    <h1 class="typography-display-lg">Hello World</h1>
  </body>
</html>
```

```css
/* tokens.css output */
:root {
  --text-colour-neutral: #000000;
  --bg-colour-generic: #ffffff;
  --font-family-base: 'Inter', sans-serif;
  --font-size-mode-heading-h1: 48px;
}

[data-theme="dark"] {
  --text-colour-neutral: #ffffff;
  --bg-colour-generic: #000000;
}

[data-typeface="serif"] {
  --font-family-base: 'Noto Serif', serif;
}

@media (min-width: 1280px) {
  :root {
    --font-size-mode-heading-h1: 80px;
  }
}

.typography-display-lg {
  font-family: var(--typographyStyles-display-lg-fontFamily);
  font-weight: var(--typographyStyles-display-lg-fontWeight);
  font-size: var(--typographyStyles-display-lg-fontSize);
}
```

### Tailwind CSS

The generated config references CSS custom properties:

```javascript
// tailwind.config.js (generated)
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        'text-neutral': 'var(--text-colour-neutral)',
        'bg-generic': 'var(--bg-colour-generic)',
      },
      fontFamily: {
        sans: ["'Inter'", 'sans-serif'],
        serif: ["'Noto Serif'", 'serif'],
      },
    },
  },
};
```

Usage in markup:

```html
<div class="bg-bg-generic text-text-neutral dark:text-white font-serif">
  <h1 class="text-h1-mobile md:text-h1-desktop">Responsive Heading</h1>
</div>
```

### Flutter

```dart
import 'build-tokens/flutter/app_tokens.dart';

// Light + Sans (default)
MaterialApp(
  theme: AppTokens.buildTheme(),
  home: MyHomePage(),
);

// Dark + Serif
MaterialApp(
  theme: AppTokens.buildTheme(
    colourMode: 'darkMode',
    typefaceMode: 'serif',
  ),
  home: MyHomePage(),
);

// Toggle at runtime
setState(() {
  _theme = AppTokens.buildTheme(
    colourMode: isDark ? 'darkMode' : 'lightMode',
    typefaceMode: selectedFont,
  );
});
```

### Kotlin (Jetpack Compose)

```kotlin
import com.example.tokens.AppTokens

@Composable
fun MyApp() {
    AppTokens.AppTheme(
        colourMode = "darkMode",
        typefaceMode = AppTokens.TypefaceMode.SERIF
    ) {
        Surface {
            Text(
                text = "Hello",
                style = AppTokens.Typography.DisplayLg
            )
        }
    }
}
```

### Swift (SwiftUI)

```swift
import SwiftUI

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .tokenTheme(colour: .dark, typeface: .serif)
        }
    }
}

struct ContentView: View {
    @Environment(\.colourMode) var colourMode
    @Environment(\.typefaceMode) var typefaceMode

    var body: some View {
        Text("Hello")
            .font(Tokens.DisplayLg)
            .foregroundColor(Tokens.colours(for: colourMode)["textColour_neutral"])
    }
}
```

---

## Watch Mode

During active design token development, run the watcher to auto-rebuild on every save:

```bash
npm run watch
```

The watcher:
1. Computes a SHA-256 hash of `source-tokens/tokens.json`
2. Compares against the saved hash in `scripts/.tokens-hash`
3. Triggers `npm run build:all` only when content changes
4. Updates the saved hash after successful build

Press `Ctrl+C` to stop watching.

---

## CI/CD Integration

### GitHub Actions

Add this step to validate tokens are up to date:

```yaml
# .github/workflows/design-tokens.yml
name: Design Tokens

on:
  push:
    paths:
      - 'source-tokens/**'
  pull_request:
    paths:
      - 'source-tokens/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run tokens:diff -- --build
      - name: Check for uncommitted changes
        run: |
          if [ -n "$(git status --porcelain build-tokens/)" ]; then
            echo "::error::Build outputs are out of sync with tokens.json"
            git diff --stat build-tokens/
            exit 1
          fi
```

### Pre-commit Hook (Husky)

```bash
npx husky init
```

```bash
# .husky/pre-commit
npm run tokens:diff -- --build
git add build-tokens/
```

---

## Token File Requirements

Your `source-tokens/tokens.json` must follow the **W3C DTCG format** with Figma extensions for modes:

```json
{
  "textColour": {
    "neutral": {
      "$type": "color",
      "$value": "{hues.gray.1000}",
      "$extensions": {
        "mode": {
          "lightMode": "{hues.gray.1000}",
          "darkMode": "{hues.gray.000}"
        },
        "figma": {
          "variableId": "VariableID:46:1634",
          "collection": {
            "id": "VariableCollectionId:11:643",
            "name": "Colour Theme"
          }
        }
      }
    }
  },
  "typographyStyles": {
    "display": {
      "lg": {
        "$type": "typography",
        "$value": {
          "fontFamily": "{fontFamilyMode}",
          "fontWeight": "{font.weight.Bold}",
          "fontSize": "{fontSizeMode.heading.h1}",
          "lineHeight": "{font.lineHeight.lh120}",
          "letterSpacing": "{font.letterSpacing.ls-3}"
        }
      }
    }
  }
}
```

### Supported Token Types

| `$type` | CSS Output | Tailwind | Flutter | Kotlin | Swift |
|---------|-----------|----------|---------|--------|-------|
| `color` | `#hex` / `rgb()` | Color value | `Color(0xFF...)` | `Color(0xFF...)` | `Color(hex:)` |
| `dimension` | `px` / `rem` | Spacing value | `double` | `.sp` / `.dp` | `CGFloat` |
| `number` | Unitless | Number | `double` | `Float` | `CGFloat` |
| `string` | String | String | `String` | `String` | `String` |
| `typography` | CSS custom properties | Plugin config | `TextStyle` | `TextStyle` | `Font` |
| `shadow` | `box-shadow` | — | — | — | — |
| `gradient` | `linear-gradient` | — | — | — | — |

---

## Customisation

### Adding a New Platform

Edit `sd.config.js`:

```javascript
platforms: {
  // ... existing platforms

  json: {
    transformGroup: 'js',
    buildPath: 'build-tokens/json/',
    files: [{
      destination: 'tokens.json',
      format: 'json/flat'
    }]
  }
}
```

### Modifying a Formatter

Custom formatters are registered near the top of `sd.config.js`. Edit the formatter body to change output structure:

```javascript
StyleDictionary.registerFormat({
  name: 'css/standard-modes',
  formatter: ({ dictionary }) => {
    // Your custom logic here
  }
});
```

### Changing Breakpoints

Responsive breakpoints for CSS media queries are defined in the `css/standard-modes` formatter:

```javascript
const breakpoints = {
  mobile: '393px',
  tablet: '800px',
  desktop: '1280px',
  large: '1440px',
};
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Error: Cannot find module 'style-dictionary'` | Run `npm install` |
| Build outputs empty files | Check that `tokens.json` is valid JSON and in `source-tokens/` |
| Modes not applied in CSS | Ensure `data-theme` / `data-typeface` attributes are on `<html>` or parent element |
| Tailwind dark mode not working | Verify `darkMode: ['class', '[data-theme="dark"]']` is in config |
| Flutter font not found | Add font assets to `pubspec.yaml` |
| Kotlin unresolved references | Ensure `androidx.compose.material3` dependency is included |
| Swift `Environment` not updating | Apply `.tokenTheme()` modifier at the `WindowGroup` level |

---

## Contributing

1. Update `source-tokens/tokens.json` in Figma and export
2. Run `npm run build:all` to regenerate outputs
3. Verify all platforms render correctly
4. Commit both `source-tokens/` and `build-tokens/` changes

---

## License

MIT

---

## Acknowledgements

- [Style Dictionary](https://amzn.github.io/style-dictionary/) by Amazon
- [W3C Design Tokens Community Group](https://www.w3.org/community/design-tokens/)
- [Tokens Studio for Figma](https://tokens.studio/)
