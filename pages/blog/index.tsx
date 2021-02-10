import React from 'react'
import { Pane, majorScale } from 'evergreen-ui'
import matter from 'gray-matter'
import path from 'path'
import fs from 'fs'
import orderby from 'lodash.orderby'
import Container from '../../components/container'
import HomeNav from '../../components/homeNav'
import PostPreview from '../../components/postPreview'
import { posts as postsFromCMS } from '../../content'

const Blog = ({ posts }) => {
  return (
    <Pane>
      <header>
        <HomeNav />
      </header>
      <main>
        <Container>
          {posts.map((post) => (
            <Pane key={post.title} marginY={majorScale(5)}>
              <PostPreview post={post} />
            </Pane>
          ))}
        </Container>
      </main>
    </Pane>
  )
}

Blog.defaultProps = {
  posts: [],
}

/**
 * The below function gets content from a CMS and read files from the file system to generate the list of posts.
 *
 * In theory you wouldn't really want to combine these apporaches. You would probably use one approach over the other.
 *
 * The main take away here is that within `getStaticProps` we can run code that is only applicable to
 * Node (server side code).
 *
 * This is possible because the page is constructed at build time. By the time a user acesses this page
 * in the browser all references to node specific code will be gone. This is achieved by rendering this
 * component at runtime into a static HTML file. Nextjs with Vercel also  provides a CDN meaning
 * that this content will be cached until the next build.
 *
 */
export function getStaticProps() {
  const cmsPosts = postsFromCMS.published.map((item) => {
    const { data } = matter(item)

    return data
  })

  // read the posts dir from the fs
  const postsDirectory = path.join(process.cwd(), 'posts')
  const fileNames = fs.readdirSync(postsDirectory)

  const filePosts = fileNames.map((name) => {
    const filePath = path.join(postsDirectory, name)
    const file = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(file)

    return data
  })

  const posts = [...cmsPosts, ...filePosts]

  return { props: { posts } }
}

export default Blog
