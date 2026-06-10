import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getExerciseMedia } from '../lib/exercise-media';

export default function ExerciseMedia({ exercise }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const media = getExerciseMedia(exercise);
  const showImage = media.hasMedia && media.gif && failedSrc !== media.gif;
  const statusLabel = media.mediaStatus === 'needs_asset' ? 'Sem GIF' : 'Placeholder';
  const title = [media.label, media.primaryMuscle, media.equipment, media.level].filter(Boolean).join(' - ');

  return (
    <div className="exercise-media" title={title}>
      <div className={`exercise-media-thumb exercise-media-thumb-${media.mediaStatus || 'placeholder'}`}>
        {showImage ? (
          <img
            src={media.gif}
            alt={`Demonstracao de ${media.label}`}
            loading="lazy"
            onError={() => setFailedSrc(media.gif)}
          />
        ) : (
          <div className="exercise-media-fallback" aria-label={`Midia de ${media.label} indisponivel`}>
            <Dumbbell size={18} />
            <span>{statusLabel}</span>
          </div>
        )}
      </div>
      <div className="exercise-media-meta">
        <strong>{media.primaryMuscle || 'Livre'}</strong>
        <span>{media.equipment}</span>
        {media.level && <span>{media.level}</span>}
        {media.shortInstruction && <p>{media.shortInstruction}</p>}
      </div>
    </div>
  );
}
