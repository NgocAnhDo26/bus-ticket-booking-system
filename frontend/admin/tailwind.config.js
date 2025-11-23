const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
// Import config từ shared lib
const sharedConfig = require('../../libs/shared/ui/tailwind.config.js');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Presets giúp kế thừa theme màu sắc, animation từ shared lib
  presets: [sharedConfig], 
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
};