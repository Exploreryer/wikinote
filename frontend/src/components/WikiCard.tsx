import { Share2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';
import { useI18n } from '../hooks/useI18n';
import type { ArticleProps } from '../types/ArticleProps';
import '../styles/WikiCard.css';

export function WikiCard({ article }: ArticleProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [shareError, setShareError] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);
    const { toggleLike, isLiked } = useLikedArticles();
    const { t } = useI18n();

    const handleShare = async () => {
        setShareError(false);
        setShareSuccess(false);
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.displaytitle,
                    text: article.extract || '',
                    url: article.url
                });
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    setShareError(true);
                }
            }
        } else {
            // Fallback: Copy to clipboard
            try {
                await navigator.clipboard.writeText(article.url);
                setShareSuccess(true);
                setTimeout(() => setShareSuccess(false), 2000);
                // Use better notification method
                const notification = document.createElement('div');
                notification.textContent = t('common.copied');
                notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 2000);
            } catch (error) {
                console.error('Error copying to clipboard:', error);
                setShareError(true);
            }
        }
    };

    return (
        <div className="wiki-card hover:shadow-lg transition-shadow duration-300">
            <div className="wiki-card-image">
                {article.thumbnail ? (
                    <img
                        loading="lazy"
                        src={article.thumbnail.source}
                        alt={article.displaytitle}
                        className={`${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                        onLoad={() => setImageLoaded(true)}
                        onError={(e) => {
                            console.error('Image failed to load:', e);
                            setImageLoaded(true);
                        }}
                    />
                ) : (
                    <div className="bg-gray-200 h-full w-full" />
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                    <button
                        onClick={() => toggleLike(article)}
                        className={`w-10 h-10 glass-button flex items-center justify-center ${isLiked(article.pageid) 
                            ? 'text-red-500 liked' 
                            : 'text-white hover:text-red-500'
                        }`}
                        aria-label={t('common.like')}
                        title={t('common.like')}
                    >
                        <Heart className="w-5 h-5" fill={isLiked(article.pageid) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleShare}
                        className={`w-10 h-10 glass-button flex items-center justify-center text-white hover:text-blue-500 ${shareError ? 'text-red-500' : ''} ${shareSuccess ? 'share-active' : ''}`}
                        aria-label={t('common.share')}
                        title={t('common.share')}
                    >
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="wiki-card-content">
                <h3 className="wiki-card-title hover:text-blue-500 transition-colors duration-300">
                    <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {article.displaytitle}
                    </a>
                </h3>
                <p className="wiki-card-excerpt">{article.extract}</p>
            </div>
        </div>
    );
}
