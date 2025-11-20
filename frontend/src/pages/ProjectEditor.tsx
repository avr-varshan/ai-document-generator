import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, sectionApi } from '../lib/api';
import { OutlinePanel } from '../components/OutlinePanel';
import { ContentPanel } from '../components/ContentPanel';
import { RefinementPanel } from '../components/RefinementPanel';
import { ArrowLeftIcon, ArrowDownTrayIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const ProjectEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
  });

  const generateContentMutation = useMutation({
    mutationFn: () => projectApi.generateContent(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      toast.success('Content generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate content');
    },
  });

  const refineMutation = useMutation({
    mutationFn: ({ sectionId, prompt }: { sectionId: string; prompt: string }) =>
      sectionApi.refineSection(sectionId, prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['section-history', selectedSectionId] });
      toast.success('Section refined successfully!');
    },
    onError: () => {
      toast.error('Failed to refine section');
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: ({ sectionId, type }: { sectionId: string; type: 'like' | 'dislike' }) =>
      sectionApi.submitFeedback(sectionId, { feedback_type: type }),
    onSuccess: () => {
      toast.success('Feedback submitted');
      queryClient.invalidateQueries({ queryKey: ['section-history', selectedSectionId] });
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    },
  });

  const commentMutation = useMutation({
    mutationFn: ({ sectionId, comment }: { sectionId: string; comment: string }) =>
      sectionApi.addComment(sectionId, { comment }),
    onSuccess: () => {
      toast.success('Comment added');
      queryClient.invalidateQueries({ queryKey: ['section-history', selectedSectionId] });
    },
    onError: () => {
      toast.error('Failed to add comment');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => projectApi.exportDocument(id!),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project?.title || 'document'}.${project?.document_type || 'docx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document exported successfully!');
    },
    onError: () => {
      toast.error('Failed to export document');
    },
  });

  const handleAddSection = () => {};

  const selectedSection = project?.outline?.find((s) => s.id === selectedSectionId) || null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Project not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-primary hover:text-primary-600 font-medium"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }


  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{project.title}</h1>
              <span className="text-sm text-gray-500 capitalize">{project.document_type} Document</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Confirm Outline & Generate: always available if outline exists */}
            <button
              onClick={() => {
                if (!(project?.outline?.length)) {
                  toast.error('No outline found. Enable AI outline when creating the project or add sections.');
                  return;
                }
                generateContentMutation.mutate();
              }}
              disabled={generateContentMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              {generateContentMutation.isPending ? 'Generating...' : 'Confirm Outline & Generate'}
            </button>

            <button
              onClick={() => navigate(`/projects/${id}/history`)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <ClockIcon className="w-5 h-5" />
              History
            </button>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-600 text-white font-medium rounded-lg transition disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              {exportMutation.isPending ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <div className="md:hidden border-b border-gray-200 bg-white p-4">
          <select
            value={selectedSectionId || ''}
            onChange={(e) => setSelectedSectionId(e.target.value || null)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="">Select a section...</option>
            {project.outline?.map((section) => (
              <option key={section.id} value={section.id}>
                Section {section.order}: {section.title}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden md:block">
          <OutlinePanel
            sections={project.outline || []}
            selectedSectionId={selectedSectionId}
            onSelectSection={setSelectedSectionId}
            projectId={project.id}
          />
        </div>
        <ContentPanel
          section={selectedSection}
          onGenerateContent={() => generateContentMutation.mutate()}
          onFeedback={(type) => selectedSectionId && feedbackMutation.mutate({ sectionId: selectedSectionId, type })}
          onComment={(comment) => selectedSectionId && commentMutation.mutate({ sectionId: selectedSectionId, comment })}
          isGenerating={generateContentMutation.isPending}
        />
        <div className="hidden lg:block">
          <RefinementPanel
            sectionId={selectedSectionId}
            onRefine={(prompt) => selectedSectionId && refineMutation.mutate({ sectionId: selectedSectionId, prompt })}
            isRefining={refineMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};
