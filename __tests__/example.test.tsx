import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// Simple example test to verify testing infrastructure works
describe('Testing Infrastructure', () => {
    it('should be properly configured', () => {
        const { container } = render(<div>Hello Test</div>)
        expect(container).toBeInTheDocument()
    })

    it('should find text content', () => {
        render(<div>Hello Test</div>)
        expect(screen.getByText('Hello Test')).toBeInTheDocument()
    })

    it('should perform basic assertions', () => {
        expect(true).toBe(true)
        expect(1 + 1).toBe(2)
        expect('test').toBeTruthy()
    })
})
