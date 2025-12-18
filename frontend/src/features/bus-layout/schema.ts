import { z } from 'zod';

export const layoutConfigSchema = z.object({
  name: z.string().min(2, 'Vui lòng điền tên sơ đồ'),
  busType: z.string().min(1, 'Vui lòng chọn loại xe'),
  totalFloors: z.coerce.number().int().min(1).max(2),
  totalRows: z.coerce.number().int().min(1).max(30),
  totalCols: z.coerce.number().int().min(1).max(12),
});

export type LayoutConfigFormValues = z.infer<typeof layoutConfigSchema>;
