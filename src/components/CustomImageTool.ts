import Image from '@editorjs/image';

interface ImageToolData {
  file: {
    url: string;
  };
  caption: string;
  withBorder: boolean;
  withBackground: boolean;
  stretched: boolean;
}

interface ImageToolConfig {
  uploader: {
    uploadByFile: (file: File) => Promise<any>;
    uploadByUrl: (url: string) => Promise<any>;
  };
  captionPlaceholder: string;
}

export default class CustomImageTool extends Image {
  private maxCaptionLength = 100;
  private captionInput: HTMLInputElement | null = null;
  private counter: HTMLElement | null = null;
  private static globalObserver: MutationObserver | null = null;

  constructor({ data, config, api, readOnly }: any) {
    super({ data, config, api, readOnly });
  }

  render() {
    const wrapper = super.render();
    
    // Add character limit functionality to caption input
    // Use multiple attempts to ensure the DOM is ready
    this.initializeCharacterLimit(wrapper);

    return wrapper;
  }

  private initializeCharacterLimit(wrapper: HTMLElement) {
    // Try multiple times with different selectors and delays
    const attempts = [
      () => this.findCaptionInput(wrapper, '.cdx-input.image-tool__caption'),
      () => this.findCaptionInput(wrapper, '.image-tool__caption'),
      () => this.findCaptionInput(wrapper, 'input[placeholder*="caption"]'),
      () => this.findCaptionInput(wrapper, 'input[data-placeholder*="caption"]'),
      () => this.findCaptionInput(wrapper, '.cdx-input'),
    ];

    let attemptIndex = 0;
    const tryNextAttempt = () => {
      if (attemptIndex < attempts.length) {
        const found = attempts[attemptIndex]();
        if (!found && attemptIndex < attempts.length - 1) {
          attemptIndex++;
          setTimeout(tryNextAttempt, 200);
        }
      }
    };

    // Start with immediate attempt
    tryNextAttempt();
    
    // Also try after a delay
    setTimeout(tryNextAttempt, 100);
    setTimeout(tryNextAttempt, 500);
    setTimeout(tryNextAttempt, 1000);
  }

  private findCaptionInput(wrapper: HTMLElement, selector: string): boolean {
    const captionInput = wrapper.querySelector(selector) as HTMLInputElement;
    
    if (!captionInput || this.captionInput === captionInput) {
      return false;
    }

    this.captionInput = captionInput;
    this.addCaptionCharacterLimit(captionInput);
    return true;
  }

