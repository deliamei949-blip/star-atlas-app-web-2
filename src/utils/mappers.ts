import type { Capture, Star, Connection, BlackHole } from '@/types'

/**
 * Map a raw database row (snake_case columns) to a typed Capture object (camelCase).
 */
export function mapCapture(row: Record<string, unknown>): Capture {
  return {
    id: row.id as string,
    starName: (row.star_name as string) || '',
    sourceText: (row.source_text as string) || '',
    sourceApp: row.source_app as string | undefined,
    sourceUrl: row.source_url as string | undefined,
    myRewrite: (row.my_rewrite as string) || '',
    isQuestion: !!row.is_question,
    processed: !!row.processed,
    capturedAt: (row.captured_at as string) || '',
    processedAt: row.processed_at as string | undefined,
  }
}

/**
 * Map a raw database row (snake_case columns) to a typed Star object (camelCase).
 */
export function mapStar(row: Record<string, unknown>): Star {
  return {
    id: row.id as string,
    starName: (row.star_name as string) || undefined,
    surfaceText: (row.surface_text as string) || '',
    originalSignal: row.original_signal as string | undefined,
    myDecode: row.my_decode as string | undefined,
    correctionMark: row.correction_mark as string | undefined,
    resonanceFreq: row.resonance_freq as string | undefined,
    decayBoundary: row.decay_boundary as string | undefined,
    unsolvedSignal: row.unsolved_signal as string | undefined,
    form: (row.form as number) || 1,
    positionX: (row.position_x as number) || 0,
    positionY: (row.position_y as number) || 0,
    positionZ: (row.position_z as number) || 0,
    captureId: row.capture_id as string | undefined,
    hasDeduction: !!row.has_deduction,
    deductionCount: (row.deduction_count as number) || 0,
    createdAt: (row.created_at as string) || '',
    ignitedAt: row.ignited_at as string | undefined,
  }
}

/**
 * Map a raw database row (snake_case columns) to a typed Connection object (camelCase).
 */
export function mapConnection(row: Record<string, unknown>): Connection {
  return {
    id: row.id as string,
    starAId: row.star_a_id as string,
    starBId: row.star_b_id as string,
    relationType: row.relation_type as Connection['relationType'],
    note: row.note as string | undefined,
    createdAt: (row.created_at as string) || '',
  }
}

/**
 * Map a raw database row (snake_case columns) to a typed BlackHole object (camelCase).
 */
export function mapBlackHole(row: Record<string, unknown>): BlackHole {
  return {
    id: row.id as string,
    question: (row.question as string) || '',
    starId: row.star_id as string | undefined,
    positionX: (row.position_x as number) || 0,
    positionY: (row.position_y as number) || 0,
    positionZ: (row.position_z as number) || 0,
    createdAt: (row.created_at as string) || '',
  }
}
