import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sectionApi } from '../lib/api';
import { SparklesIcon, ClockIcon, ChatBubbleLeftIcon, HandThumbUpIcon } from '@heroicons/react/24/outline';

interface RefinementPanelProps {
  sectionId: string | null;
  onRefine: (prompt: string) => void;
  isRefining: boolean;
}

export const RefinementPanel = ({ sectionId, onRefine, isRefining }: RefinementPanelProps) => {
  const [refinementPrompt, setRefinementPrompt] = useState('');

  const { data: history = [] } = useQuery({
    queryKey: ['section-history', sectionId],
    queryFn: () => sectionId ? sectionApi.getSectionHistory(sectionId) : Promise.resolve([]),
    enabled: !!sectionId,
  });

  const handleRefine = () => {
    if (refinementPrompt.trim()) {
      onRefine(refinementPrompt);
      setRefinementPrompt('');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'refinement':
        return <SparklesIcon className="w-4 h-4 text-blue-600" />;
      case 'feedback':
        return <HandThumbUpIcon className="w-4 h-4 text-green-600" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-4 h-4 text-gray-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'refinement':
        return 'bg-blue-50 border-blue-200';
      case 'feedback':
        return 'bg-green-50 border-green-200';
      case 'comment':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (!sectionId) {
    return (
      <div className="w-96 bg-gray-50 border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-sm text-center px-4">Select a section to refine</p>
      </div>
    );
  }

  return (
    <div className="w-96 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Refinement</h2>
        <div className="space-y-3">
          <textarea
            value={refinementPrompt}
            onChange={(e) => setRefinementPrompt(e.target.value)}
            placeholder="Describe how you want to improve this section..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none text-sm"
          />
          <button
            onClick={handleRefine}
            disabled={!refinementPrompt.trim() || isRefining}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            <SparklesIcon className="w-4 h-4" />
            {isRefining ? 'Refining...' : 'Refine Section'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">History</h3>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No history yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border ${getEventColor(event.event_type)}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {getEventIcon(event.event_type)}
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {event.event_type}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{event.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
