export function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
      timer = null;
    }, delay);
  };
}

export function createAutoSave(saveFn, delay = 2000) {
  let timer = null;
  let lastContent = null;
  let saveInProgress = false;
  let saveError = null;
  let lastSaveTime = null;

  const debouncedSave = debounce(async (content, path) => {
    if (content === lastContent || saveInProgress) return;
    saveInProgress = true;
    saveError = null;
    try {
      await saveFn(content, path);
      lastSaveTime = Date.now();
      lastContent = content;
    } catch (err) {
      saveError = err.message || 'Save failed';
    } finally {
      saveInProgress = false;
    }
  }, delay);

  return {
    debouncedSave,
    get state() {
      if (saveInProgress) return 'saving';
      if (saveError) return 'error';
      if (lastSaveTime && Date.now() - lastSaveTime < delay) return 'unsaved';
      return 'saved';
    },
    get error() {
      return saveError;
    },
    get lastSaveTime() {
      return lastSaveTime;
    },
    reset() {
      lastContent = null;
      saveError = null;
      lastSaveTime = null;
      if (timer) clearTimeout(timer);
    },
  };
}
