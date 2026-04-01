# Design System: High-End Editorial Beauty

## 1. Overview & Creative North Star: "The Digital Vanity"
This design system rejects the "utility-first" look of standard apps in favor of a **High-End Editorial** experience. Our Creative North Star is **"The Digital Vanity"**—a space that feels as curated, tactile, and premium as a high-end beauty boutique. 

We move beyond the flat, rigid grid by embracing **intentional asymmetry** and **tonal depth**. Instead of boxes and borders, we use layered surfaces and high-contrast typography scales to guide the eye. The interface shouldn't just function; it should breathe. We utilize generous white space and overlapping elements to create a sense of effortless luxury, mimicking the layout of a premium fashion magazine.

---

## 2. Colors & Surface Philosophy
The palette is built on warm, inviting tones of rose gold and soft peach, anchored by a "clean white" that is actually a sophisticated off-white (`surface`).

### The "No-Line" Rule
**Strict Mandate:** Designers are prohibited from using 1px solid borders for sectioning. Structural boundaries must be defined solely through:
1.  **Background Color Shifts:** Placing a `surface-container-low` card on a `surface` background.
2.  **Tonal Transitions:** Using the `surface-container` tiers to denote hierarchy.
3.  **Negative Space:** Using the spacing scale (e.g., `8` or `10`) to create "invisible" gutters.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper or frosted glass. 
*   **Base:** `surface` (#faf9f6)
*   **Secondary Content:** `surface-container-low` (#f4f3f1)
*   **Interactive Cards:** `surface-container-lowest` (#ffffff) to create a subtle "pop" from the background.
*   **Overlays/Modals:** `surface-bright` (#faf9f6) with high-diffusion ambient shadows.

### The "Glass & Rose Gold" Rule
To achieve the "Rose Gold" aesthetic without looking dated, use **Glassmorphism**. For floating elements (like navigation bars or top headers), use `surface` at 70% opacity with a `20px` backdrop-blur. 
*   **Signature Textures:** Use a linear gradient for main Action Buttons: `primary` (#8d4d3b) to `primary_container` (#f4a28c) at a 135-degree angle. This adds a "silk" sheen that flat color cannot replicate.

---

## 3. Typography: The Editorial Voice
We use a dual-font system to balance modern tech with high-fashion elegance.

| Level | Font | Token | Use Case |
| :--- | :--- | :--- | :--- |
| **Display** | Manrope | `display-lg` (3.5rem) | Hero promotional headers, large price points. |
| **Headline**| Manrope | `headline-md` (1.75rem)| Service categories, "Book Now" section titles. |
| **Title**   | Be Vietnam Pro | `title-lg` (1.375rem) | Specialist names, service titles in cards. |
| **Body**    | Be Vietnam Pro | `body-lg` (1rem) | Descriptions, bios, service details. |
| **Label**   | Be Vietnam Pro | `label-md` (0.75rem) | Metadata, timestamps, status tags. |

**The Identity Gap:** We use `manrope` for high-impact moments to provide an authoritative, editorial feel. `beVietnamPro` is used for functional reading, providing a clean, modern iOS-style clarity. Use `title-lg` in semi-bold for high-fidelity navigation.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "heavy" for a beauty app. We use **Ambient Light** principles.

*   **The Layering Principle:** Depth is achieved by "stacking." A `surface-container-lowest` card placed on a `surface-container-low` background creates a soft, natural lift.
*   **Ambient Shadows:** If an element must float (e.g., a "Book Service" CTA), use a shadow with a 24pt blur and 4% opacity. The shadow color must be a tinted version of `on-surface` (#1a1c1a), never pure black.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility, use `outline-variant` (#d8c2bc) at **15% opacity**. Anything higher is too aggressive for this system.
*   **Glassmorphism:** Apply to the Bottom Navigation bar. Use a blur effect so the soft peach and rose gold of the content "bleeds" through as the user scrolls, maintaining the "warm and inviting" tone.

---

## 5. Components
Our components use the `xl` (3rem) and `lg` (2rem) roundedness scale to feel "organic" and "soft."

*   **Buttons:**
    *   *Primary:* Gradient (`primary` to `primary_container`), `xl` roundedness. No border.
    *   *Secondary:* `surface-container-highest` background with `on-primary-container` text.
*   **Cards (Service/Specialist):**
    *   **Forbid dividers.** Separate a Specialist's name from their rating using a `1.5` (0.5rem) horizontal spacing gap or a subtle `surface-variant` vertical pill.
    *   Use `lg` (2rem) corner radius for images to create a high-end look.
*   **Input Fields:**
    *   Use `surface-container-low` as the fill. No bottom line. No outline.
    *   Label should be `label-md` floating above the container.
*   **Service Selection Chips:**
    *   Selected: `primary_container` background with `on-primary_container` text.
    *   Unselected: `surface-container-high` background.
*   **Signature Component: "The Specialist Spotlight":** 
    *   A card that breaks the container. The specialist's photo should overlap the card's top boundary by `spacing-4`, creating an asymmetrical, editorial "layered" effect.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. Let images of beauty products or models bleed off the edge of the screen to suggest a larger world.
*   **Do** use `primary_fixed` (#ffdbd1) for background accents to inject "warmth" into white spaces.
*   **Do** prioritize vertical white space (`spacing-12` or `16`) between major service sections.

### Don't
*   **Don't** use 1px dividers. If you feel the need to separate content, increase the spacing or change the background tone slightly.
*   **Don't** use sharp corners. Nothing in this system should be less than `sm` (0.5rem), and most containers should be `lg` or `xl`.
*   **Don't** use "pure" grey. Every neutral in this system is tinted with peach or rose tones to maintain an "inviting" atmosphere.