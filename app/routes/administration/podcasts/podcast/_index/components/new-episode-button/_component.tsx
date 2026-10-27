import { Form, href } from 'react-router'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'

type Props = {
  podcastId: string
  className?: string
}

/**
 * *Nová epizoda* creates the draft and opens its editor (design 27d, log
 * 0020), so it posts.
 */
export const NewEpisodeButton = ({ podcastId, className }: Props) => (
  <Form
    action={href('/administration/podcasts/:podcastId/episodes/add-episode', {
      podcastId,
    })}
    className={className}
    method={'post'}
  >
    <AuthenticityTokenInput />
    <Button type={'submit'}>Nová epizoda</Button>
  </Form>
)