  private addCaptionCharacterLimit(captionInput: HTMLInputElement) {
    // Remove any existing counter
    if (this.counter) {
      this.counter.remove();
    }

    // Create character counter element
    this.counter = document.createElement('div');
    this.counter.className = 'caption-character-counter';
    this.counter.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 12px;
      color: #999;
      pointer-events: none;
      z-index: 10;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-weight: 500;
    `;

    // Make caption input container relative positioned
    const captionContainer = captionInput.parentElement;
    if (captionContainer) {
      captionContainer.style.position = 'relative';
      captionContainer.appendChild(this.counter);
    }

    // Set up MutationObserver to watch for DOM changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              // Check if this is a new caption input
              if (element.classList.contains('cdx-input') && 
                  (element.classList.contains('image-tool__caption') || 
                   element.getAttribute('placeholder')?.includes('caption'))) {
                this.addCaptionCharacterLimit(element as HTMLInputElement);
              }
            }
          });
        }
      });
    });

    // Start observing the caption input's parent
    if (captionContainer) {
      observer.observe(captionContainer, {
        childList: true,
        subtree: true
      });
    }

    // Update counter function
    const updateCounter = () => {
      const currentLength = captionInput.value.length;
      const remaining = this.maxCaptionLength - currentLength;
      
      if (this.counter) {
        this.counter.textContent = `${currentLength}/${this.maxCaptionLength}`;
        
        // Change color based on remaining characters
        if (remaining < 0) {
          this.counter.style.color = '#ef4444'; // Red for over limit
          captionInput.style.borderColor = '#ef4444';
          captionInput.style.borderWidth = '1px';
          captionInput.style.borderStyle = 'solid';
        } else if (remaining <= 10) {
          this.counter.style.color = '#f59e0b'; // Orange for warning
          captionInput.style.borderColor = '#f59e0b';
          captionInput.style.borderWidth = '1px';
          captionInput.style.borderStyle = 'solid';
        } else {
          this.counter.style.color = '#999'; // Default gray
          captionInput.style.borderColor = 'transparent';
          captionInput.style.borderWidth = '0';
          captionInput.style.borderStyle = 'none';
        }
      }
    };

    // Remove any existing event listeners by cloning the element
    const newCaptionInput = captionInput.cloneNode(true) as HTMLInputElement;
    captionInput.parentNode?.replaceChild(newCaptionInput, captionInput);
    this.captionInput = newCaptionInput;

    // Add comprehensive event listeners
    const enforceLimit = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.value.length > this.maxCaptionLength) {
        target.value = target.value.substring(0, this.maxCaptionLength);
        // Move cursor to end
        target.setSelectionRange(this.maxCaptionLength, this.maxCaptionLength);
      }
      updateCounter();
    };

    // Input event - handles typing, pasting, etc.
    newCaptionInput.addEventListener('input', enforceLimit);

    // Beforeinput event - prevents input before it happens
    newCaptionInput.addEventListener('beforeinput', (e) => {
      const target = e.target as HTMLInputElement;
      const currentLength = target.value.length;
      
      // Allow backspace, delete, arrow keys, etc.
      const allowedKeys = [
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
        'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'
      ];
      
      if (allowedKeys.includes(e.inputType || '')) {
        return;
      }
      
      // Prevent input if at character limit
      if (currentLength >= this.maxCaptionLength) {
        e.preventDefault();
      }
    });

    // Keydown event for additional protection
    newCaptionInput.addEventListener('keydown', (e) => {
      const target = e.target as HTMLInputElement;
      const currentLength = target.value.length;
      
      // Allow backspace, delete, arrow keys, etc.
      const allowedKeys = [
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
        'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'
      ];
      
      if (allowedKeys.includes(e.key)) {
        return;
      }
      
      // Prevent typing if at character limit
      if (currentLength >= this.maxCaptionLength) {
        e.preventDefault();
      }
    });

    // Paste event with immediate handling
    newCaptionInput.addEventListener('paste', (e) => {
      setTimeout(() => {
        const target = e.target as HTMLInputElement;
        if (target.value.length > this.maxCaptionLength) {
          target.value = target.value.substring(0, this.maxCaptionLength);
          target.setSelectionRange(this.maxCaptionLength, this.maxCaptionLength);
        }
        updateCounter();
      }, 0);
    });

    // Initial counter update
    updateCounter();

    // Add maxlength attribute as additional protection
    newCaptionInput.setAttribute('maxlength', this.maxCaptionLength.toString());
    newCaptionInput.setAttribute('data-maxlength', this.maxCaptionLength.toString());

    // Add a global observer to catch any dynamically created caption inputs
    this.setupGlobalObserver();
  }

  private setupGlobalObserver() {
    // Only set up the global observer once
    if (CustomImageTool.globalObserver) {
      return;
    }

    CustomImageTool.globalObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element;
              
              // Look for caption inputs in the added nodes
              const captionInputs = element.querySelectorAll?.('.cdx-input.image-tool__caption, .image-tool__caption, input[placeholder*="caption"]') || [];
              
              captionInputs.forEach((input) => {
                const htmlInput = input as HTMLInputElement;
                if (!htmlInput.hasAttribute('data-character-limit-applied')) {
                  this.applyCharacterLimitToInput(htmlInput);
                }
              });
              
              // Also check if the element itself is a caption input
              if (element.classList.contains('cdx-input') && 
                  (element.classList.contains('image-tool__caption') || 
                   element.getAttribute('placeholder')?.includes('caption'))) {
                const htmlInput = element as HTMLInputElement;
                if (!htmlInput.hasAttribute('data-character-limit-applied')) {
                  this.applyCharacterLimitToInput(htmlInput);
                }
              }
            }
          });
        }
      });
    });

    // Start observing the entire document
    CustomImageTool.globalObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private applyCharacterLimitToInput(input: HTMLInputElement) {
    // Mark as processed to avoid duplicate processing
    input.setAttribute('data-character-limit-applied', 'true');
    
    // Set maxlength attribute
    input.setAttribute('maxlength', this.maxCaptionLength.toString());
    
    // Add event listeners
    const enforceLimit = () => {
      if (input.value.length > this.maxCaptionLength) {
        input.value = input.value.substring(0, this.maxCaptionLength);
        input.setSelectionRange(this.maxCaptionLength, this.maxCaptionLength);
      }
    };

    input.addEventListener('input', enforceLimit);
    input.addEventListener('paste', () => {
      setTimeout(enforceLimit, 0);
    });
    
    input.addEventListener('keydown', (e) => {
      const allowedKeys = [
        'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 
        'ArrowUp', 'ArrowDown', 'Home', 'End', 'Tab', 'Enter'
      ];
      
      if (!allowedKeys.includes(e.key) && input.value.length >= this.maxCaptionLength) {
        e.preventDefault();
      }
    });
  }

  validate(savedData: ImageToolData) {
    if (!savedData.file || !savedData.file.url) {
      return false;
    }

    // Validate caption length
    if (savedData.caption && savedData.caption.length > this.maxCaptionLength) {
      return false;
    }

    return true;
  }

  save(blockContent: HTMLElement): ImageToolData {
    const image = blockContent.querySelector('img');
    const caption = blockContent.querySelector('.cdx-input.image-tool__caption') as HTMLInputElement;
    
    // Ensure caption doesn't exceed limit
    let captionValue = caption?.value || '';
    if (captionValue.length > this.maxCaptionLength) {
      captionValue = captionValue.substring(0, this.maxCaptionLength);
    }
    
    return {
      file: {
        url: image?.src || ''
      },
      caption: captionValue,
      withBorder: false,
      withBackground: false,
      stretched: false
    };
  }
}