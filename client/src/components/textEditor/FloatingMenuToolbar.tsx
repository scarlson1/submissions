import { FloatingMenu, Editor } from '@tiptap/react';
import { Button } from '@mui/material';

const buttonProps = {
  m: 0.25,
  px: 1,
  py: 0.5,
  fontSize: '0.725rem',
  minWidth: 30,
  minHeight: 24,
  borderRadius: 0.5,
  bgcolor: 'background.paper',
  '&:hover': { bgcolor: 'background.paper' },
};

export interface FloatingMenuToolbarProps {
  editor?: Editor;
}

export const FloatingMenuToolbar = ({ editor }: FloatingMenuToolbarProps) => {
  if (!editor) return null;

  return (
    <FloatingMenu editor={editor} tippyOptions={{ duration: 100 }}>
      <Button
        size='small'
        variant='outlined'
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        // selected={editor.isActive('heading', { level: 1 })}
        sx={{ ...buttonProps }}
      >
        h1
      </Button>
      <Button
        size='small'
        variant='outlined'
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        // selected={editor.isActive('heading', { level: 2 })}
        sx={{ ...buttonProps }}
      >
        h2
      </Button>
      <Button
        size='small'
        variant='outlined'
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        // selected={editor.isActive('heading', { level: 2 })}
        sx={{ ...buttonProps }}
      >
        h3
      </Button>
      <Button
        size='small'
        variant='outlined'
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        // selected={editor.isActive('bulletList')}
        sx={{ ...buttonProps }}
      >
        bullet list
      </Button>
    </FloatingMenu>
  );
};
