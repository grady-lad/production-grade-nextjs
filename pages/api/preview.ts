import { NextApiResponse } from 'next'

/**
 * This handler will set a preview cookie on the FE. Once this cookie
 * has been set we can access the "preview" prop via getStaticProps.
 *
 * By doing this we can then asses which data to load depending on the preview value
 *
 * Look at the nextjs for a more in depth example: https://nextjs.org/docs/advanced-features/preview-mode#securely-accessing-it-from-your-headless-cms
 */
export default function handler(req, res: NextApiResponse) {
  // sets the preview cookie (Need to think about TTL. You don't want them to last for ages)
  // This will set __prerender_bypass & _next_preview_data cookies used by nextjs to determine that the latest content should always be shown!
  res.setPreviewData({})

  // redirects to the page you want to preview
  res.redirect(req.query.route)
}
