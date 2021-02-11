import React, { FC, useState } from 'react'
import { Pane, Dialog, majorScale, InboxGeoIcon } from 'evergreen-ui'
import { useRouter } from 'next/router'
import { getSession, useSession } from 'next-auth/client'
// When we render on the browser this code will not be here
import { connectToDB, folder, doc } from '../../db'
import Logo from '../../components/logo'
import FolderList from '../../components/folderList'
import NewFolderButton from '../../components/newFolderButton'
import User from '../../components/user'
import FolderPane from '../../components/folderPane'
import DocPane from '../../components/docPane'
import NewFolderDialog from '../../components/newFolderDialog'

const App: FC<{ folders?: any[]; activeFolder?: any; activeDoc?: any; activeDocs?: any[] }> = ({
  folders,
  activeDoc,
  activeFolder,
  activeDocs,
}) => {
  const [session, loading] = useSession()
  const router = useRouter()
  const [newFolderIsShown, setIsShown] = useState(false)

  const Page = () => {
    if (activeDoc) {
      return <DocPane folder={activeFolder} doc={activeDoc} />
    }

    if (activeFolder) {
      return <FolderPane folder={activeFolder} docs={activeDocs} />
    }

    return null
  }

  if (loading) {
    return null
  }

  if (!loading && !session) {
    return (
      <Dialog
        isShown
        title="Session expired"
        confirmLabel="Ok"
        hasCancel={false}
        hasClose={false}
        shouldCloseOnOverlayClick={false}
        shouldCloseOnEscapePress={false}
        onConfirm={() => router.push('/signin')}
      >
        Sign in to continue
      </Dialog>
    )
  }

  return (
    <Pane position="relative">
      <Pane width={300} position="absolute" top={0} left={0} background="tint2" height="100vh" borderRight>
        <Pane padding={majorScale(2)} display="flex" alignItems="center" justifyContent="space-between">
          <Logo />

          <NewFolderButton onClick={() => setIsShown(true)} />
        </Pane>
        <Pane>
          <FolderList folders={folders} />{' '}
        </Pane>
      </Pane>
      <Pane marginLeft={300} width="calc(100vw - 300px)" height="100vh" overflowY="auto" position="relative">
        <User user={session.user} />
        <Page />
      </Pane>
      <NewFolderDialog close={() => setIsShown(false)} isShown={newFolderIsShown} onNewFolder={() => {}} />
    </Pane>
  )
}

App.defaultProps = {
  folders: [],
}

/**
 * getServerSideProps is blocking.
 * This function is executed everytime the route is accessed unless we use next/link to navigate between pages.
 * So when you use next/link the route is client-side routed. The page is pre-fetched if the page we are linking to is static. ( * Question: Is there a way to bypass the pre-fetching)
 * But if we are using getServerSideProps regardless of the linking mechanisim (next/link or anchor tag) getServerSideProps will always be executed.
 *
 *
 * @param ctx
 */
export async function getServerSideProps(ctx) {
  const session = await getSession(ctx)

  // not signed in
  if (!session || !session.user) {
    return {
      props: {},
    }
  }

  /**
   * The reason we are acessing the db directly is because we are already on the server.
   * Why would we send another request to the network to get data when we can acesses directly from the server.
   */
  const { db } = await connectToDB()
  const props: any = { session }
  const folders = await folder.getFolders(db, session.user.id)
  props.folders = folders

  // Route is /app/:id or app/:id/:docId
  if (ctx.params.id) {
    const activeFolder = folders.find((f) => f._id === ctx.params.id[0])
    const activeDocs = await doc.getDocsByFolder(db, activeFolder._id)

    props.activeFolder = activeFolder
    props.activeDocs = activeDocs

    const activeDocId = ctx.params.id[1]

    // Route is /app/:id/:docId
    if (activeDocId) {
      props.activeDoc = await doc.getOneDoc(db, activeDocId)
    }
  }

  return { props: { ...props } }
}

/**
 * Catch all handler. Must handle all different page
 * states.
 *
 * 1. Folders - none selected = /app
 * 2. Folders => Folder selected = app/1
 * 3. Folders => Folder selected => Document selected = app/1/2
 *
 * An unauth user should not be able to access this page.
 *
 */
export default App
