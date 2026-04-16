export function parsePositiveIntegerParam(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsedValue = Number(value)

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    return fallback
  }

  return parsedValue
}

export function parseOptionalNumberParam(value: string | null): number | undefined {
  if (!value) {
    return undefined
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue)) {
    return undefined
  }

  return parsedValue
}

export function parseCsvParam(value: string | null): string[] | undefined {
  if (!value) {
    return undefined
  }

  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return items.length > 0 ? items : undefined
}
