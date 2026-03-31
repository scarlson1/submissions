import { Color } from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import ListItem from '@tiptap/extension-list-item';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import {
  Content,
  EditorOptions,
  useEditor,
  type Extensions,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useMemo } from 'react';

import FontSize from 'modules/textEditor/FontSize';

export const EDITOR_EXTENSION_DEFAULTS: Extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  // @ts-expect-error
  TextStyle.configure({ types: [ListItem.name] }),
  Underline,
  Link,
  Highlight.configure({ multicolor: true }),
  // @ts-expect-error parent type issue
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
    placeholder: 'Write something …',
  }),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
  }),
  FontSize,
];

export interface UseTextEditorProps extends Partial<EditorOptions> {
  initContent?: Content;
}

export const useTextEditor = ({
  initContent = '',
  extensions = [],
  ...props
}: UseTextEditorProps) => {
  const extns = useMemo(
    () => [...EDITOR_EXTENSION_DEFAULTS, ...extensions],
    [extensions],
  );

  const editor = useEditor({
    content: initContent,
    extensions: extns,
    ...props,
  });

  return editor;
};
