import React, { useEffect, useRef, useState } from 'react';
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
  wordLimit?: number | null;
}

const WritingRichTextEditor: React.FC<WritingRichTextEditorProps> = ({
  questionKey,
  initialContent,
  onContentChange,
  disabled = false,
  wordLimit = null
}) => {
  // Use refs to store stable references
  const onContentChangeRef = useRef(onContentChange);
  const questionKeyRef = useRef(questionKey);
  const [lastValidContent, setLastValidContent] = useState(initialContent);

  // Update refs when props change
  useEffect(() => {
    onContentChangeRef.current = onContentChange;
    questionKeyRef.current = questionKey;
  });

  // Count words in text (remove HTML tags)
  const countWords = (text: string) => {
    if (!text) return 0;
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    if (!plainText) return 0;
    return plainText.split(/\s+/).length;
  };

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
      const newContent = editor.getHTML();
      const newWordCount = countWords(newContent);
      const lastWordCount = countWords(lastValidContent);

      // If word limit exists and new content exceeds limit
      if (wordLimit && newWordCount > wordLimit) {
        // Only revert if we're adding words, not removing
        if (newWordCount > lastWordCount) {
          editor.commands.setContent(lastValidContent);
          return;
        }
      }

      // Update content if within limit or no limit
      setLastValidContent(newContent);
      onContentChangeRef.current(questionKeyRef.current, newContent);
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


