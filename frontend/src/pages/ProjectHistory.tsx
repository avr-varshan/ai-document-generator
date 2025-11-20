import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../lib/api';
import { DashboardLayout } from '../components/DashboardLayout';
import { ArrowLeftIcon, SparklesIcon, ChatBubbleLeftIcon, HandThumbUpIcon, ClockIcon } from '@heroicons/react/24/outline';

export const ProjectHistory = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.getProject(id!),
    enabled: !!id,
  });

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['project-history', id],
    queryFn: () => projectApi.getProjectHistory(id!),
    enabled: !!id,
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'refinement':
        return <SparklesIcon className="w-5 h-5 text-blue-600" />;
      case 'feedback':
        return <HandThumbUpIcon className="w-5 h-5 text-green-600" />;
      case 'comment':
        return <ChatBubbleLeftIcon className="w-5 h-5 text-gray-600" />;
      case 'generation':
        return <SparklesIcon className="w-5 h-5 text-accent" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'refinement':
        return 'bg-blue-100 border-blue-300';
      case 'feedback':
        return 'bg-green-100 border-green-300';
      case 'comment':
        return 'bg-gray-100 border-gray-300';
      case 'generation':
        return 'bg-accent-100 border-accent-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Back to Project
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Project History</h1>
            {project && (
              <p className="text-gray-600">{project.title}</p>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-card p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <ClockIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No history yet</h3>
              <p className="text-gray-600">Activity will appear here as you work on your project</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

              <div className="space-y-6">
                {history.map((event) => {
                  const { date, time } = formatTimestamp(event.timestamp);
                  return (
                    <div key={event.id} className="relative pl-16">
                      <div className={`absolute left-4 w-8 h-8 rounded-full border-2 flex items-center justify-center bg-white ${getEventColor(event.event_type)}`}>
                        {getEventIcon(event.event_type)}
                      </div>

                      <div className="bg-white rounded-lg shadow-card p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900 capitalize mb-1">
                              {event.event_type}
                            </h3>
                            {event.section_id && (
                              <p className="text-sm text-gray-500">
                                Section {project?.outline?.find(s => s.id === event.section_id)?.order}
                              </p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            <p className="text-gray-900 font-medium">{date}</p>
                            <p className="text-gray-500">{time}</p>
                          </div>
                        </div>
                        <p className="text-gray-700">{event.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
