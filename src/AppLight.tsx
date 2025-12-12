import { ClayButtonLight } from './components/light/ClayButtonLight';
import { ClayCardLight } from './components/light/ClayCardLight';
import { ClayInputLight } from './components/light/ClayInputLight';
import { ClayToggleLight } from './components/light/ClayToggleLight';
import { ClayBadgeLight } from './components/light/ClayBadgeLight';
import { ClayProgressLight } from './components/light/ClayProgressLight';
import { Droplets, Sparkles, Waves, Zap, Sun } from 'lucide-react';
import './styles/paint-drip.css';
import './styles/clay-texture.css';
import './styles/neomorphism.css';

export default function AppLight() {
  return (
    <div className="min-h-screen neomorphic-bg p-8 relative">
      {/* Neomorphic subtle edge treatment */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/20 via-transparent to-gray-200/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-12 text-center">
          <div className="inline-block mb-6 clay-light-morphism-glow">
            <h1 className="text-6xl bg-gradient-to-r from-stone-600 via-neutral-700 to-zinc-600 bg-clip-text text-transparent mb-4" style={{
              textShadow: '2px 2px 4px rgba(255, 255, 255, 0.9), -2px -2px 3px rgba(163, 177, 198, 0.3)'
            }}>
              Neomorphic Clay Design Kit
            </h1>
          </div>
          <p className="text-stone-600 text-xl" style={{
            textShadow: '1px 1px 2px rgba(255, 255, 255, 0.8)'
          }}>
            3D Neomorphism with Soft Extrusions & Clay Realism
          </p>
        </div>

        {/* Main Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Buttons Section */}
          <ClayCardLight title="Buttons">
            <div className="flex flex-wrap gap-4">
              <ClayButtonLight variant="primary">
                <Sparkles className="w-5 h-5" />
                Primary
              </ClayButtonLight>
              <ClayButtonLight variant="secondary">
                <Waves className="w-5 h-5" />
                Secondary
              </ClayButtonLight>
              <ClayButtonLight variant="accent">
                <Zap className="w-5 h-5" />
                Accent
              </ClayButtonLight>
              <ClayButtonLight variant="ghost">
                <Droplets className="w-5 h-5" />
                Ghost
              </ClayButtonLight>
            </div>
          </ClayCardLight>

          {/* Inputs Section */}
          <ClayCardLight title="Input Fields">
            <div className="space-y-4">
              <ClayInputLight placeholder="Enter your email" type="email" />
              <ClayInputLight placeholder="Enter your password" type="password" />
              <ClayInputLight placeholder="Search..." icon={<Sparkles className="w-5 h-5" />} />
            </div>
          </ClayCardLight>

          {/* Badges Section */}
          <ClayCardLight title="Badges & Pills">
            <div className="flex flex-wrap gap-3">
              <ClayBadgeLight color="purple">New</ClayBadgeLight>
              <ClayBadgeLight color="pink">Featured</ClayBadgeLight>
              <ClayBadgeLight color="blue">Premium</ClayBadgeLight>
              <ClayBadgeLight color="cyan">Beta</ClayBadgeLight>
              <ClayBadgeLight color="violet">Pro</ClayBadgeLight>
            </div>
          </ClayCardLight>

          {/* Toggles Section */}
          <ClayCardLight title="Toggle Switches">
            <div className="space-y-6">
              <ClayToggleLight label="Light Mode" defaultChecked />
              <ClayToggleLight label="Notifications" />
              <ClayToggleLight label="Auto-save" defaultChecked />
            </div>
          </ClayCardLight>

          {/* Progress Section */}
          <ClayCardLight title="Progress Indicators">
            <div className="space-y-6">
              <ClayProgressLight value={35} color="purple" label="Upload Progress" />
              <ClayProgressLight value={72} color="pink" label="Loading Assets" />
              <ClayProgressLight value={90} color="blue" label="Rendering" />
            </div>
          </ClayCardLight>

          {/* Feature Card */}
          <ClayCardLight title="Feature Showcase">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="light-smoke-bubble">
                  <Droplets className="w-6 h-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="text-stone-800 mb-1">Liquid Morphism</h3>
                  <p className="text-stone-600 text-sm">Smooth, flowing 3D effects</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="light-smoke-bubble">
                  <Waves className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-stone-800 mb-1">Soft Gradients</h3>
                  <p className="text-stone-600 text-sm">Gentle, natural color transitions</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="light-smoke-bubble">
                  <Sun className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-stone-800 mb-1">Light Realism</h3>
                  <p className="text-stone-600 text-sm">Soft shadows and highlights</p>
                </div>
              </div>
            </div>
          </ClayCardLight>

        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto mt-12 text-center">
          <div className="inline-block clay-light-morphism-subtle p-6 rounded-3xl">
            <p className="text-stone-600">
              A modern design system featuring pearl clay morphism aesthetics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}