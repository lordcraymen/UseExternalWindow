import { WindowFeatures } from './types';

/**
 * Convert WindowFeatures object to window.open() features string
 * @param features - WindowFeatures object
 * @returns Serialized features string
 */
export function serializeWindowFeatures(features: WindowFeatures): string {
  return Object.entries(features)
    .map(([key, value]) => {
      if (value === undefined || value === null) {
        return null;
      }
      
      // Convert boolean to yes/no string
      if (typeof value === 'boolean') {
        return `${key}=${value ? 'yes' : 'no'}`;
      }
      
      // Use value as-is for numbers and 'yes'/'no' strings
      return `${key}=${value}`;
    })
    .filter(Boolean)
    .join(',');
}
