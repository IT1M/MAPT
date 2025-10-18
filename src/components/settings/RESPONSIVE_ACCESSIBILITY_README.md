# Responsive Design and Accessibility Features

## Quick Start

The settings interface now includes comprehensive responsive design and accessibility features. All components automatically adapt to different screen sizes and provide full keyboard and screen reader support.

## Key Features

### 🎯 Touch-Friendly Design
- All interactive elements meet WCAG 44x44px minimum touch target size
- Sticky save buttons on mobile for easy access
- Swipe gestures for navigation on mobile devices

### ⌨️ Keyboard Navigation
- Full keyboard support for all features
- Keyboard shortcuts for common actions
- Visible focus indicators
- Skip links for quick navigation

### 📱 Mobile Responsive
- Navigation converts to drawer on mobile
- Tables convert to cards on small screens
- Forms adapt to full-width on mobile
- Optimized layouts for all screen sizes

### ♿ Screen Reader Support
- Comprehensive ARIA labels and roles
- Live regions for dynamic content
- Semantic HTML structure
- Descriptive labels for all controls

### 🎨 Visual Accessibility
- WCAG AA contrast compliance
- High contrast mode support
- Text scaling up to 200%
- Reduced motion support

## Usage Examples

### Using Keyboard Shortcuts

```typescript
import { useSettingsKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function MyComponent() {
  useSettingsKeyboardShortcuts({
    onSave: () => handleSave(),
    onSearch: () => focusSearch(),
    onEscape: () => closeModal(),
    enabled: true,
  })
  
  return <div>...</div>
}
```

### Announcing to Screen Readers

```typescript
import { announceToScreenReader } from '@/utils/accessibility-settings'

function handleSave() {
  // Save logic...
  announceToScreenReader('Settings saved successfully')
}
```

### Responsive Table/Card View

The `UserTable` component automatically switches between table and card view based on screen size:

```typescript
<UserTable
  users={users}
  selectedUsers={selectedUsers}
  onSelect={handleSelect}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onToggleStatus={handleToggleStatus}
  currentUserId={currentUserId}
/>
```

### Sticky Save Button

Forms automatically have sticky save buttons on mobile:

```typescript
<ProfileForm
  profile={profile}
  onUpdate={handleUpdate}
/>
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search input |
| `Ctrl/Cmd + S` | Save current settings |
| `Esc` | Close modal or sidebar |
| `Tab` | Navigate to next element |
| `Shift + Tab` | Navigate to previous element |
| `↑` `↓` | Navigate within lists |
| `Enter` | Activate button or link |
| `Space` | Toggle checkbox or button |

## Mobile Gestures

| Gesture | Action |
|---------|--------|
| Swipe Right | Open navigation sidebar |
| Swipe Left | Close navigation sidebar |

## Accessibility Checklist

When adding new components, ensure:

- [ ] All interactive elements are keyboard accessible
- [ ] Touch targets are at least 44x44px
- [ ] ARIA labels are present on all controls
- [ ] Form fields have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Component works at 200% text scaling
- [ ] Focus indicators are visible
- [ ] Semantic HTML is used

## Testing

### Manual Testing

1. **Keyboard Navigation**
   ```bash
   # Test with keyboard only (no mouse)
   - Tab through all elements
   - Use keyboard shortcuts
   - Navigate forms with Tab/Shift+Tab
   ```

2. **Screen Reader**
   ```bash
   # Test with screen reader enabled
   - NVDA (Windows)
   - JAWS (Windows)
   - VoiceOver (Mac/iOS)
   - TalkBack (Android)
   ```

3. **Mobile**
   ```bash
   # Test on mobile devices or emulator
   - Verify touch targets
   - Test swipe gestures
   - Check sticky buttons
   - Verify card layouts
   ```

### Automated Testing

Run accessibility tests:
```bash
npm test -- accessibility.test.tsx
```

Run Lighthouse audit:
```bash
npm run lighthouse
```

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

## Screen Reader Support

- ✅ NVDA (Windows)
- ✅ JAWS (Windows)
- ✅ VoiceOver (macOS/iOS)
- ✅ TalkBack (Android)

## Common Issues and Solutions

### Issue: Focus indicator not visible
**Solution**: Check that `accessibility.css` is imported in `globals.css`

### Issue: Keyboard shortcuts not working
**Solution**: Ensure `useKeyboardShortcuts` hook is called in the component

### Issue: Screen reader not announcing changes
**Solution**: Verify ARIA live region exists and `announceToScreenReader` is called

### Issue: Touch targets too small on mobile
**Solution**: Add `min-h-[44px] min-w-[44px]` classes to interactive elements

### Issue: Table not converting to cards on mobile
**Solution**: Check viewport width detection in `UserTable` component

## Performance Considerations

- Keyboard shortcuts use efficient event delegation
- Swipe gestures are debounced to prevent excessive updates
- Mobile card view only renders visible items
- ARIA live regions are throttled to prevent announcement spam

## Customization

### Changing Keyboard Shortcuts

Edit `src/hooks/useKeyboardShortcuts.ts`:

```typescript
export function useSettingsKeyboardShortcuts({
  onSave,
  onSearch,
  onEscape,
  enabled = true,
}: {
  onSave?: () => void
  onSearch?: () => void
  onEscape?: () => void
  enabled?: boolean
}) {
  const shortcuts: KeyboardShortcut[] = []

  if (onSave) {
    shortcuts.push({
      key: 's',
      ctrlKey: true,
      metaKey: true,
      callback: () => onSave(),
      description: 'Save current settings',
      preventDefault: true,
    })
  }
  
  // Add more shortcuts...
}
```

### Customizing Touch Target Size

Edit `src/styles/accessibility.css`:

```css
/* Change minimum touch target size */
button,
a[role="button"],
input[type="button"],
input[type="submit"],
input[type="reset"] {
  min-height: 48px; /* Increase from 44px */
  min-width: 48px;
}
```

### Customizing Swipe Threshold

Edit `src/components/settings/SettingsLayout.tsx`:

```typescript
const handleSwipe = () => {
  const swipeThreshold = 75 // Increase from 50
  const diff = touchStartX - touchEndX

  if (Math.abs(diff) > swipeThreshold) {
    // Handle swipe...
  }
}
```

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

## Support

For issues or questions:
1. Check the [ACCESSIBILITY_IMPLEMENTATION.md](./ACCESSIBILITY_IMPLEMENTATION.md) documentation
2. Review the [TASK_9_IMPLEMENTATION_SUMMARY.md](./TASK_9_IMPLEMENTATION_SUMMARY.md)
3. Run the accessibility tests
4. Contact the development team

## Contributing

When contributing accessibility features:
1. Follow WCAG 2.1 Level AA guidelines
2. Test with keyboard only
3. Test with screen readers
4. Test on mobile devices
5. Add tests for new features
6. Update documentation

## License

This implementation follows the project's license terms.
