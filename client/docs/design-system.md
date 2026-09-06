# TutorLink Design System

This document is the single source of truth for all visual styling, layout conventions, typography, and interactive states across the TutorLink frontend.

---

## 1. Color Palette

### Primary Purple Brand (Flat & Confident)
- **Primary Accent (`--color-primary`)**: `#4f46e5` (Solid Indigo/Purple — used for primary CTA buttons, active tabs, selected states)
- **Primary Hover (`--color-primary-hover`)**: `#4338ca` (Darker purple for solid hover states)
- **Primary Active (`--color-primary-active`)**: `#3730a3`
- **Primary Surface (`--color-primary-surface`)**: `#f5f3ff` (Soft tinted purple for active badge/tag backgrounds)
- **Primary Border (`--color-primary-border`)**: `#c7d2fe` (Subtle purple border for highlighted elements)

### Dark / Deep Indigo Neutral
- **Deep Navy/Indigo (`--color-dark`)**: `#0f172a` (Headings, primary text, high-contrast dark bars)
- **Dark Surface (`--color-dark-surface`)**: `#1e1b4b` (Dark banner backgrounds)
- **Footer Dark (`--color-footer`)**: `#0f172a`

### Neutral Grayscale
- **Text Main (`--color-text-main`)**: `#0f172a` (Headings & prominent text)
- **Text Body (`--color-text-body`)**: `#334155` (Body text, labels, card content)
- **Text Muted (`--color-text-muted`)**: `#64748b` (Subtitles, metadata, placeholders)
- **Border Default (`--color-border`)**: `#e2e8f0` (Crisp clean borders on all cards & tables)
- **Border Subtle (`--color-border-subtle`)**: `#f1f5f9` (Internal dividers)
- **Background Page (`--color-bg-page`)**: `#f8fafc` (Clean, flat app backdrop)
- **Background Surface (`--color-bg-surface`)**: `#ffffff` (Card, modal, and panel backgrounds)

### Functional Feedback
- **Success / Verified (`--color-success`)**: `#059669` (Surface: `#f0fdf4`, Border: `#bbf7d0`)
- **Warning / Sandbox (`--color-warning`)**: `#d97706` (Surface: `#fffbeb`, Border: `#fde68a`)
- **Danger / Error (`--color-danger`)**: `#dc2626` (Surface: `#fef2f2`, Border: `#fecaca`)

---

## 2. Typography Rules

- **Font Family**: `Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`
- **Heading Styles**: Plain sentence case. Hierarchy is established through clear font-size and font-weight (700 or 800) differences, not artificial decoration.
- **No Decorative Eyebrows**: Avoid tracked-out, all-caps uppercase labels (`letter-spacing: 2px`) floating above standard headings.
- **Solid Brand Typography**: Logos and headlines use solid high-contrast `#0f172a` or `#4f46e5` rather than glittery gradient text clips.

---

## 3. Component & Layout Conventions

### Buttons
- **Primary Buttons**: Solid flat `#4f46e5`, hover `#4338ca`. No gradients, no shadow-bloom glow, no hover lift.
- **Secondary Buttons**: White or light surface `#ffffff` with border `1px solid #cbd5e1`, hover background `#f8fafc` and text `#0f172a`.
- **Destructive / Danger Buttons**: Flat transparent or `#fef2f2`, text `#dc2626`, border `1px solid #fecaca`, hover `#fee2e2`.

### Cards & Content Containers
- **Border-First Structure**: All cards (tutors, tuition posts, stat widgets, application cards) use crisp `1px solid #e2e8f0` with solid `#ffffff` background.
- **No Floating / Lift Animations**: Remove `transform: translateY(...)` and expanding box shadows on hover. Hover state is limited to a subtle, calm border color shift (`border-color: #cbd5e1` or `#c7d2fe`).
- **Consistent Radius**: `border-radius: 12px` (standard cards), `border-radius: 8px` (inputs & buttons), `border-radius: 16px` (large structural panels).
- **Shadow Discipline**: Shadows are reserved strictly for overlays (modals, dropdown menus, popovers) using `box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08)`.

### Backgrounds & Surfaces
- **No Decorative Gradient Washes**: Hero sections, headers, and stat bars use flat, calm background colors (`#ffffff`, `#f8fafc`, or `#1e1b4b`) instead of rainbow/purple mesh gradients or animated blobs.
- **Sticky Navbar**: Navigation is `position: sticky; top: 0;` so it remains visible while preserving the standard document layout flow without overlapping content.
