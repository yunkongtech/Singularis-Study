/**
 * Avatar-to-Gender Mapping & Gender-Aware Voice Resolution
 *
 * Maps avatar file paths to gender, and resolves appropriate TTS voices
 * based on agent gender for Doubao TTS (which has explicitly gendered voices).
 *
 * For providers without gendered voices (e.g. OpenAI), this is a no-op —
 * the global user-selected voice is used as-is.
 */

import { getTTSVoices } from './constants';
import type { TTSProviderId, TTSVoiceInfo } from './types';

type Gender = 'male' | 'female';

/**
 * Avatar filename → gender mapping.
 * Derived from visually inspecting all avatar images in /public/avatars/.
 */
const AVATAR_GENDER_MAP: Record<string, Gender> = {
  // Female avatars
  '/avatars/assist.png': 'female',
  '/avatars/assist-2.png': 'female',
  '/avatars/clown.png': 'female',
  '/avatars/clown-2.png': 'female',
  '/avatars/teacher-2.png': 'female',
  '/avatars/thinker.png': 'female',
  '/avatars/thinker-2.png': 'female',

  // Male avatars
  '/avatars/curious.png': 'male',
  '/avatars/curious-2.png': 'male',
  '/avatars/note-taker.png': 'male',
  '/avatars/note-taker-2.png': 'male',
  '/avatars/teacher.png': 'male',
};

/**
 * Infer gender from avatar path.
 * Falls back to 'male' if avatar is not in the map (conservative default).
 */
export function getGenderFromAvatar(avatar: string): Gender {
  return AVATAR_GENDER_MAP[avatar] ?? 'male';
}

/**
 * Deterministic seed from agentId for consistent random selection.
 */
function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Resolve TTS voice for a given agent based on gender.
 *
 * - For providers with gendered voices (doubao-tts), picks a voice matching
 *   the agent's gender. Uses agentId as a seed so the same agent always
 *   gets the same voice within a session.
 * - For other providers, returns undefined (use global user setting).
 *
 * @param explicitGender If provided, takes priority over avatar-based inference
 */
export function resolveVoiceForAgent(
  providerId: TTSProviderId,
  agentAvatar: string,
  agentId: string,
  explicitGender?: 'male' | 'female',
): string | undefined {
  const voices = getTTSVoices(providerId);

  // Only apply gender matching for providers with explicit gender info
  const hasGenderedVoices = voices.some(
    (v: TTSVoiceInfo) => v.gender === 'male' || v.gender === 'female',
  );
  if (!hasGenderedVoices) return undefined;

  // Prefer explicit gender from AgentConfig, fall back to avatar inference
  const gender = explicitGender || getGenderFromAvatar(agentAvatar);
  const matchingVoices = voices.filter((v: TTSVoiceInfo) => v.gender === gender);

  if (matchingVoices.length === 0) return undefined;

  // Deterministic selection: same agentId always picks the same voice
  const index = hashCode(agentId) % matchingVoices.length;
  return matchingVoices[index].id;
}
