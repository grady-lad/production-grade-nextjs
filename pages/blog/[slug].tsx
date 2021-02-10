import React, { FC } from 'react'
import hydrate from 'next-mdx-remote/hydrate'
import { majorScale, Pane, Heading, Spinner } from 'evergreen-ui'
import Head from 'next/head'
import { useRouter } from 'next/router'
import renderToString from 'next-mdx-remote/render-to-string'
import matter from 'gray-matter'
import fs from 'fs'
import path from 'path'
import { Post } from '../../types'
import Container from '../../components/container'
import HomeNav from '../../components/homeNav'
import { posts } from '../../content'

const BlogPost: FC<Post> = ({ source, frontMatter }) => {
  const content = hydrate(source)
  const router = useRouter()

  /**
   * If fallback is set to true within getStaticProps and we
   * have not found a related blog post e.g. blog/new-or-invalid-id
   * We will land here while nextjs tries to build the page.
   *
   * If the fallback option is 'blocking' then we would never come here.
   * The user wouldn't see anything on the screen while nextjs tries to
   * find/build the blog post.
   */
  if (router.isFallback) {
    return (
      <Pane width="100%" height="100%">
        <Spinner size={48} />
      </Pane>
    )
  }
  return (
    <Pane>
      <Head>
        <title>{`Known Blog | ${frontMatter.title}`}</title>
        <meta name="description" content={frontMatter.summary} />
      </Head>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          <Heading fontSize="clamp(2rem, 8vw, 6rem)" lineHeight="clamp(2rem, 8vw, 6rem)" marginY={majorScale(3)}>
            {frontMatter.title}
          </Heading>
          <Pane>{content}</Pane>
        </Container>
      </main>
    </Pane>
  )
}

BlogPost.defaultProps = {
  source: '',
  frontMatter: { title: 'default title', summary: 'summary', publishedOn: '' },
}

/**
 * getStaticPaths will not work without getStaticProps.
 *
 * getStaticPaths is used to generate all the paths for dynamic routes. Since our content is generated at build
 * time we need some mechanism to generate all the possible paths for the dyamic route.
 *
 * In this case the dynamic route is blog/:id
 *
 * Important to note: You don't have to generate every possible path at build time.
 * If we specify the fallback prop to true | blocking `getStaticProps` can handle generate the content for a page
 * at run time (When the user tries to access the resource). Once the content is generate it is cached within the CDN.
 *
 * @return {
 *  paths: Array<{ params: { slug: string }}>,
 *  fallback: boolean | blocking
 * }
 *
 */
export function getStaticPaths() {
  // read the posts dir from the fs
  const postsDirectory = path.join(process.cwd(), 'posts')
  const fileNames = fs.readdirSync(postsDirectory)

  const slugs = fileNames.map((name) => {
    const filePath = path.join(postsDirectory, name)
    const file = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(file)

    return data
  })

  return {
    paths: slugs.map(({ slug }) => ({ params: { slug } })),
    fallback: true, // Will kick of getStaticProps when user tries access the page will also be caught by router.isFallback within the component to display a loading indicator.
    /** fallback: false // If you try navigate to a page which with an invalid slug the user will recieve a 404. (Question how to customise the 404?) */
    /** fallback: blocking // No UI will be shown to the user while nextjs tries to build/find the missing page. */
  }
}

/**
 *
 * @param params Is the result from getStaticPaths which contains a list of all the possible paths for the blog content.
 *
 * We have a try catch so that if a path is not found at runtime nextjs will then try to generate the content.
 * If nextjs cannot generate the content then we need to do some error handling. (Not sure the best approach on how to do this. Needs research)
 *
 * If the content is generated at build time when is getStaticProps called????
 *
 *    When we build the app nextjs will generate all the dynamic pages using getStaticPaths and getStaticProps. The content for these pages are then cached
 *    within the CDN. If the user hits a route than doesn't exist "yet" nextjs will run the getStaticProps function. If there is content to generate then
 *    the new HTML will be generated and cached so that the subsequent requests to this route won't trigger getStaticProps again.
 *
 * The above is a good strategy when we need to generate a lot of content at build time. An application could build only a subsequent amount of pages at build
 * time and then generate the rest on demand. The first user takes the hit and the subsequent users get the performance gains. I suppose if your pages are being
 * visted rarely and the conversion of every person is very important than maybe this isn't the best approach? I suppose it all depends on your app uses cases.
 *
 */
export async function getStaticProps({ params, preview }) {
  let post

  try {
    // read the posts dir from the fs
    const filePath = path.join(process.cwd(), 'posts', `${params.slug}.mdx`)
    post = fs.readFileSync(filePath, 'utf-8')
  } catch {
    /**
     * If the fallback prop within getStaticPaths is set to false then we can never use the preview prop. Important
     * to remember when generating previews.
     */
    const cmsPosts = (preview ? posts.draft : posts.published).map((p) => matter(p))

    const match = cmsPosts.find(({ data: { slug } }) => slug === params.slug)
    post = match.content
  }

  if (!post) {
    throw new Error('no post')
  }

  const { data } = matter(post)
  const mdxSource = await renderToString(post, { scope: data })

  return { props: { source: mdxSource, frontMatter: data } }
}

export default BlogPost
