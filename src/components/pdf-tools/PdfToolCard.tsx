import { LucideIcon } from 'lucide-react';

interface PdfToolCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    onClick: () => void;
}

export function PdfToolCard({ title, description, icon: Icon, onClick }: PdfToolCardProps) {
    return (
        <button
            onClick={onClick}
            className="group flex flex-col items-start p-6 bg-white dark:bg-[#202c33] border border-gray-200 dark:border-gray-700/50 rounded-2xl text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-gold-500/50"
        >
            <div className="p-3 bg-gray-50 dark:bg-black/20 rounded-xl mb-4 group-hover:bg-gold-50 dark:group-hover:bg-gold-900/20 transition-colors duration-200">
                <Icon className="w-8 h-8 text-gray-700 dark:text-gray-300 group-hover:text-gold-600 dark:group-hover:text-gold-400 transition-colors duration-200" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1 line-clamp-2">{description}</p>
            <span className="text-sm font-medium text-gold-600 dark:text-gold-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                Usar ferramenta →
            </span>
        </button>
    );
}
