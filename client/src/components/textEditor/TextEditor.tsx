import React, { useCallback } from 'react';
import { EditorContent, JSONContent } from '@tiptap/react';
import { Box, Button, Paper } from '@mui/material';
import { toast } from 'react-hot-toast';

import { useTextEditor } from 'hooks';
import { EditorToolbar } from './EditorToolbar';
import './TextEditor.css';

// get JSON/HTML to save to db & display in non-edit mode: https://tiptap.dev/guide/output
// TODO: set up converter to also store data as HTML ?? in case need to switch to different editor in the future

// sandbox: https://codesandbox.io/s/github/OscarDantas/tiptap-react/tree/main/?file=/src/components/Tiptap.tsx

export interface TextEditorProps {
  onSave?: (content: JSONContent) => void;
  placeholder?: string;
}

export const TextEditor: React.FC<TextEditorProps> = ({ onSave }) => {
  const editor = useTextEditor();
  // const editor = useEditor({
  //   extensions: [
  //     Color.configure({ types: [TextStyle.name, ListItem.name] }), // @ts-ignore
  //     TextStyle.configure({ types: [ListItem.name] }),
  //     Link,
  //     StarterKit.configure({
  //       bulletList: {
  //         keepMarks: true,
  //         keepAttributes: false,
  //       },
  //       orderedList: {
  //         keepMarks: true,
  //         keepAttributes: false,
  //       },
  //       heading: {
  //         levels: [1, 2, 3],
  //       },
  //     }),
  //     FontFamily,
  //     FontSize,
  //     Placeholder.configure({
  //       placeholder, // can change msg depending on node - if (node.type.name === 'heading')...
  //     }),
  //     TextAlign.configure({
  //       types: ['heading', 'paragraph'],
  //     }),
  //     // ExtendedTextStyle,
  //   ],
  //   content: `
  //     <h2>
  //       Hi there,
  //     </h2>
  //     <p>
  //       this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
  //     </p>
  //     <ul>
  //       <li>
  //         That’s a bullet list with one …
  //       </li>
  //       <li>
  //         … or two list items.
  //       </li>
  //     </ul>
  //     <p>
  //       Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
  //     </p>
  //     <pre><code class="language-css">body {
  //       display: none;
  //     }</code></pre>
  //     <p>
  //       I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
  //     </p>
  //     <blockquote>
  //       Wow, that’s amazing. Good work! 👏
  //       <br />
  //       — Mom
  //     </blockquote>
  //   `,
  // });

  const handleSave = useCallback(() => {
    if (!onSave) return toast.error('Missing save function');
    const json = editor?.getJSON();
    if (!json) return toast.error('No content to save');

    return onSave(json);
  }, [editor, onSave]);

  return (
    <Box>
      <Box sx={{ py: 2, display: 'flex' }}>
        <Box sx={{ flex: '1 1 auto' }}>
          <EditorToolbar editor={editor} />
        </Box>
        {onSave && (
          <Box sx={{ flex: '0 0 auto', pl: 3 }}>
            <Button variant='contained' size='small' onClick={handleSave}>
              Save
            </Button>
          </Box>
        )}
      </Box>
      <Paper sx={{ p: { xs: 3, sm: 3, md: 5 } }}>
        <EditorContent editor={editor} />
      </Paper>
    </Box>
  );
};
