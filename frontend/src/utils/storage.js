const PREFIX = 'comicfrog:';

export function getLastAddDefaults() {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}lastAdd`) || '{}');
  } catch {
    return {};
  }
}

export function saveLastAddDefaults(values) {
  localStorage.setItem(`${PREFIX}lastAdd`, JSON.stringify({
    publisher: values.publisher || '',
    series: values.series || '',
    issueNumber: values.issueNumber || '',
  }));
}

export function getPreferences() {
  try {
    return JSON.parse(localStorage.getItem(`${PREFIX}prefs`) || '{}');
  } catch {
    return {};
  }
}

export function savePreferences(prefs) {
  const current = getPreferences();
  localStorage.setItem(`${PREFIX}prefs`, JSON.stringify({ ...current, ...prefs }));
}
