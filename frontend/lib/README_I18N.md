# i18n (Internationalization) System

This document describes the i18n implementation for the NexaMind AI frontend, supporting bilingual display in Chinese (zh) and English (en).

## Architecture Overview

The i18n system consists of the following components:

1. **i18n Core Class** (`lib/i18n.ts`) - Singleton class managing translations and language state
2. **Translation Files** (`lib/translations.ts`) - Contains all Chinese and English translations
3. **I18n Provider** (`app/providers/i18n.tsx`) - React context provider for i18n functionality
4. **useI18n Hook** - React hook for accessing translation functions in components
5. **Language Switcher** (`components/language-switcher.tsx`) - UI component for switching languages
6. **Initialization Hook** (`lib/init-i18n.ts`) - Hook to register translations at app startup

## Features

- âœ… Singleton pattern for centralized language management
- âœ… Supports Chinese (zh) and English (en)
- âœ… Nested translation keys with dot notation (e.g., `sidebar.knowledgebase`)
- âœ… Parameter interpolation (e.g., `{count}` in translations)
- âœ… LocalStorage persistence for language preference
- âœ… React Context API for global state management
- âœ… Real-time language switching without page reload
- âœ… Type-safe translation keys

## Usage

### 1. Basic Usage in Components

```tsx
'use client';

import { useI18n } from '@/app/providers/i18n';

export function MyComponent() {
  const { t, language, setLanguage, toggleLanguage } = useI18n();

  return (
    <div>
      {/* Simple translation */}
      <h1>{t('common.search')}</h1>
      
      {/* Nested key translation */}
      <p>{t('sidebar.knowledgebase')}</p>
      
      {/* Translation with parameters */}
      <span>{t('time.minutesAgo', { count: 5 })}</span>
      
      {/* Get current language */}
      <p>Current language: {language}</p>
      
      {/* Switch to specific language */}
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('zh')}>ä¸­æ–‡</button>
      
      {/* Toggle between languages */}
      <button onClick={toggleLanguage}>Toggle Language</button>
    </div>
  );
}
```

### 2. Adding New Translations

Edit `lib/translations.ts` to add new translation keys:

```typescript
export const translations: I18nConfig = {
  zh: {
    // Add new Chinese translations
    myFeature: {
      title: 'æˆ‘çš„åŠŸèƒ½',
      description: 'è¿™æ˜¯åŠŸèƒ½æè¿°',
      action: 'ç‚¹å‡»è¿™é‡Œ',
    },
  },
  en: {
    // Add corresponding English translations
    myFeature: {
      title: 'My Feature',
      description: 'This is the feature description',
      action: 'Click here',
    },
  },
};
```

### 3. Translation Key Structure

The translation object is organized by module/page:

```
translations
â”œâ”€â”€ common          - Common UI elements (buttons, actions, etc.)
â”œâ”€â”€ time            - Time-related strings
â”œâ”€â”€ sidebar         - Sidebar navigation items
â”œâ”€â”€ workspace       - Workspace management
â”œâ”€â”€ knowledgebase   - Knowledge base module
â”œâ”€â”€ apps            - Apps module
â”œâ”€â”€ evaluation      - Evaluation module
â”œâ”€â”€ chat            - Chat interface
â”œâ”€â”€ config          - Configuration pages
â”‚   â”œâ”€â”€ model
â”‚   â”œâ”€â”€ vectordb
â”‚   â”œâ”€â”€ search
â”‚   â””â”€â”€ ...
â”œâ”€â”€ messages        - Success/error messages
â””â”€â”€ validation      - Form validation messages
```

### 4. Parameter Interpolation

Use `{paramName}` in translations and pass parameters in the `t()` function:

**Translation:**
```typescript
{
  zh: {
    greeting: 'ä½ å¥½, {name}! ä½ æœ‰ {count} æ¡æ¶ˆæ¯ã€‚'
  },
  en: {
    greeting: 'Hello, {name}! You have {count} messages.'
  }
}
```

**Usage:**
```tsx
{t('greeting', { name: 'Alice', count: 5 })}
// Output (zh): ä½ å¥½, Alice! ä½ æœ‰ 5 æ¡æ¶ˆæ¯ã€‚
// Output (en): Hello, Alice! You have 5 messages.
```

### 5. Using the Language Switcher Component

The language switcher is already integrated in the sidebar:

```tsx
import { LanguageSwitcher } from '@/components/language-switcher';

<LanguageSwitcher />
```

### 6. Direct Access to i18n Instance

For use outside React components (e.g., in utility functions):

