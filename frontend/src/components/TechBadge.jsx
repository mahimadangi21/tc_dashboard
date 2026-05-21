import React from 'react';

export const TechBadge = ({ name, proficiency }) => {
  const getProficiencyColors = (level) => {
    switch (level?.toLowerCase()) {
      case 'advanced':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'intermediate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'beginner':
      default:
        return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getProficiencyColors(proficiency)}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
      <span className="text-white font-medium mr-1">{name}</span>
      <span className="opacity-90">{proficiency || 'Beginner'}</span>
    </div>
  );
};

export default TechBadge;
