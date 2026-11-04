import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// `npm run icons` turns the flag logo into every icon size Android and iPhone need.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background: '#1F5D3A' } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background: '#1F5D3A' } },
  },
  images: ['public/icon-source.svg'],
});
