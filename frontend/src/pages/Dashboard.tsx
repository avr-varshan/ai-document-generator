import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { ProjectCard } from '../components/ProjectCard';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { projectApi, deleteProject } from '../lib/api'; // Import deleteProject
import toast from 'react-hot-toast';

export const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.listProjects,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // ✅ FIXED: This was calling exportDocument - now calling deleteProject
      await deleteProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete project');
    },
  });

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.main_prompt.toLowerCase().includes(searchQuery.toLowerCase()) // Changed from project.prompt to project.main_prompt
  );

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Projects</h1>
            <p className="text-gray-600">Create and manage your AI-generated documents</p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition"
          >
            <PlusIcon className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-card p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Get started by creating your first AI-powered document'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/projects/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg transition"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};