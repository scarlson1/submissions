import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
// import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

// import FontSize from 'modules/utils/FontSize';

export const EDITOR_EXTENSION_DEFAULTS = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }), // @ts-ignore
  TextStyle.configure({ types: [ListItem.name] }),
  Underline,
  Link,
  Highlight.configure({ multicolor: true }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
    heading: {
      levels: [1, 2, 3],
    },
  }),
  FontFamily,
  // Placeholder.configure({
  //   placeholder: 'Write something …',
  // }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  // FontSize,
];
