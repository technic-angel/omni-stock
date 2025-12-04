import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import ConfirmDialog from './ConfirmDialog'

describe('ConfirmDialog', () => {
  const baseProps = {
    isOpen: true,
    title: 'Confirm delete',
    description: 'Are you sure?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('renders title and description when open', () => {
    render(<ConfirmDialog {...baseProps} />)
    expect(screen.getByText('Confirm delete')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('invokes callbacks', () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<ConfirmDialog {...baseProps} onConfirm={onConfirm} onCancel={onCancel} />)

    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()

    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('does not render when closed', () => {
    render(<ConfirmDialog {...baseProps} isOpen={false} />)
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument()
  })
})
