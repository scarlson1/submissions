import { Extension } from '@tiptap/react';

/**
 * FontSize - Custom Extension
 * editor.commands.setFontSize(e.target.value) :set the font-size.
 */

// --------- add this block ---- vvvvvv ----------
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size
       */
      setFontSize: (size: string) => ReturnType;
      /**
       * Unset the font size
       */
      unsetFontSize: () => ReturnType;
    };
  }
}
// ---------------- add this block ----- ^^^^ --------------

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize.replace(/['"]+/g, ''),
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
          return chain()
            .setMark('textStyle', { fontSize: fontSize + 'px' })
            .run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

// import '@tiptap/extension-text-style';

// import { Extension } from '@tiptap/core';

// export type FontSizeOptions = {
//   types: string[];
// };

// declare module '@tiptap/core' {
//   interface Commands<ReturnType> {
//     fontSize: {
//       /**
//        * Set the font family
//        */
//       setFontSize: (fontSize: string) => ReturnType;
//       /**
//        * Unset the font family
//        */
//       unsetFontSize: () => ReturnType;
//     };
//   }
// }

// export const FontSize = Extension.create<FontSizeOptions>({
//   name: 'fontSize',

//   addOptions() {
//     return {
//       types: ['textStyle'],
//     };
//   },

//   addGlobalAttributes() {
//     return [
//       {
//         types: this.options.types,
//         attributes: {
//           fontSize: {
//             default: null,
//             parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, ''), // (/^[0-9]*$/g, ''),
//             renderHTML: (attributes) => {
//               if (!attributes.fontSize) {
//                 return {};
//               }

//               return {
//                 style: `font-size: ${attributes.fontSize}`,
//               };
//             },
//           },
//         },
//       },
//     ];
//   },
//   // @ts-ignore
//   addCommands() {
//     return {
//       setFontSize:
//         (fontSize: any) =>
//         ({ chain }: any) => {
//           return chain().setMark('textStyle', { fontSize }).run();
//         },
//       unsetFontSize:
//         () =>
//         ({ chain }: any) => {
//           return chain().setMark('textStyle', { fontSize: null }).removeEmptyTextStyle().run();
//         },
//     };
//   },
// });

// export default FontSize;

// import TextStyle from '@tiptap/extension-text-style';

// // https://stackoverflow.com/questions/70564092/tiptap-font-size-react

// declare module '@tiptap/core' {
//   interface Commands<ReturnType> {
//     fontSize: {
//       /**
//        * Set the font size
//        */
//       setFontSize: (size: string) => ReturnType;
//       /**
//        * Unset the font size
//        */
//       unsetFontSize: () => ReturnType;
//     };
//   }
// }

// export const TextStyleExtended = TextStyle.extend({
//   addAttributes() {
//     return {
//       ...this.parent?.(),
//       fontSize: {
//         default: null,
//         parseHTML: (element) => element.style.fontSize.replace('px', ''),
//         renderHTML: (attributes) => {
//           if (!attributes['fontSize']) {
//             return {};
//           }
//           return {
//             style: `font-size: ${attributes['fontSize']}px`,
//           };
//         },
//       },
//     };
//   },

//   addCommands() {
//     return {
//       ...this.parent?.(),
//       setFontSize:
//         (fontSize) =>
//         ({ commands }) => {
//           return commands.setMark(this.name, { fontSize: fontSize });
//         },
//       unsetFontSize:
//         () =>
//         ({ chain }) => {
//           return chain().setMark(this.name, { fontSize: null }).removeEmptyTextStyle().run();
//         },
//     };
//   },
// });
