import Image from '@editorjs/image';

/**
 * Custom Image Tool that extends the default EditorJS Image tool
 * to include size information in the block data
 */
export default class CustomImageTool extends Image {
  static get toolbox() {
    return {
      title: 'Image',
      icon: '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-67 49v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>'
    };
  }

  constructor({ data, config, api, readOnly }: any) {
    super({ data, config, api, readOnly });
    
    // Store reference to the wrapper for size detection
    this._wrapper = null;
    this._imageElement = null;
  }

  render() {
    const wrapper = super.render();
    this._wrapper = wrapper;
    
    // Find the image element
    const imageElement = wrapper.querySelector('img');
    if (imageElement) {
      this._imageElement = imageElement;
      
      // Apply stored dimensions if they exist
      if (this.data.customWidth) {
        imageElement.style.width = `${this.data.customWidth}px`;
      }
      if (this.data.customHeight) {
        imageElement.style.height = `${this.data.customHeight}px`;
      }
      
      // Set up size tracking
      this._setupSizeTracking(imageElement);
    }
    
    return wrapper;
  }

  /**
   * Setup size tracking for the image element
   */
  _setupSizeTracking(imageElement: HTMLImageElement) {
    // Use MutationObserver to detect style changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          this._updateSizeData();
        }
      });
    });

    observer.observe(imageElement, {
      attributes: true,
      attributeFilter: ['style']
    });

    // Also track resize events
    const resizeObserver = new ResizeObserver(() => {
      this._updateSizeData();
    });
    
    resizeObserver.observe(imageElement);
  }

  /**
   * Update the block data with current image dimensions
   */
  _updateSizeData() {
    if (!this._imageElement) return;
    
    const computedStyle = window.getComputedStyle(this._imageElement);
    const width = parseInt(computedStyle.width);
    const height = parseInt(computedStyle.height);
    
    // Only update if dimensions are valid and different
    if (width > 0 && height > 0) {
      if (this.data.customWidth !== width || this.data.customHeight !== height) {
        this.data.customWidth = width;
        this.data.customHeight = height;
        
        console.log('Updated image block data with size:', {
          width,
          height,
          url: this.data.file?.url
        });
      }
    }
  }

  /**
   * Save method - includes size information
   */
  save(blockContent: HTMLElement) {
    const data = super.save(blockContent);
    
    // Ensure size information is included
    if (this._imageElement) {
      const computedStyle = window.getComputedStyle(this._imageElement);
      const width = parseInt(computedStyle.width);
      const height = parseInt(computedStyle.height);
      
      if (width > 0 && height > 0) {
        data.customWidth = width;
        data.customHeight = height;
      }
    }
    
    // Include any existing size data
    if (this.data.customWidth) {
      data.customWidth = this.data.customWidth;
    }
    if (this.data.customHeight) {
      data.customHeight = this.data.customHeight;
    }
    
    console.log('Saving image block with data:', data);
    
    return data;
  }

  /**
   * Validation method
   */
  validate(savedData: any) {
    const isValid = super.validate ? super.validate(savedData) : true;
    
    // Additional validation for our custom fields
    if (savedData.customWidth && (typeof savedData.customWidth !== 'number' || savedData.customWidth <= 0)) {
      return false;
    }
    if (savedData.customHeight && (typeof savedData.customHeight !== 'number' || savedData.customHeight <= 0)) {
      return false;
    }

    return isValid;
  }
}