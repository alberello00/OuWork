'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Database } from '@/lib/supabase/database.types';
import { db, unwrap } from './client';
import { keys } from './keys';
import type { Annotation, AnnotationKind } from './types';

// galaxy_id and created_by are set by the database
type AnnotationInsert = Database['public']['Tables']['annotations']['Insert'];

/** Annotations of a sphere (and of its sub-spheres when showing "All"). */
export function useAnnotations(sphereIds: string[]) {
  const key = keys.annotations(sphereIds.slice().sort().join(','));
  return useQuery({
    queryKey: key,
    enabled: sphereIds.length > 0,
    queryFn: async () =>
      unwrap(await db().from('annotations').select('*').in('sphere_id', sphereIds).order('created_at')),
  });
}

export interface NewAnnotation {
  id?: string;
  sphere_id: string;
  kind: AnnotationKind;
  data: Record<string, unknown>;
  x: number;
  y: number;
  rotation?: number;
}

export function useCreateAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: NewAnnotation) =>
      unwrap(await db().from('annotations').insert(a as unknown as AnnotationInsert).select('*').single()),
    onSuccess: (created) => {
      qc.setQueriesData<Annotation[]>({ queryKey: ['annotations'] }, (old) =>
        old && created && !old.some((a) => a.id === created.id) ? [...old, created] : old
      );
      void qc.invalidateQueries({ queryKey: ['annotations'] });
    },
  });
}

export function useUpdateAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; x?: number; y?: number; rotation?: number }) =>
      unwrap(await db().from('annotations').update(patch).eq('id', id).select('id').single()),
    onMutate: ({ id, ...patch }) => {
      qc.setQueriesData<Annotation[]>({ queryKey: ['annotations'] }, (old) =>
        old?.map((a) => (a.id === id ? { ...a, ...patch } : a))
      );
    },
    onError: () => void qc.invalidateQueries({ queryKey: ['annotations'] }),
  });
}

export function useDeleteAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Pick<Annotation, 'id' | 'data'>) => {
      unwrap(await db().from('annotations').delete().eq('id', a.id).select('id').single());
      const path = (a.data as { image_path?: string } | null)?.image_path;
      if (path) await db().storage.from('items').remove([path]);
    },
    onMutate: (a) => {
      qc.setQueriesData<Annotation[]>({ queryKey: ['annotations'] }, (old) => old?.filter((x) => x.id !== a.id));
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: ['annotations'] }),
  });
}
