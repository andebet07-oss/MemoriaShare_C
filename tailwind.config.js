/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // ─── Typography ───────────────────────────────────────────────
      fontFamily: {
        // Display / headings — matches the logo serif monogram
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        // Labels, caps, UI chrome — spaced tracking
        montserrat: ['Montserrat', 'sans-serif'],
        // Body + all Hebrew text — RTL-optimised
        heebo: ['Heebo', 'sans-serif'],
      },

      letterSpacing: {
        // Editorial small-caps style (used on labels, section titles)
        editorial: '0.15em',
        // Looser display heading tracking
        display: '0.06em',
      },

      // ─── Border radius — editorial: almost sharp ──────────────────
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      // ─── Color system ─────────────────────────────────────────────
      colors: {
        // Semantic tokens (driven by CSS variables in index.css)
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input:  'hsl(var(--input))',
        ring:   'hsl(var(--ring))',

        // ── Memoria brand gold — champagne, warm, luxury ──
        // Use these directly: bg-gold-500, text-gold-300, border-gold-700 etc.
        gold: {
          50:  '#fdf8ef',
          100: '#f8edcf',
          200: '#f0d89b',
          300: '#e6be62',
          400: '#dca83c',
          500: '#c9a96e',  // ← brand primary
          600: '#b08942',
          700: '#8a6932',
          800: '#6a502a',
          900: '#4a3820',
        },

        // ── Warm neutrals — replace cold Tailwind grays ──
        // Use: bg-warm-950, text-warm-300, border-warm-800 etc.
        warm: {
          50:  '#f8f4ed',
          100: '#ede8df',
          200: '#d8d1c5',
          300: '#bfb5a5',
          400: '#a09180',
          500: '#7d7066',
          600: '#5e5450',
          700: '#3d3835',
          800: '#201e1c',
          900: '#141210',
          950: '#0a0908',
        },

        // Chart colors
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },

        // Sidebar
        sidebar: {
          DEFAULT:             'hsl(var(--sidebar-background))',
          foreground:          'hsl(var(--sidebar-foreground))',
          primary:             'hsl(var(--sidebar-primary))',
          'primary-foreground':'hsl(var(--sidebar-primary-foreground))',
          accent:              'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border:              'hsl(var(--sidebar-border))',
          ring:                'hsl(var(--sidebar-ring))',
        },
      },

      // ─── Shadows ──────────────────────────────────────────────────
      boxShadow: {
        // Gold CTA glow
        'gold-glow': '0 0 28px -4px rgba(201,169,110,0.40)',
        'gold-soft': '0 4px 20px -4px rgba(201,169,110,0.25)',
        // Dark glass card
        'glass':     '0 8px 32px -4px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        // Subtle dark card
        'card-dark': '0 2px 16px rgba(0,0,0,0.55)',
        // Top inset highlight (glass edge)
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.07)',
      },

      // ─── Backgrounds ──────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        // Vignette: matches the logo background treatment
        'vignette':          'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)',
        // Loading shimmer
        'shimmer':           'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },

      // ─── Animations ───────────────────────────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer-sweep': {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.4s ease-out',
        'fade-in-fast':   'fade-in-fast 0.2s ease-out',
        'slide-up':       'slide-up 0.5s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':       'scale-in 0.25s cubic-bezier(0.16,1,0.3,1)',
        'shimmer-sweep':  'shimmer-sweep 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
