import { useMemo, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionApi } from '../lib/api';
import { toast } from 'react-hot-toast';

function ContentPanel({ project, selectedSectionId }: { project: Project; selectedSectionId: string }) {
    const queryClient = useQueryClient();
    const selectedSection = useMemo(
        () => project.outline.find(s => s.id === selectedSectionId),
        [project, selectedSectionId]
    );

    const [editText, setEditText] = useState(selectedSection?.content ?? '');

    useEffect(() => {
        setEditText(selectedSection?.content ?? '');
    }, [selectedSectionId, selectedSection?.content]);

    const refineMutation = useMutation({
        mutationFn: (prompt: string) =>
            sectionApi.refineSection(project.id, selectedSectionId, prompt), // Added project.id parameter
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            toast.success('Section refined.');
        },
        onError: () => toast.error('Failed to refine section'),
    });

    const saveMutation = useMutation({
        mutationFn: () => sectionApi.updateSectionContent(project.id, selectedSectionId, editText), // Added project.id parameter
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
            toast.success('Content saved.');
        },
        onError: () => toast.error('Failed to save content'),
    });

    return (
        <div className="flex flex-col h-full">
            {/* Editable content area */}
            <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="flex-1 w-full border rounded p-3"
                placeholder="Content will appear here. You can edit directly."
            />
            <div className="mt-3 flex items-center gap-2">
                <button
                    onClick={() => saveMutation.mutate()}
                    disabled={saveMutation.isPending}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                >
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                    onClick={() => {
                        const prompt = window.prompt('Enter refinement prompt (e.g., "make more formal")');
                        if (prompt && prompt.trim()) {
                            refineMutation.mutate(prompt.trim());
                        }
                    }}
                    disabled={refineMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded disabled:opacity-50"
                >
                    {refineMutation.isPending ? 'Refining...' : 'Refine with AI'}
                </button>
            </div>
        </div>
    );
}

export default ContentPanel;