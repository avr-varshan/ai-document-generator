import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionApi } from '../lib/api';

function OutlinePanel({ project, onSelect }: { project: Project; onSelect: (sectionId: string) => void }) {
    const queryClient = useQueryClient();

    const reorderMutation = useMutation({
        mutationFn: ({ sectionId, newIndex }: { sectionId: string; newIndex: number }) =>
            sectionApi.reorderSection(project.id, sectionId, newIndex), // Added project.id parameter
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['project', project.id] });
        },
    });

    return (
        <ul className="space-y-2">
            {project.outline.map((s, idx) => (
                <li key={s.id} className="flex items-center justify-between">
                    <button onClick={() => onSelect(s.id)} className="text-left flex-1">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-gray-500">Order: {s.order}</div>
                    </button>
                    <div className="flex items-center gap-2">
                        <button
                            aria-label="Move up"
                            disabled={idx === 0 || reorderMutation.isPending}
                            onClick={() => reorderMutation.mutate({ sectionId: s.id, newIndex: idx - 1 })} // Use array index instead of order
                            className="px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ↑
                        </button>
                        <button
                            aria-label="Move down"
                            disabled={idx === project.outline.length - 1 || reorderMutation.isPending}
                            onClick={() => reorderMutation.mutate({ sectionId: s.id, newIndex: idx + 1 })} // Use array index instead of order
                            className="px-2 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ↓
                        </button>
                    </div>
                </li>
            ))}
        </ul>
    );
}