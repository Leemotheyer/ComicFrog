export function requireFroglogAuth(settings) {
  return (_req, res, next) => {
    if (!settings.isConfigured()) {
      return res.status(401).json({
        error: 'Froglog is not configured. Add your login details in Settings.',
        code: 'NOT_CONFIGURED',
      });
    }
    next();
  };
}
