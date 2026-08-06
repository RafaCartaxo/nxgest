export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary:   { DEFAULT: "var(--color-primary)", hover: "var(--color-primary-hover)", light: "var(--color-primary-light)", text: "var(--color-primary-text)" },
        success:   { DEFAULT: "var(--color-success)", hover: "var(--color-success-hover)", light: "var(--color-success-light)", text: "var(--color-success-text)", border: "var(--color-success-border)" },
        warning:   { DEFAULT: "var(--color-warning)", light: "var(--color-warning-light)", text: "var(--color-warning-text)" },
        danger:    { DEFAULT: "var(--color-danger)", hover: "var(--color-danger-hover)", light: "var(--color-danger-light)", text: "var(--color-danger-text)" },
        info:      { DEFAULT: "var(--color-info)", light: "var(--color-info-light)", text: "var(--color-info-text)" },
        secondary: { DEFAULT: "var(--color-secondary)", light: "var(--color-secondary-light)" },
        surface:         { DEFAULT: "var(--color-surface)", secondary: "var(--color-surface-secondary)", hover: "var(--color-surface-hover)" },
        accent:    { DEFAULT: "var(--color-accent)", light: "var(--color-accent-light)", text: "var(--color-accent-text)" },
        muted:     { DEFAULT: "var(--color-muted)", foreground: "var(--color-muted-foreground)" },
        card:      { DEFAULT: "var(--color-card)", foreground: "var(--color-card-foreground)" },
        background:       "var(--color-background)",
        foreground:       "var(--color-foreground)",
        ring:             "var(--color-ring)",
        sidebar:   { DEFAULT: "var(--color-sidebar)", foreground: "var(--color-sidebar-foreground)", muted: "var(--color-sidebar-muted)", active: "var(--color-sidebar-active)", "active-foreground": "var(--color-sidebar-active-foreground)", border: "var(--color-sidebar-border)" },
        "text-primary":  "var(--color-text-primary)",
        "text-secondary":"var(--color-text-secondary)",
        "text-muted":    "var(--color-text-muted)",
        border:          { DEFAULT: "var(--color-border)", light: "var(--color-border-light)", strong: "var(--color-border-strong)" },
      },
      borderColor: {
        DEFAULT: "var(--color-border)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        md: "12px",
      },
      animation: {
        "slide-in-right": "slideInRight 0.3s ease-out",
        "slide-in-left": "slideInLeft 0.3s ease-out",
        "slide-in-from-bottom": "slideInFromBottom 0.25s ease-out",
      },
      keyframes: {
        slideInRight: {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInFromBottom: {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
