import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { DocumentTextIcon, PresentationChartBarIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon } from '@heroicons/react/24/outline';
import { projectApi, CreateProjectRequest } from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 1 | 2 | 3;

export const NewProject = () => {
  const [step, setStep] = useState<Step>(1);
  const [documentType, setDocumentType] = useState<'docx' | 'pptx'>('docx');
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [useAiOutline, setUseAiOutline] = useState(true);
  const navigate = useNavigate();

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectApi.createProject(data),
    onSuccess: (data) => {
      toast.success('Project created successfully!');
      navigate(`/projects/${data.id}`);
    },
    onError: () => {
      toast.error('Failed to create project');
    },
  });

  const handleNext = () => {
    if (step === 1 && !documentType) {
      toast.error('Please select a document type');
      return;
    }
    if (step === 2 && (!title.trim() || !prompt.trim())) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (step < 3) {
      setStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as Step);
    }
  };

  const handleCreate = () => {
    createProjectMutation.mutate({
      title,
      document_type: documentType,
      prompt,
      ai_suggest_outline: useAiOutline,
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Project</h1>
            <p className="text-gray-600">Set up your AI-powered document in just a few steps</p>
          </div>

          <div className="flex items-center justify-between mb-12">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition ${
                      step >= s
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s ? <CheckIcon className="w-6 h-6" /> : s}
                  </div>
                  <span className={`ml-3 font-medium ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                    {s === 1 ? 'Type' : s === 2 ? 'Details' : 'Review'}
                  </span>
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 mx-4 rounded ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 1 && (
                <div className="bg-white rounded-lg shadow-card p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Document Type</h2>
                  <div className="grid grid-cols-2 gap-6">
                    <button
                      onClick={() => setDocumentType('docx')}
                      className={`p-8 border-2 rounded-lg transition hover:border-primary ${
                        documentType === 'docx'
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <DocumentTextIcon className={`w-16 h-16 mx-auto mb-4 ${
                        documentType === 'docx' ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Word Document</h3>
                      <p className="text-sm text-gray-600">Create structured text documents with AI</p>
                    </button>
                    <button
                      onClick={() => setDocumentType('pptx')}
                      className={`p-8 border-2 rounded-lg transition hover:border-primary ${
                        documentType === 'pptx'
                          ? 'border-primary bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <PresentationChartBarIcon className={`w-16 h-16 mx-auto mb-4 ${
                        documentType === 'pptx' ? 'text-primary' : 'text-gray-400'
                      }`} />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Presentation</h3>
                      <p className="text-sm text-gray-600">Generate engaging slide decks</p>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="bg-white rounded-lg shadow-card p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Project Details</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Project Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Marketing Strategy 2024"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Main Topic / Prompt <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want the AI to generate..."
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                      <input
                        type="checkbox"
                        id="ai-outline"
                        checked={useAiOutline}
                        onChange={(e) => setUseAiOutline(e.target.checked)}
                        className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                      />
                      <label htmlFor="ai-outline" className="text-sm text-gray-700">
                        Use AI to suggest outline (recommended)
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="bg-white rounded-lg shadow-card p-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">Review & Create</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Document Type</label>
                      <p className="text-lg font-semibold text-gray-900">
                        {documentType === 'docx' ? 'Word Document' : 'Presentation'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
                      <p className="text-lg font-semibold text-gray-900">{title}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Prompt</label>
                      <p className="text-gray-700">{prompt}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">AI Outline</label>
                      <p className="text-gray-700">{useAiOutline ? 'Enabled' : 'Disabled'}</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back
            </button>
            {step < 3 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-600 text-white font-semibold rounded-lg transition"
              >
                Next
                <ArrowRightIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={createProjectMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-600 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                <CheckIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
