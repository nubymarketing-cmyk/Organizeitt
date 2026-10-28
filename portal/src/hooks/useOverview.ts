import { useQuery } from '@tanstack/react-query';
import { getOverview, listActivity } from '../services/overview';

export function useOverview() {
  return useQuery({ queryKey: ['overview'], queryFn: getOverview });
}

export function useActivity(limit = 30) {
  return useQuery({ queryKey: ['activity', limit], queryFn: () => listActivity(limit) });
}
