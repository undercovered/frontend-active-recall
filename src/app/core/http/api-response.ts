/**
 * Standard response envelope returned by the backend API.
 * Success and error responses share this shape:
 *   - data: the payload (or null when there's nothing / on error)
 *   - msg:  a human-friendly message (may be empty)
 */
export interface ApiResponse<T> {
  data: T;
  msg: string;
}
