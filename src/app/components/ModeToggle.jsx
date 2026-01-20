import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import styles from './ModeToggle.module.css'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={styles.button}
      aria-label="Toggle theme"
    >
      <Sun className={styles.sun} />
      <Moon className={styles.moon} />
    </button>
  )
}