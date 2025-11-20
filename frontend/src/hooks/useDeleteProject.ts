import { useState } from 'react';
import { deleteProject } from '../lib/api';

export interface UseDeleteProjectResult {
  deleteProject: (projectId: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useDeleteProject = (): UseDeleteProjectResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProjectFn = async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await deleteProject(projectId);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete project');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteProject: deleteProjectFn, isLoading, error };
};