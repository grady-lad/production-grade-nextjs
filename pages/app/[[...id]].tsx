import React, { FC, useState } from 'react'
import { Pane, Dialog, majorScale, InboxGeoIcon } from 'evergreen-ui'
import { useRouter } from 'next/router'
import { getSession, useSession } from 'next-auth/client'
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
  folders: [{ _id: 1, name: 'hello' }],
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
  const session = await getSession()

  return {
    props: {
      session,
    },
  }
}

export default App
