import { useState } from 'react';
import { Dumbbell } from 'lucide-react';
import { getExerciseMedia } from '../lib/exercise-media';

export default function ExerciseMedia({ exercise }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const media = getExerciseMedia(exercise);
  const showImage = media.hasMedia && media.gif && failedSrc !== media.gif;
  const detail = media.muscleGroups[0] || media.equipment;

  return (
    <div className="exercise-media" title={`${media.label} - ${media.equipment}`}>
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
          <span>GIF em breve</span>
        </div>
      )}
      {detail && <small>{detail}</small>}
    </div>
  );
}
