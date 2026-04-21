# Frame Generation SOP — AI-Generated PNG Frames

Guide for producing and uploading high-quality PNG photo-booth frame templates for MemoriaMagnet.

---

## PNG Specification

| Property | Value |
|----------|-------|
| Dimensions | **2400 × 3600 px** (2:3 portrait) |
| Format | **PNG-32 with alpha channel** |
| Color profile | sRGB |
| Resolution | 300 DPI metadata (print quality) |
| Transparent hole | A clear rectangular area where the guest photo appears |
| File size target | < 5 MB per frame |

The transparent hole must be a clean rectangle — no feathered edges, no partial transparency in the hole area. Everything outside the hole is the decorative frame artwork.

---

## AI Generation Workflow

### 1. Generate base artwork (Midjourney or DALL-E 3)

Use the prompt patterns below. **Key rule:** never include text or typography inside the PNG — event name, date, and tagline are composited at runtime from event data.

#### Wedding — Luxury Gold Foil
```
elegant wedding photo booth frame, gold foil botanical leaves and flowers border, 
ivory cream background, transparent center rectangle, 2:3 portrait orientation, 
no text, flat lay, high detail, isolated on white --ar 2:3 --v 6 --style raw
```

#### Wedding — Modern Editorial
```
minimal modern wedding frame, thin black hairline border, architectural geometric 
corner elements, white background, transparent photo window, editorial magazine 
aesthetic, no text --ar 2:3
```

#### Bar/Bat Mitzvah — Jerusalem
```
bar mitzvah photo booth frame, Star of David motif, deep navy and gold, 
Hebrew pattern border, ornate, no text, transparent center --ar 2:3
```

#### Birthday — Festive
```
birthday celebration photo booth frame, confetti streamers balloons, 
bright coral and gold palette, fun festive, transparent photo hole, no text --ar 2:3
```

#### Brit Milah — Soft
```
brit milah photo frame border, soft blue and white, delicate baby motifs, 
classic elegant, transparent center rectangle, no text --ar 2:3
```

#### General — Minimal
```
minimal clean photo booth frame, subtle shadow border, white with slight warm tint, 
transparent center, timeless, no decorative elements, no text --ar 2:3
```

---

### 2. Post-processing (Photoshop / remove.bg / Figma)

1. **Remove background** from AI output if needed — use `remove.bg` API or Photoshop > Select Subject.
2. **Create the hole:** Draw a white rectangle in the exact position where the photo should appear. Use `Edit > Fill > Content-Aware` or simply delete the pixels in that zone.
3. **Verify alpha:** Open in Preview (Mac) or browser. The hole must be 100% transparent (checkered pattern), not white or semi-transparent.
4. **Export:** File > Export As PNG, ensure "Transparency" / "Alpha Channel" is checked.
5. **Validate:** Open in an image editor, confirm the PNG has an alpha channel (not JPEG mode).

---

### 3. Quality Gates (before upload)

Run through this checklist before uploading to the admin library:

- [ ] File is `.png`, not `.jpg` or `.webp`
- [ ] Alpha channel present (can be verified with `file` command: should say "16-bit/color RGBA")
- [ ] Transparent hole is a clean rectangle (no soft edges)
- [ ] Hole area covers 40-70% of the total frame area
- [ ] No text, names, dates, or numbers inside the PNG
- [ ] Dimensions ≥ 1200 × 1800 px (2400 × 3600 preferred)
- [ ] Frame artwork does not bleed into the center of the hole
- [ ] Color palette matches the category (warm gold for wedding, deep navy for bar mitzvah, etc.)
- [ ] File size < 8 MB

---

### 4. Naming Convention

```
{category}-{style}-{descriptor}-{sequence}.png

Examples:
  wedding-luxury-gold-foil-01.png
  wedding-editorial-black-hairline-01.png
  bar-mitzvah-jerusalem-navy-01.png
  birthday-festive-coral-01.png
  brit-soft-blue-01.png
  general-minimal-clean-01.png
```

---

### 5. Upload via Admin UI

1. Open `memoriashare.com/admin/frames`
2. Click **"העלאת מסגרת"** (top right)
3. Drag your PNG into the drop zone
4. In the **"סמן את אזור התמונה"** panel: drag a rectangle over the transparent hole area
5. Verify the composite preview (right panel) looks correct
6. Fill in: name (Hebrew), slug, category, style, aspect
7. Click **"העלה מסגרת"** — frame uploads to `overlays/library/{style}/{slug}.png` and enters `status: draft`
8. Go to `/admin/frames/moderation` to review and approve

---

### 6. Recommended Batch (initial seed)

Target: **25 frames** across 5 categories before launch.

| Category | Count | Styles |
|----------|-------|--------|
| Wedding | 8 | luxury-gold, editorial-black, botanical-sage, burgundy-foliage |
| Bar/Bat Mitzvah | 6 | jerusalem-navy, rose-bat, tallit-blue, royal-purple |
| Birthday | 4 | coral-festive, pastel-balloon, neon-party, scrapbook |
| Brit | 3 | soft-blue, mint-minimal, ivory-classic |
| General | 4 | minimal-white, cinema-dark, filmstrip, polaroid |

---

### 7. Approved AI Tools (as of April 2026)

| Tool | Use case | Commercial license |
|------|----------|-------------------|
| **Midjourney** (Pro/Mega plan) | Primary generation | ✅ Full commercial rights |
| **DALL-E 3** via ChatGPT Plus | Alternate / variations | ✅ OpenAI ToS allows commercial use |
| **Adobe Firefly** | Post-processing + inpainting | ✅ Commercial safe |
| **remove.bg** | Alpha channel creation | ✅ |
| **Canva Pro** | Layout + export | ✅ with Pro plan |

**Do not use:** free Midjourney (non-commercial), Stable Diffusion models without explicit commercial license verification.
