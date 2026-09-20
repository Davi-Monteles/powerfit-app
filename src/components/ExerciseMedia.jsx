import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getExerciseMedia } from '../lib/exercise-media';

export default function ExerciseMedia({ exercise }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const media = getExerciseMedia(exercise);
  const showImage = media.hasMedia && media.gif && failedSrc !== media.gif;
  const isFutureMedia = media.mediaStatus === 'needs_asset';
  const statusLabel = isFutureMedia ? 'Sem GIF' : 'A classificar';
  const statusClass = isFutureMedia ? 'future' : 'placeholder';
  const title = [media.label, media.primaryMuscle, media.equipment, media.level].filter(Boolean).join(' - ');

  return (
    <div className="exercise-media" title={title}>
      <div className={`exercise-media-thumb exercise-media-thumb-${statusClass}`}>
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
            <span className="exercise-media-status">{statusLabel}</span>
          </div>
        )}
      </div>
      <div className="exercise-media-meta">
        <div className="exercise-media-badges">
          <span className="exercise-media-badge exercise-media-badge-primary" title={media.primaryMuscle || 'Livre'}>{media.primaryMuscle || 'Livre'}</span>
          <span className="exercise-media-badge" title={media.equipment}>{media.equipment}</span>
          {media.level && <span className="exercise-media-badge exercise-media-badge-level" title={media.level}>{media.level}</span>}
        </div>
        {media.shortInstruction && <p>{media.shortInstruction}</p>}
      </div>
    </div>
  );
}
