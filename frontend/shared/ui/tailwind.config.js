const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(__dirname, '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
        // Copy toàn bộ phần colors, keyframes, animation từ config cũ vào đây
        // (Phần mà mình đã gửi ở câu trả lời trước)
    },
  },
  plugins: [require("tailwindcss-animate")],
};