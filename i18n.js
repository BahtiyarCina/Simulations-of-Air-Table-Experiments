// Internationalization (i18n) System
let currentLanguage = localStorage.getItem('appLanguage') || 'tr';
let translations = {};

// Load language file
async function loadLanguage(lang) {
  try {
    const response = await fetch(`${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;
    localStorage.setItem('appLanguage', lang);
    updateUI();
    // Emit custom event for language change
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  } catch (error) {
    console.error(`Error loading language file ${lang}.json:`, error);
  }
}

// Translate function - returns translation or key if not found
function t(key) {
  const keys = key.split('.');
  let value = translations;
  for (let k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  return value || key;
}

// Update all elements with data-i18n attribute
function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  // Update titles and tooltips
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    el.title = t(key);
  });
}

function switchLanguage(lang) {
  loadLanguage(lang);
}

// Initialize language on page load
document.addEventListener('DOMContentLoaded', function() {
  loadLanguage(currentLanguage);
});
