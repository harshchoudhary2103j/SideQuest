import { useContext } from 'react';
import { SquadContext } from './squadContextDef';
import type { SquadContextValue } from './squadContextDef';

export const useSquad = (): SquadContextValue => {
  const context = useContext(SquadContext);
  if (!context) {
    throw new Error('useSquad must be used within a SquadProvider');
  }
  return context;
};
