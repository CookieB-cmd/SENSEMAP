import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { ReleaseBanner } from './ReleaseBanner'

describe('ReleaseBanner', () => {
  it('labels an RC and explains that contributions are real', async () => {
    await i18n.changeLanguage('en')
    render(
      <I18nextProvider i18n={i18n}>
        <ReleaseBanner release={{ channel: 'rc', version: 'v0.1.0-rc1' }} />
      </I18nextProvider>,
    )
    expect(screen.getByText(/v0\.1\.0-rc1/)).toBeInTheDocument()
    expect(screen.getByText(/contributions.*retained/i)).toBeInTheDocument()
  })

  it('renders nothing when this is not an RC build', () => {
    const { container } = render(<ReleaseBanner release={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
