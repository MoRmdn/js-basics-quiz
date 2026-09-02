export function validateDisplayName(value) {
  const name = value.trim()

  if (!name) return 'Enter your name to continue.'
  if (name.length < 2) return 'Your name must contain at least 2 characters.'
  if (name.length > 40) return 'Your name must contain 40 characters or fewer.'

  return ''
}
