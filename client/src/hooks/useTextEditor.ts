import { JSONContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';

import FontSize from 'modules/utils/FontSize';

export interface UseTextEditorProps {
  initContent?: string | JSONContent;
  placeholder?: string;
  viewOnly?: boolean;
}

export const useTextEditor = ({
  initContent = '',
  placeholder = 'Write something …',
  viewOnly = false,
}) => {
  const editor = useEditor({
    content: initContent,
    editable: !viewOnly,
    extensions: [
      Color.configure({ types: [TextStyle.name, ListItem.name] }), // @ts-ignore
      TextStyle.configure({ types: [ListItem.name] }),
      Link,
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
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      FontSize,
    ],
  });

  return editor;
};
