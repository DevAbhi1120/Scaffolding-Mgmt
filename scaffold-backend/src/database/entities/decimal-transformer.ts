export const DecimalTransformer = {
  to: (value?: number | null) => {
    if (value === null || value === undefined) return null;
    return value;
  },
  from: (value?: string | null) => {
    if (value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  },
};
