import React, { useEffect, useRef } from 'react';
import { Text } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { useEditor, Editor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';

interface WritingRichTextEditorProps {
  questionKey: string;
  initialContent: string;
  onContentChange: (questionKey: string, content: string) => void;
  disabled?: boolean;
}

const WritingRichTextEditor: React.FC<WritingRichTextEditorProps> = ({
  questionKey,
  initialContent,
  onContentChange,
  disabled = false
}) => {
  // Use refs to store stable references
  const onContentChangeRef = useRef(onContentChange);
  const questionKeyRef = useRef(questionKey);
  
  // Update refs when props change
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
    questionKeyRef.current = questionKey;
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link,
      Superscript,
      SubScript,
      Highlight,
    ],
    content: initialContent,
    editable: !disabled,
    onUpdate: ({ editor }: { editor: Editor }) => {
      // Use refs to avoid dependency issues
      onContentChangeRef.current(questionKeyRef.current, editor.getHTML());
    },
  });

  if (!editor) {
    return <Text>Loading editor...</Text>;
  }

  return (
    <RichTextEditor editor={editor}>
      <RichTextEditor.Toolbar sticky stickyOffset={60}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Strikethrough />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content 
        style={{ 
          minHeight: 150,
          border: '1px solid #ced4da',
          borderRadius: '4px',
          padding: '12px'
        }}
      />
    </RichTextEditor>
  );
};

export default WritingRichTextEditor;
