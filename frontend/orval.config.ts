import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: `http://localhost:8081/v3/api-docs`,
    output: {
      mode: 'tags-split',
      target: 'src/features/api',
      schemas: 'src/model',
      client: 'react-query',
      tsconfig: './tsconfig.app.json',

      override: {
        mutator: {
          path: './src/lib/api-client.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