```typescript
import { i18n } from '@/lib/i18n';

// Get translation
const text = i18n.t('common.search');

// Get current language
const lang = i18n.getLanguage();

// Set language
i18n.setLanguage('en');

// Toggle language
i18n.toggleLanguage();

// Subscribe to language changes
const unsubscribe = i18n.subscribe(() => {
  console.log('Language changed to:', i18n.getLanguage());
});

// Unsubscribe when done
unsubscribe();
```

## Translation Guidelines

### Best Practices

1. **Key Naming Convention**
   - Use lowercase with camelCase for nested keys
   - Use descriptive names that indicate the context
   - Group related translations under the same parent key

2. **Keep Translations Consistent**
   - Ensure both Chinese and English have the same structure
   - Use the same parameters in both languages
   - Maintain consistent tone and style

3. **Avoid Hardcoded Strings**
   - Always use translation keys instead of hardcoded strings
   - Move all user-facing text to translation files

4. **Test Both Languages**
   - Verify translations in both languages
   - Check that UI layout works for both short and long text

### Example Migration

**Before:**
```tsx
<Button>åˆ›å»º</Button>
<h1>çŸ¥è¯†åº“</h1>
<p>è¿˜æ²¡æœ‰åˆ›å»ºä»»ä½•çŸ¥è¯†åº“</p>
```

**After:**
```tsx
const { t } = useI18n();

<Button>{t('common.create')}</Button>
<h1>{t('knowledgebase.title')}</h1>
<p>{t('knowledgebase.emptyMessage')}</p>
```

## Integration in Existing Components

The i18n system is already integrated in:

- âœ… `app/layout.tsx` - I18nProvider wrapper
- âœ… `components/app-sidebar.tsx` - Sidebar navigation and language switcher
- ðŸ”„ Other components need to be migrated to use translations

### Steps to Migrate a Component

1. Import the `useI18n` hook
2. Extract the `t` function
3. Replace hardcoded strings with `t('key')`
4. Add missing translations to `lib/translations.ts`

Example:

```tsx
'use client';

import { useI18n } from '@/app/providers/i18n';

export function MyPage() {
  const { t } = useI18n();
  
  return (
    <div>
      <h1>{t('mypage.title')}</h1>
      <Button>{t('common.save')}</Button>
    </div>
  );
}
```

## API Reference

### `useI18n()` Hook

Returns an object with:

- `language: Language` - Current language ('zh' | 'en')
- `setLanguage(lang: Language): void` - Set language
- `toggleLanguage(): void` - Toggle between languages
- `t(key: string, params?: Record<string, string | number>): string` - Get translation

### `i18n` Singleton Class

Methods:

- `i18n.t(key, params?)` - Get translation
- `i18n.getLanguage()` - Get current language
- `i18n.setLanguage(lang)` - Set language
- `i18n.toggleLanguage()` - Toggle language
- `i18n.registerTranslations(translations)` - Register translations
- `i18n.subscribe(callback)` - Subscribe to language changes

## File Structure

```
frontend/
â”œâ”€â”€ app/
â”‚   â”œâ”€â”€ layout.tsx                 # I18nProvider integration
â”‚   â””â”€â”€ providers/
â”‚       â””â”€â”€ i18n.tsx               # I18n Context Provider
â”œâ”€â”€ components/
â”‚   â””â”€â”€ language-switcher.tsx      # Language switcher UI
â””â”€â”€ lib/
    â”œâ”€â”€ i18n.ts                    # Core i18n class
    â”œâ”€â”€ translations.ts            # All translations
    â”œâ”€â”€ init-i18n.ts              # Initialization hook
    â””â”€â”€ README_I18N.md            # This file
```

## Troubleshooting

### Translation Not Showing

1. Check if the key exists in `lib/translations.ts`
2. Verify the key path is correct (case-sensitive)
4. Check browser console for errors

### Language Not Persisting

1. Check localStorage in browser DevTools
2. Verify localStorage is enabled in the browser
3. Check for localStorage quota issues

### Component Not Re-rendering on Language Change

1. Ensure the component uses `useI18n()` hook
2. Verify the component is wrapped by `I18nProvider`
3. Check that the component is accessing `t()` from the hook, not directly from the i18n instance

## Future Enhancements

Potential improvements:

- [ ] Add more languages (Japanese, Korean, etc.)
- [ ] Lazy loading of translation files
- [ ] Translation file splitting by module
- [ ] Translation management UI
- [ ] Pluralization support
- [ ] Date/time formatting per locale
- [ ] Number formatting per locale
- [ ] RTL (Right-to-Left) language support

## Contributing

When adding new features:

1. Add translation keys for all user-facing text
2. Provide both Chinese and English translations
3. Test in both languages
4. Update this documentation if adding new patterns or features
