import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Section, projectApi, sectionApi } from '../lib/api';
import { PlusIcon, Bars3Icon } from '@heroicons/react/24/outline';

interface OutlinePanelProps {
  sections: Section[];
  selectedSectionId: string | null;
  onSelectSection: (id: string) => void;
  projectId: string;
}

export const OutlinePanel = ({ sections, selectedSectionId, onSelectSection, onAddSection, projectId }: OutlinePanelProps) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: async (title: string) => {
      const order = (sections?.length || 0) + 1; // append at end (1-based)
      return projectApi.addSection(projectId, { title, order });
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      const last = created[created.length - 1];
      if (last?.id) onSelectSection(String(last.id));
      setIsAdding(false);
      setNewTitle('');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: ({ sectionId, newIndex }: { sectionId: string; newIndex: number }) =>
      sectionApi.reorderSection(sectionId, newIndex + 1), // backend is 1-based
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'generated':
        return 'bg-green-100 text-green-700';
      case 'refined':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Outline</h2>
        {isAdding ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Section title"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
            <div className="flex gap-2">
              <button
                onClick={() => addMutation.mutate(newTitle)}
                disabled={!newTitle.trim() || addMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
              >
                <PlusIcon className="w-4 h-4" />
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition"
          >
            <PlusIcon className="w-4 h-4" />
            Add Section
          </button>
        )}
      </div>

      <div className="p-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bars3Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No sections yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sections.map((section, idx) => (
              <div
                key={section.id}
                className={`flex items-center justify-between ${draggingId === section.id ? 'opacity-60' : ''}`}
                draggable
                onDragStart={() => setDraggingId(section.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (draggingId) {
                    reorderMutation.mutate({ sectionId: draggingId, newIndex: idx });
                    setDraggingId(null);
                  }
                }}
              >
                <button
                  onClick={() => onSelectSection(section.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedSectionId === section.id ? 'bg-primary-50 border border-primary' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-500">Section {section.order}</span>
                    {section.status && (
                      <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(section.status)}`}>
                        {section.status}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm line-clamp-2">{section.title}</h3>
                </button>
                <div className="flex items-center gap-2 px-2">
                  <button
                    aria-label="Move up"
                    disabled={idx === 0 || reorderMutation.isPending}
                    onClick={() => reorderMutation.mutate({ sectionId: section.id, newIndex: idx - 1 })}
                    className="px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↑
                  </button>
                  <button
                    aria-label="Move down"
                    disabled={idx === sections.length - 1 || reorderMutation.isPending}
                    onClick={() => reorderMutation.mutate({ sectionId: section.id, newIndex: idx + 1 })}
                    className="px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
