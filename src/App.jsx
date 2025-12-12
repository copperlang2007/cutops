import './App.css'
import '@/styles/neomorphism.css'
import '@/styles/dark-neomorphism.css'
import '@/styles/clay-texture.css'
import '@/styles/paint-drip.css'
import '@/styles/dark-paint-drip.css'
import '@/styles/electricity-animation.css'
import Pages from "@/pages/index.jsx"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <>
      <Pages />
      <Toaster />
    </>
  )
}

export default App 