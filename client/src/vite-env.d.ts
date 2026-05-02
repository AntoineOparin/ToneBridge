/<reference types="vite/client" />

declare module '../../tailwind.config.js' {
  const config: {
    content: string[]
    theme: {
      extend: {
        colors: {
          brand: Record<string, string>
          surface: Record<string, string>
          accent: Record<string, string>
        }
        fontFamily: {
          sans: string[]
          display: string[]
        }
      }
    }
    plugins: unknown[]
  }
  export default config
}
