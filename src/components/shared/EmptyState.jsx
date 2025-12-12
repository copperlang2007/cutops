import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

/**
 * Reusable empty state component
 * @param {object} props
 * @param {React.ElementType} props.icon - Lucide icon component
 * @param {string} props.title - Empty state title
 * @param {string} props.description - Empty state description
 * @param {string} props.actionLabel - Optional action button label
 * @param {function} props.onAction - Optional action handler
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white rounded-xl p-12 text-center shadow-sm"
    >
      {Icon && (
        <Icon className="w-16 h-16 mx-auto text-slate-300 mb-4" />
      )}
      <p className="text-slate-600 font-medium text-lg">{title}</p>
      {description && (
        <p className="text-slate-400 mt-2">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="mt-6 bg-teal-600 hover:bg-teal-700"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}