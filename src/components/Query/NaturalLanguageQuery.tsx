import React, { useState, useRef } from 'react';
import {
  PaperAirplaneIcon,
  SparklesIcon,
  MicrophoneIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import { useAppStore } from '../../store/appStore';

interface NaturalLanguageQueryProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  className?: string;
}

const NaturalLanguageQuery: React.FC<NaturalLanguageQueryProps> = ({
  onSubmit,
  isLoading = false,
  className,
}) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { addToHistory } = useAppStore();

  // 示例查询建议
  const suggestions = [
    '北京过去5年的年平均气温变化',
    '比较上海和深圳2023年的降雨量',
    '全球变暖对中国的影响',
    '今年夏天哪个城市最热？',
    '近10年极端天气事件趋势',
    '查看纽约和伦敦的湿度对比',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      
      // 添加到历史记录
      addToHistory({
        id: Date.now().toString(),
        text: query.trim(),
        intent: { type: 'comparison', confidence: 0.8 },
        entities: [],
        timestamp: new Date(),
      });
      
      setQuery('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleVoiceInput = () => {
    // 语音输入功能 - 这里可以集成语音识别 API
    setIsListening(!isListening);
    // TODO: 实现语音识别功能
  };

  return (
    <div className={clsx(
      'bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg p-6 text-white',
      'shadow-lg',
      className
    )}>
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center justify-center w-8 h-8 bg-white bg-opacity-20 rounded-lg">
          <SparklesIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">智能天气查询</h2>
          <p className="text-primary-100 text-sm">
            用自然语言询问任何天气相关问题
          </p>
        </div>
      </div>

      {/* Query Input Form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="例如：比较北京和上海过去10年的气温变化趋势..."
            className={clsx(
              'w-full px-4 py-3 pr-24 rounded-lg resize-none',
              'bg-white bg-opacity-10 border border-white border-opacity-20',
              'text-white placeholder-primary-200',
              'focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-30',
              'backdrop-blur-sm'
            )}
            rows={3}
            disabled={isLoading}
          />
          
          {/* Action buttons */}
          <div className="absolute bottom-3 right-3 flex items-center space-x-2">
            {/* Voice input button */}
            <button
              type="button"
              onClick={handleVoiceInput}
              className={clsx(
                'p-2 rounded-md transition-all duration-200',
                isListening
                  ? 'bg-red-500 bg-opacity-80 text-white'
                  : 'bg-white bg-opacity-20 hover:bg-opacity-30 text-white'
              )}
              title="语音输入"
              disabled={isLoading}
            >
              <MicrophoneIcon className="h-4 w-4" />
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className={clsx(
                'p-2 rounded-md transition-all duration-200',
                'bg-white bg-opacity-20 hover:bg-opacity-30',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                query.trim() && !isLoading
                  ? 'text-white hover:scale-105'
                  : 'text-primary-300'
              )}
              title="发送查询"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <PaperAirplaneIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Query Suggestions */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <ClockIcon className="h-4 w-4 text-primary-200" />
          <span className="text-sm text-primary-200">快速查询建议：</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className={clsx(
                'px-3 py-1.5 text-sm rounded-full transition-all duration-200',
                'bg-white bg-opacity-15 border border-white border-opacity-30',
                'hover:bg-opacity-25 hover:scale-105',
                'text-primary-100 hover:text-white'
              )}
              disabled={isLoading}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Status indicators */}
      {isListening && (
        <div className="mt-4 flex items-center space-x-2 text-primary-200">
          <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-sm">正在监听...</span>
        </div>
      )}
    </div>
  );
};

export default NaturalLanguageQuery;