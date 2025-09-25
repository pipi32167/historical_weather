/**
 * 联系表单组件
 * 替换 mailto: 链接，提供更好的用户体验
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Send, User, MessageCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface ContactFormProps {
  className?: string;
  onClose?: () => void;
  compact?: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ 
  className = '', 
  onClose,
  compact = false 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('contact.errors.nameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.errors.emailInvalid');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.errors.subjectRequired');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contact.errors.messageRequired');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.errors.messageMinLength');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // 模拟表单提交 - 在实际应用中，这里会发送到后端API或第三方服务
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 这里可以集成各种表单服务：
      // 1. Formspree: https://formspree.io/
      // 2. Netlify Forms: https://www.netlify.com/products/forms/
      // 3. EmailJS: https://www.emailjs.com/
      // 4. 自己的后端API
      
      console.log('Contact form submitted:', formData);
      
      setSubmitStatus('success');
      
      // 重置表单
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      // 3秒后自动关闭或重置状态
      setTimeout(() => {
        if (onClose) {
          onClose();
        } else {
          setSubmitStatus('idle');
        }
      }, 3000);
      
    } catch (error) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // 成功状态渲染
  if (submitStatus === 'success') {
    return (
      <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
              {t('contact.success.title')}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t('contact.success.message')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-custom ${className}`}>
      {!compact && (
        <div className="border-b border-custom p-6">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            <h2 className="text-xl font-semibold text-primary">
              {t('contact.form.title')}
            </h2>
          </div>
          <p className="mt-2 text-sm text-secondary">
            {t('contact.form.description')}
          </p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* 姓名字段 */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <User className="w-4 h-4 inline mr-1" />
            {t('contact.form.name')} *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleInputChange('name')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${
              errors.name ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('contact.form.namePlaceholder')}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
          )}
        </div>

        {/* 邮箱字段 */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <Mail className="w-4 h-4 inline mr-1" />
            {t('contact.form.email')} *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${
              errors.email ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('contact.form.emailPlaceholder')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
        </div>

        {/* 主题字段 */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MessageCircle className="w-4 h-4 inline mr-1" />
            {t('contact.form.subject')} *
          </label>
          <input
            type="text"
            id="subject"
            value={formData.subject}
            onChange={handleInputChange('subject')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white ${
              errors.subject ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('contact.form.subjectPlaceholder')}
          />
          {errors.subject && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject}</p>
          )}
        </div>

        {/* 消息字段 */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <MessageCircle className="w-4 h-4 inline mr-1" />
            {t('contact.form.message')} *
          </label>
          <textarea
            id="message"
            rows={compact ? 3 : 5}
            value={formData.message}
            onChange={handleInputChange('message')}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white resize-vertical ${
              errors.message ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'
            }`}
            placeholder={t('contact.form.messagePlaceholder')}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.message.length}/500 {t('contact.form.characters')}
          </p>
        </div>

        {/* 提交状态 */}
        {submitStatus === 'error' && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {t('contact.error.message')}
              </p>
            </div>
          </div>
        )}

        {/* 提交按钮 */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            * {t('contact.form.required')}
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex items-center space-x-2 px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed text-white rounded-md transition-colors ${
              isSubmitting ? 'opacity-75' : ''
            }`}
          >
            <Send className={`w-4 h-4 ${isSubmitting ? 'animate-pulse' : ''}`} />
            <span>
              {isSubmitting ? t('contact.form.sending') : t('contact.form.send')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;