import { Link } from 'react-router-dom';
import { DocumentTextIcon, PresentationChartBarIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Project } from '../lib/api.ts';
import { motion } from 'framer-motion';
import { useState } from 'react';

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export const ProjectCard = ({ project, onDelete }: ProjectCardProps) => {
  const isDocx = project.document_type === 'docx';
  const Icon = isDocx ? DocumentTextIcon : PresentationChartBarIcon;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirmed) {
      setDeleteConfirmed(true);
      return;
    }

    setIsDeleting(true);

    try {
      // Call the onDelete prop which will trigger the react-query mutation
      onDelete(project.id);
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmed(false); // Reset state after action
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-card hover:shadow-elevated transition-all duration-300 p-6 border border-gray-100 hover:border-gray-200"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl ${isDocx ? 'bg-blue-50' : 'bg-green-50'}`}>
            <Icon className={`w-7 h-7 ${isDocx ? 'text-blue-600' : 'text-green-600'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg leading-tight">{project.title}</h3>
            <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${
              isDocx ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {project.document_type.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
        {project.main_prompt || project.prompt}
      </p>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">{formatDate(project.created_at)}</span>

        <div className="flex items-center gap-2">
          <Link
            to={`/projects/${project.id}`}
            className="px-4 py-2 bg-primary hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Open
          </Link>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`relative px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1
              ${isDeleting
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : deleteConfirmed
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-transparent text-gray-400 hover:text-red-600 hover:bg-red-50'
              }
            `}
            title={deleteConfirmed ? "Click again to confirm delete" : "Delete project"}
          >
            {isDeleting ? (
              <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : deleteConfirmed ? (
              <CheckIcon className="w-4 h-4 text-red-600" />
            ) : (
              <TrashIcon className="w-4 h-4" />
            )}
            {deleteConfirmed ? 'Confirm' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Visual feedback for delete confirmation */}
      {deleteConfirmed && !isDeleting && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700"
        >
          <p className="flex items-center gap-1">
            <span className="text-red-500">⚠️</span> Click "Delete" again to permanently remove this project and all its content.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};