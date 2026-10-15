# SYNEQ Website Bundle

A responsive, animated company website for SYNEQ and its two product concepts:

- **UniTrade** - campus circular marketplace: https://unitradeneo.vercel.app/
- **OrbitX** - AI-driven campus fitness and health ecosystem: https://xorbit-ruby.vercel.app/

## Files

- `index.html` - page structure and content
- `style.css` - visual design, responsive layouts, themes, animations, reduced-motion and print styles
- `script.js` - theme and profile state, search, feature tabs, guided tour, keyboard shortcuts, screenshot and exports
- `SYNEQ-Project-Guide.pdf` - full project guide from product concept through implementation and production roadmap

## Run locally

Keep all four files in the same directory. For reliable localStorage behavior, run a static server from this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser. No package manager or build step is required.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `/` | Open website search |
| `T` | Toggle light / dark mode |
| `G` | Start the full 10-step guided tour |
| `P` | Open your local display profile |
| `Shift + S` | Capture a full-page PNG screenshot |
| `?` | Open keyboard shortcuts |
| `Esc` | Close a dialog or the guided tour |

## Notes and limitations

- The profile is a **local demo profile**, not production authentication. It stores a display name and optional email in this browser. No password is requested or stored.
- The theme, current field note, profile, and tour marker use `localStorage`. Browser privacy settings or opening the file directly may restrict persistence; using a local server or hosted HTTPS site is recommended.
- Screenshot capture uses html2canvas and the personalized PDF uses jsPDF from public CDNs. These two actions need the CDN scripts to load. The static project guide PDF is included locally and does not require a PDF library.
- The three contributor cards use the same profile-photo URL because the same URL was supplied for each. Initial-based fallbacks appear if the image cannot load. Replace the image `src` values in `index.html` when separate photos are available.
- Product capabilities on the SYNEQ page explain the product direction; check the linked product websites for their current implementation. The page does not claim verified impact metrics, real payments, secure account services, or production AI/health functionality.

## Deployment

For a static host such as Vercel, deploy this folder as a static site with `index.html` as the entry point. Keep `style.css`, `script.js`, and `SYNEQ-Project-Guide.pdf` alongside it so local asset and download links resolve.
