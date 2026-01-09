/**
 * CLI constants
 */

/** Default timeout for stdin reads in milliseconds */
export const STDIN_TIMEOUT_MS = 5000;

/** Padding added around wireframe for screenshots */
export const SCREENSHOT_PADDING_PX = 48;

/** Valid output formats for the render command */
export const VALID_FORMATS = ['html', 'png'] as const;
export type Format = (typeof VALID_FORMATS)[number];

/** Check if a string is a valid format */
export function isValidFormat(format: string): format is Format {
  return (VALID_FORMATS as readonly string[]).includes(format);
}
