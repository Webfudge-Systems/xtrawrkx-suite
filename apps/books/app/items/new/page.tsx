import { redirect } from 'next/navigation'

/** Legacy /items/new → default items list add flow. */
export default function ItemsNewRedirectPage() {
  redirect('/items/all/new')
}
