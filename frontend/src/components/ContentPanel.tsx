import { useState } from 'react';
import { Section } from '../lib/api.ts';
import { HandThumbUpIcon, HandThumbDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { HandThumbUpIcon as HandThumbUpSolidIcon, HandThumbDownIcon as HandThumbDownSolidIcon } from '@heroicons/react/24/solid';

interface ContentPanelProps {
  section: Section | null;
  onGenerateContent: () => void;
  onFeedback: (type: 'like' | 'dislike') => void;
  onComment: (comment: string) => void;
  isGenerating: boolean;
}

export const ContentPanel = ({ section, onGenerateContent, onFeedback, onComment, isGenerating }: ContentPanelProps) => {
  const [comment, setComment] = useState('');
  const [feedbackGiven, setFeedbackGiven] = useState<'like' | 'dislike' | null>(null);

  const handleFeedback = (type: 'like' | 'dislike') => {
    setFeedbackGiven(type);
    onFeedback(type);
  };

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      onComment(comment);
      setComment('');
    }
  };

  if (!section) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a section to view content</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{section.title}</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Section {section.order}</span>
          {!section.content && (
            <button
              onClick={onGenerateContent}
              disabled={isGenerating}
              className="ml-auto flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
            >
              <SparklesIcon className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate Content'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {section.content ? (
          <>
            <div className="prose max-w-none">
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {section.content}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No content yet. Click "Generate Content" to create it.</p>
            </div>
          </div>
        )}
      </div>

      {section.content && (
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback('like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  feedbackGiven === 'like'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {feedbackGiven === 'like' ? (
                  <HandThumbUpSolidIcon className="w-5 h-5" />
                ) : (
                  <HandThumbUpIcon className="w-5 h-5" />
                )}
                Like
              </button>
              <button
                onClick={() => handleFeedback('dislike')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  feedbackGiven === 'dislike'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {feedbackGiven === 'dislike' ? (
                  <HandThumbDownSolidIcon className="w-5 h-5" />
                ) : (
                  <HandThumbDownIcon className="w-5 h-5" />
                )}
                Dislike
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Add Comment</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCommentSubmit()}
                placeholder="Share your thoughts..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              />
              <button
                onClick={handleCommentSubmit}
                disabled={!comment.trim()}
                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
