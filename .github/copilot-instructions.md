# The Maker's Stay HTML Presentation - AI Instructions

## Project Overview
This is a multi-page HTML presentation for "The Maker's Stay" ecovillage investment proposal. Built as a sequential, narrative-driven presentation with interactive financial models and data visualizations.

## Architecture & File Structure
- **Sequential HTML files** (8 total): Start with `001iguessthisisfirst.html` (overview), then numbered `2 intro.html` through `8 conclusion.html`
- **Consistent naming pattern**: Files reference each other using descriptive names (e.g., `introduction_detail.html`, `location_detail.html`)
- **Self-contained pages**: Each HTML file includes all necessary CSS/JS inline with CDN dependencies

## Core Technology Stack
- **TailwindCSS**: Primary styling framework via CDN (`https://cdn.tailwindcss.com`)
- **Chart.js**: Interactive data visualizations via CDN (`https://cdn.jsdelivr.net/npm/chart.js`)
- **Google Fonts**: Inter (body) + Playfair Display (headings)
- **Vanilla JavaScript**: Simple interactions, no frameworks

## Design System Conventions

### Color Palette (Consistent across all files)
```css
background-color: #182719;  /* Dark forest green */
color: #F5f2e8;            /* Cream text */
.text-accent { color: #Bca86d; }  /* Muted gold accent */
```

### Standard CSS Classes
- `.content-container`: Main content wrapper with backdrop blur
- `.card-style`: Interactive cards with hover effects and transparency
- `.nav-button`: Navigation styling with accent color interactions
- `.playfair`: Applies Playfair Display font for headings

### Layout Pattern
Every page follows this structure:
1. Fixed background with blur overlay (`.bg-fixed-full`)
2. Semi-transparent content container (`.content-container`)
3. Bottom navigation bar with prev/next/menu
4. Inline JavaScript for menu interactions

## Interactive Features

### Global Navigation
- Fixed bottom navigation with Previous/Next buttons
- Dropdown menu accessing all sections
- Consistent JavaScript pattern for menu toggle:
```javascript
document.addEventListener('DOMContentLoaded', () => {
    const menuButton = document.getElementById('menu-button');
    const menuDropdown = document.getElementById('menu-dropdown');
    // Toggle logic...
});
```

### Chart.js Integration
Files using charts (`3 strategiclocation.html`, `5 financialprojections.html`, `6 budgetexplorer.html`, `7 crisisproofmodel.html`):
- Canvas elements with descriptive IDs (e.g., `chartYears1to5`, `cltEquityChart`)
- Common chart styling: `chartTextColor = '#F5f2e8'`, responsive options
- Financial data formatted using `Intl.NumberFormat` for currency display

### Tab/Collapsible Content
- Budget Explorer (`6 budgetexplorer.html`) uses tab system with `.tab-button` and `.tab-content`
- Collapsible sections use `.collapsible-trigger` with CSS transforms

## Development Patterns

### File Linking Convention
- Main overview file links to detail pages using descriptive names
- Navigation uses consistent href patterns across all files
- Menu dropdowns reference the same set of standard page names

### JavaScript Patterns
1. **DOMContentLoaded wrapper**: All scripts wait for DOM ready
2. **Event delegation**: Click handlers with `stopPropagation()` for dropdowns
3. **CSS class toggling**: Uses `classList.toggle()` and `classList.add/remove()`

### Data Presentation
- Financial tables use consistent styling with `.projection-table`
- Emphasis on visual hierarchy with background opacity variations
- Data sources noted with `.data-source` class for attribution

## Content Structure
Each section covers specific aspects of the investment proposal:
1. **Overview** → **Introduction** → **Strategic Location** → **Financial Blueprint** 
2. **Financial Projections** → **Budget Explorer** → **Crisis-Proof Model** → **Conclusion**

## Key Files for Reference
- `001iguessthisisfirst.html`: Template for overall page structure and navigation
- `6 budgetexplorer.html`: Complex interactive features (tabs, collapsibles, charts)
- `5 financialprojections.html`: Financial data table formatting patterns