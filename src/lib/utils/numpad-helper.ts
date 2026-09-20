/**
 * Helper utility for standardizing Windows Numeric Keypad (Numpad) behavior
 * across all numeric and quantity inputs in the application.
 */

export function handleNumpadInputKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  options?: {
    onEnter?: () => void;
    onIncrement?: () => void;
    onDecrement?: () => void;
    allowDecimal?: boolean;
    allowNegative?: boolean;
  }
) {
  const { onEnter, onIncrement, onDecrement, allowDecimal = true } = options || {};

  // Handle Numpad Enter & standard Enter
  if (e.key === 'Enter' || e.code === 'NumpadEnter') {
    e.preventDefault();
    if (onEnter) {
      onEnter();
    } else {
      (e.target as HTMLInputElement).blur();
    }
    return;
  }

  // Handle Numpad Add (+)
  if (e.key === '+' || e.code === 'NumpadAdd') {
    if (onIncrement) {
      e.preventDefault();
      onIncrement();
      return;
    }
  }

  // Handle Numpad Subtract (-)
  if (e.key === '-' || e.code === 'NumpadSubtract') {
    if (onDecrement) {
      e.preventDefault();
      onDecrement();
      return;
    }
  }

  // Handle Numpad Decimal (, or .) on Spanish/Latin Windows keypads
  if (allowDecimal && (e.key === ',' || e.code === 'NumpadDecimal' || e.code === 'Decimal')) {
    const input = e.target as HTMLInputElement;
    const currentVal = input.value;
    
    // If input already has a decimal point, prevent second one
    if (currentVal.includes('.')) {
      e.preventDefault();
      return;
    }

    // Replace comma with dot if event key is comma
    if (e.key === ',') {
      e.preventDefault();
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newVal = currentVal.substring(0, start) + '.' + currentVal.substring(end);
      
      // Dispatch synthetic input event for React controlled state
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, newVal);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Keep cursor position
      setTimeout(() => {
        input.setSelectionRange(start + 1, start + 1);
      }, 0);
    }
  }
}

/**
 * Standard onFocus handler that auto-selects all content
 * so typing on the physical Windows numpad immediately overwrites previous digits.
 */
export function handleNumericInputFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.target.select();
}
