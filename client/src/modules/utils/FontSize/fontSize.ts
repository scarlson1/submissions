import '@tiptap/extension-text-style';

import { Extension } from '@tiptap/core';

export const DEFAULT_FONT_SIZE = '16px';

export const FONT_SIZES = [
  '8px',
  '9px',
  '10px',
  '11px',
  '12px',
  '13px',
  '14px',
  '16px',
  '18px',
  '20px',
  '22px',
  '24px',
  '26px',
  '28px',
  '30px',
  '36px',
  '40px',
  '48px',
  '60px',
  '74px',
  '96px',
];

export type FontSizeOptions = {
  types: string[];
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font family
       */
      setFontSize: (fontSize: string) => ReturnType;
      /**
       * Unset the font family
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Extension.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
      sizes: [...FONT_SIZES],
      defaultAlignment: DEFAULT_FONT_SIZE,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: DEFAULT_FONT_SIZE,
            parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain()
            .setMark('textStyle', { fontSize: DEFAULT_FONT_SIZE })
            .removeEmptyTextStyle()
            .run();
        },
    };
  },
});
