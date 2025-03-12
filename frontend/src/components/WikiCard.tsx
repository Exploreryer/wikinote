import { Share2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useLikedArticles } from '../contexts/LikedArticlesContext';
import '../styles/WikiCard.css';

export interface WikiArticle {
    title: string;
    displaytitle: string;
    extract: string;
    pageid: number;
    url: string;
    thumbnail: {
        source: string;
        width: number;
        height: number;
    };
}

interface WikiCardProps {
    article: WikiArticle;
}

export function WikiCard({ article }: WikiCardProps) {
    const [imageLoaded, setImageLoaded] = useState(false);
    const { toggleLike, isLiked } = useLikedArticles();

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.displaytitle,
                    text: article.extract || '',
                    url: article.url
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: Copy to clipboard
            await navigator.clipboard.writeText(article.url);
            alert('Link copied to clipboard!');
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
                        className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300 ${isLiked(article.pageid) ? 'bg-red-500/80 hover:bg-red-500/90 scale-110' : 'bg-white/10 hover:bg-white/20'}`}
                        aria-label="Like article"
                    >
                        <Heart className="w-5 h-5" fill={isLiked(article.pageid) ? 'currentColor' : 'none'} />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 hover:scale-110"
                        aria-label="Share article"
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
