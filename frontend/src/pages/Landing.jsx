import Navbar from '../components/landing/Navbar.jsx'
import Hero from '../components/landing/Hero.jsx'
import Features from '../components/landing/Features.jsx'
import Demo from '../components/landing/Demo.jsx'
import Pricing from '../components/landing/Pricing.jsx'
import Footer from '../components/landing/Footer.jsx'

export default function Landing({ theme, onToggleTheme }) {
  return (
    <div style={{ position: 'relative' }}>
      <Navbar theme={theme} onToggleTheme={onToggleTheme} />
      <Hero />
      <Features />
      <Demo />
      <Pricing />
      <Footer />
    </div>
  )
}