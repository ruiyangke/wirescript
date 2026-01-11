import { generate as DefaultImage } from 'fumadocs-ui/og';
import { ImageResponse } from 'next/og';

export const revalidate = false;

export async function GET() {
  return new ImageResponse(
    (
      <DefaultImage
        title="Wireframes that live with your docs"
        description="A Lisp dialect for creating wireframes that embed directly into Markdown. Pure text, AI-native, perfect for documentation."
        site="WireScript"
      />
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
