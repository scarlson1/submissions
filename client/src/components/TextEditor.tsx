import React, { useCallback, useMemo } from 'react';
import { useEditor, EditorContent, Editor, JSONContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import FontFamily from '@tiptap/extension-font-family';
import { Box, Button, ButtonGroup, Paper, ToggleButton, ToggleButtonGroup } from '@mui/material';

import './TextEditor.css';
import { toast } from 'react-hot-toast';
import { FormatBoldRounded, FormatItalicRounded } from '@mui/icons-material';

// get JSON/HTML to save to db & display in non-edit mode: https://tiptap.dev/guide/output
// TODO: set up converter to also store data as HTML ?? in case need to switch to different editor in the future

export interface TextEditorProps {
  onSave?: (content: JSONContent) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({ onSave }) => {
  const editor = useEditor({
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
    ],
    content: `
      <h2>
        Hi there,
      </h2>
      <p>
        this is a <em>basic</em> example of <strong>tiptap</strong>. Sure, there are all kind of basic text styles you’d probably expect from a text editor. But wait until you see the lists:
      </p>
      <ul>
        <li>
          That’s a bullet list with one …
        </li>
        <li>
          … or two list items.
        </li>
      </ul>
      <p>
        Isn’t that great? And all of that is editable. But wait, there’s more. Let’s try a code block:
      </p>
      <pre><code class="language-css">body {
        display: none;
      }</code></pre>
      <p>
        I know, I know, this is impressive. It’s only the tip of the iceberg though. Give it a try and click a little bit around. Don’t forget to check the other examples too.
      </p>
      <blockquote>
        Wow, that’s amazing. Good work! 👏
        <br />
        — Mom
      </blockquote>
    `,
  });

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
          <MenuBar editor={editor} />
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

interface MenuBarProps {
  editor?: Editor | null;
}

const MenuBar: React.FC<MenuBarProps> = ({ editor }) => {
  const setLink = useCallback(() => {
    const previousUrl = editor?.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }
    if (url === '') {
      editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const boldActive = editor?.isActive('bold');
  const italicActive = editor?.isActive('italic');

  const handleFormat = useCallback(
    (event: React.MouseEvent<HTMLElement>, newFormats: string[]) => {
      if (!editor) return;
      if (newFormats.includes('bold') !== boldActive) {
        editor.chain().focus().toggleBold().run();
      }
      if (newFormats.includes('italic') !== italicActive) {
        editor.chain().focus().toggleItalic().run();
      }
    },
    [editor, boldActive, italicActive]
  );

  const formats = useMemo(() => {
    let activeFormats = [];
    if (boldActive) activeFormats.push('bold');
    if (italicActive) activeFormats.push('italic');
    console.log('ACTIVE FORMATS: ', activeFormats);
    return activeFormats;
  }, [boldActive, italicActive]);

  if (!editor) {
    return null;
  }

  return (
    <>
      <ToggleButtonGroup
        value={formats}
        onChange={handleFormat}
        size='small'
        aria-label='text formatting'
        sx={{ mx: 1 }}
      >
        <ToggleButton
          value='bold'
          disabled={!editor.can().chain().focus().toggleBold().run()}
          aria-label='bold'
        >
          <FormatBoldRounded />
        </ToggleButton>
        <ToggleButton
          value='italic'
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          aria-label='italic'
        >
          <FormatItalicRounded />
        </ToggleButton>
      </ToggleButtonGroup>
      <ButtonGroup size='small' sx={{ mx: 1 }}>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'is-active' : ''}
        >
          bold
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'is-active' : ''}
        >
          italic
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={editor.isActive('strike') ? 'is-active' : ''}
        >
          strike
        </Button>
      </ButtonGroup>
      <ButtonGroup size='small' sx={{ mx: 1 }}>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={editor.isActive('paragraph') ? 'is-active' : ''}
        >
          paragraph
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          h1
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          h2
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        >
          h3
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
          className={editor.isActive('heading', { level: 4 }) ? 'is-active' : ''}
        >
          h4
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
          className={editor.isActive('heading', { level: 5 }) ? 'is-active' : ''}
        >
          h5
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
          className={editor.isActive('heading', { level: 6 }) ? 'is-active' : ''}
        >
          h6
        </Button>
      </ButtonGroup>
      {/* TODO: use Split Button for font - https://mui.com/material-ui/react-button-group/#split-button */}
      <ButtonGroup size='small'>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('Roboto').run()}
          className={editor.isActive('textStyle', { fontFamily: 'Roboto' }) ? 'is-active' : ''}
        >
          Roboto
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('Helvetica').run()}
          className={editor.isActive('textStyle', { fontFamily: 'Helvetica' }) ? 'is-active' : ''}
        >
          Helvetica
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('Arial').run()}
          className={editor.isActive('textStyle', { fontFamily: 'Arial' }) ? 'is-active' : ''}
        >
          Arial
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('Inter').run()}
          className={editor.isActive('textStyle', { fontFamily: 'Inter' }) ? 'is-active' : ''}
        >
          Inter
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('serif').run()}
          className={editor.isActive('textStyle', { fontFamily: 'serif' }) ? 'is-active' : ''}
        >
          serif
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('sans-serif').run()}
          className={editor.isActive('textStyle', { fontFamily: 'sans-serif' }) ? 'is-active' : ''}
        >
          sans-serif
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('monospace').run()}
          className={editor.isActive('textStyle', { fontFamily: 'monospace' }) ? 'is-active' : ''}
        >
          monospace
        </Button>
        <Button
          size='small'
          onClick={() => editor.chain().focus().setFontFamily('tahoma').run()}
          className={editor.isActive('textStyle', { fontFamily: 'tahoma' }) ? 'is-active' : ''}
        >
          tahoma
        </Button>
        <Button size='small' onClick={() => editor.chain().focus().unsetFontFamily().run()}>
          unset
        </Button>
      </ButtonGroup>
      <Button size='small' onClick={() => editor.chain().focus().unsetColor().run()}>
        unset color
      </Button>
      <input
        type='color'
        onInput={(event: any) => editor.chain().focus().setColor(event.target.value).run()}
        value={editor.getAttributes('textStyle').color}
        style={{ marginLeft: '4px', marginRight: '4px' }}
      />
      <Button
        size='small'
        onClick={() => editor.chain().focus().setColor('#958DF1').run()}
        className={editor.isActive('textStyle', { color: '#958DF1' }) ? 'is-active' : ''}
      >
        purple
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        bullet list
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
      >
        ordered list
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
      >
        code block
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
      >
        blockquote
      </Button>
      <Button size='small' onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        divider
      </Button>
      <Button size='small' onClick={() => editor.chain().focus().setHardBreak().run()}>
        hard break
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'is-active' : ''}
      >
        code
      </Button>
      <Button size='small' onClick={setLink} className={editor.isActive('link') ? 'is-active' : ''}>
        link
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
      >
        unsetLink
      </Button>
      <Button size='small' onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        clear marks
      </Button>
      <Button size='small' onClick={() => editor.chain().focus().clearNodes().run()}>
        clear nodes
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        undo
      </Button>
      <Button
        size='small'
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        redo
      </Button>
    </>
  );
};
