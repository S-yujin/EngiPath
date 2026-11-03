import { LocalizedText, uiAttr, translateUi } from '../../i18n/uiText';
import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserFeedbackState } from '../../types';
import { ThumbsUp, ThumbsDown, MessageSquare, Check, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgreementButtonsProps {
  initialState?: UserFeedbackState;
  initialNote?: string;
  onFeedbackChange: (state: UserFeedbackState, note?: string) => void;
  className?: string;
}

export const AgreementButtons: React.FC<AgreementButtonsProps> = ({
  initialState = 'none',
  initialNote = '',
  onFeedbackChange,
  className = ''
}) => {
  const { language } = useApp();
  const [feedbackState, setFeedbackState] = useState<UserFeedbackState>(initialState);
  const [isAddingContext, setIsAddingContext] = useState<boolean>(false);
  const [contextText, setContextText] = useState<string>(initialNote);

  const handleAgree = () => {
    const next = feedbackState === 'agreed' ? 'none' : 'agreed';
    setFeedbackState(next);
    setIsAddingContext(false);
    onFeedbackChange(next, contextText);
  };

  const handleDisagree = () => {
    const next = feedbackState === 'disagreed' ? 'none' : 'disagreed';
    setFeedbackState(next);
    setIsAddingContext(false);
    onFeedbackChange(next, contextText);
  };

  const handleToggleContext = () => {
    setIsAddingContext(!isAddingContext);
  };

  const handleSaveContext = (e: React.FormEvent) => {
    e.preventDefault();
    if (contextText.trim()) {
      setFeedbackState('context-added');
      setIsAddingContext(false);
      onFeedbackChange('context-added', contextText.trim());
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-500 mr-1"><LocalizedText en={"Your Take:"} /></span>

        {/* Agree Button */}
        <button
          onClick={handleAgree}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            feedbackState === 'agreed'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300'
              : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200'
          }`}
          title={uiAttr("I agree with this assessment")}
        >
          <ThumbsUp className="w-3 h-3" />
          <span><LocalizedText en={"Agree"} /></span>
        </button>

        {/* Disagree Button */}
        <button
          onClick={handleDisagree}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            feedbackState === 'disagreed'
              ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-300'
              : 'bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 border border-slate-200'
          }`}
          title={uiAttr("I disagree with this assessment")}
        >
          <ThumbsDown className="w-3 h-3" />
          <span><LocalizedText en={"Disagree"} /></span>
        </button>

        {/* Add Context Button */}
        <button
          onClick={handleToggleContext}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            feedbackState === 'context-added' || isAddingContext
              ? 'bg-brand-navy text-white shadow-sm ring-2 ring-blue-300'
              : 'bg-slate-100 hover:bg-blue-50 hover:text-brand-navy text-slate-600 border border-slate-200'
          }`}
          title={uiAttr("Provide additional background or evidence")}
        >
          <MessageSquare className="w-3 h-3" />
          <span>{translateUi(feedbackState === 'context-added' ? 'Edit Context' : 'Add Context', language)}</span>
        </button>

        {/* Feedback Badge Confirmation */}
        {feedbackState === 'agreed' && (
          <span className="text-[10px] font-bold text-emerald-700 ml-auto flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <Check className="w-3 h-3" /> <LocalizedText en={"Confirmed"} />{' '}</span>
        )}
        {feedbackState === 'disagreed' && (
          <span className="text-[10px] font-bold text-rose-700 ml-auto flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <X className="w-3 h-3" /> <LocalizedText en={"Feedback Noted"} />{' '}</span>
        )}
        {feedbackState === 'context-added' && (
          <span className="text-[10px] font-bold text-blue-700 ml-auto flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            <MessageSquare className="w-3 h-3" /> <LocalizedText en={"Context Attached"} />{' '}</span>
        )}
      </div>

      {/* Context Drawer Form */}
      <AnimatePresence>
        {isAddingContext && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSaveContext}
            className="mt-1 p-2.5 rounded-xl bg-slate-50 border border-slate-300 shadow-inner flex flex-col gap-2"
          >
            <label className="text-[11px] font-semibold text-slate-700">
              <LocalizedText en={"Add your context (e.g., extracurricular project, bootcamp, lab course):"} />{' '}</label>
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              placeholder={uiAttr("e.g. Actually, I built a ROS2 robot during our hackathon last month and wrote custom Python nodes...")}
              rows={2}
              className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-brand-teal focus:border-brand-teal outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddingContext(false)}
                className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
              >
                <LocalizedText en={"Cancel"} />{' '}</button>
              <button
                type="submit"
                className="flex items-center gap-1 px-3 py-1 bg-brand-navy hover:bg-brand-navyLight text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <Send className="w-3 h-3" />
                <span><LocalizedText en={"Save Context"} /></span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};
