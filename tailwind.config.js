/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      // ─── Typography ───────────────────────────────────────────────
      fontFamily: {
        // Display / headings
        playfair: ['"Playfair Display"', 'Georgia', 'serif'],
        // Labels, caps, UI chrome — spaced tracking
        montserrat: ['Montserrat', 'sans-serif'],
        // Body + all Hebrew text — RTL-optimised
        heebo: ['Heebo', 'sans-serif'],
      },

      letterSpacing: {
        // Uppercase small-caps style (labels, section titles)
        editorial: '0.15em',
        // Looser display heading tracking
        display: '0.06em',
      },

      // ─── Border radius ────────────────────────────────────────────
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

        // ── POV brand indigo — periwinkle, cool, editorial-tech ──
        // Anchor: indigo-500 = #7c86e1 (POV accent)
        // Use directly: bg-indigo-500, text-indigo-300, border-indigo-700
        indigo: {
          50:  '#eff0fc',
          100: '#dde0f7',
          200: '#c5cbf2',
          300: '#a9b1ec',
          400: '#8c97e6',
          500: '#7c86e1',  // ← brand primary
          600: '#4d5bd3',
          700: '#3540ae',
          800: '#282f87',
          900: '#1b2060',
          950: '#0f1239',
        },

        // ── Cool neutrals — replace warm grays ──
        // Anchor: cool-900 = #1e1e1e (POV background)
        // Use: bg-cool-950, text-cool-300, border-cool-800
        cool: {
          50:  '#fafafa',
          100: '#f0f0f0',
          200: '#d8d8d8',
          300: '#b4b4b4',
          400: '#8a8a8a',
          500: '#6b6b6b',
          600: '#4a4a4a',
          700: '#333333',
          800: '#252525',
          900: '#1e1e1e',  // ← POV background
          950: '#0e0e0e',
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
        // Indigo CTA glow
        'indigo-glow': '0 0 28px -4px rgba(124,134,225,0.40)',
        'indigo-soft': '0 4px 20px -4px rgba(124,134,225,0.25)',
        // Dark glass card (white-alpha inset per POV)
        'glass':     '0 8px 32px -4px rgba(0,0,0,0.65), inset 0 1px 0 rgba(252,252,254,0.10)',
        // Subtle dark card
        'card-dark': '0 2px 16px rgba(0,0,0,0.55)',
        // Top inset highlight (glass edge)
        'inner-top': 'inset 0 1px 0 rgba(252,252,254,0.07)',
      },

      // ─── Backgrounds ──────────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        // Vignette
        'vignette':          'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.72) 100%)',
        // Loading shimmer — white-alpha sweep
        'shimmer':           'linear-gradient(90deg, transparent 0%, rgba(252,252,254,0.04) 50%, transparent 100%)',
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
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'shimmer-pass': {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'paper-fly': {
          '0%':   { transform: 'translate(0,0) rotate(0deg)',        opacity: '1' },
          '45%':  { transform: 'translate(28px,-22px) rotate(10deg)', opacity: '1' },
          '72%':  { transform: 'translate(46px,-38px) rotate(14deg)', opacity: '0.55' },
          '100%': { transform: 'translate(0,0) rotate(0deg)',        opacity: '1' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(1.05)' },
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
        'float-slow':     'float 6s ease-in-out infinite',
        'shimmer-pass':   'shimmer-pass 4s infinite linear',
        'paper-fly':      'paper-fly 1.3s ease-in-out infinite',
        'pulse-slow':     'pulse-slow 4s ease-in-out infinite',
        'shimmer':        'shimmer-pass 4s infinite linear',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
