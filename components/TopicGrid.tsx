import React from 'react';
import { Topic } from '../types';
import * as Icons from 'lucide-react';

interface TopicGridProps {
  topics: Topic[];
  onSelect: (topic: Topic) => void;
  loading: boolean;
}

const TopicGrid: React.FC<TopicGridProps> = ({ topics, onSelect, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-48 bg-gray-200 rounded-xl shadow-sm"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {topics.map((topic) => {
        // Dynamic icon rendering
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const IconComponent = (Icons as any)[topic.icon] || Icons.BookOpen;

        return (
          <button
            key={topic.id}
            onClick={() => onSelect(topic)}
            className="group flex flex-col items-start p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-lg hover:border-indigo-100 hover:bg-indigo-50/30 transition-all duration-300 text-left"
          >
            <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <IconComponent size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">{topic.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{topic.description}</p>
          </button>
        );
      })}
    </div>
  );
};

export default TopicGrid;
