/**
 * photoUtils.js
 *
 * פונקציות עזר לטיפול בתמונות עם תאימות לאחור מלאה.
 *
 * לוגיקת בחירת URL:
 *   - תמונות חדשות: יש להן file_urls.{thumbnail|medium|original}
 *   - תמונות ישנות (legacy): יש להן file_url בלבד
 *
 * הפונקציות מחזירות תמיד את ה-URL הנכון ביותר,
 * ונופלות חזרה ל-file_url אם file_urls לא קיים.
 */

/**
 * מחזיר את ה-URL המתאים לתצוגה בגלריה (Thumbnail).
 * @param {Object} photo - אובייקט Photo
 * @returns {string} URL לתמונה
 */
export function getThumbnailUrl(photo) {
  return photo?.file_urls?.thumbnail || photo?.file_url || '';
}

/**
 * מחזיר את ה-URL המתאים לצפייה מורחבת (Medium).
 * @param {Object} photo - אובייקט Photo
 * @returns {string} URL לתמונה
 */
export function getMediumUrl(photo) {
  return photo?.file_urls?.medium || photo?.file_url || '';
}

/**
 * מחזיר את ה-URL המתאים להורדה מלאה (Original).
 * @param {Object} photo - אובייקט Photo
 * @returns {string} URL לתמונה
 */
export function getOriginalUrl(photo) {
  return photo?.file_urls?.original || photo?.file_url || '';
}

/**
 * בודק האם לתמונה יש גרסאות מרובות (תמונה חדשה).
 * @param {Object} photo - אובייקט Photo
 * @returns {boolean}
 */
export function hasMultipleVersions(photo) {
  return !!(photo?.file_urls?.thumbnail && photo?.file_urls?.medium && photo?.file_urls?.original);
}