module.exports = {
    darkMode: ['class'],
    content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			// Tiffany Blue Brand Colors (Primary)
  			brand: {
  				bg: '#FFFFFF',           // Main background (MUST BE WHITE)
  				surface: '#F9FBFB',      // Card backgrounds
  				surfaceAlt: '#F3F7F7',   // Hover states
  				border: '#E5EBEE',       // Borders/dividers
  				primary: '#37C5B8',      // Tiffany blue (PRIMARY ACCENT)
  				primarySoft: '#E6F7F5',  // Chip backgrounds
  				primaryDark: '#0F9A8C',  // Hover states
  			},
  			text: {
  				main: '#0F172A',         // Headings
  				body: '#4B5563',         // Body text
  				muted: '#6B7280',        // Secondary text
  				subtle: '#9CA3AF',       // Meta labels
  			},
  			state: {
  				goodBg: '#E6F7F5',
  				goodText: '#0F766E',
  				newBg: '#E0F2FE',
  				newText: '#0369A1',
  			},
  			// ShadCN UI System Colors
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")]
}
